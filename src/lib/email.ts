import type {
  EnquiryRecord,
  OrderStatusStage,
  StoreOrderRecord
} from "@/types/database";

/**
 * Sends a server-side email notification via Resend when a new enquiry or
 * private viewing request is submitted. Uses environment variables only.
 * Never logs sensitive customer details or API keys.
 */
export async function sendEnquiryNotificationEmail(
  enquiry: Pick<
    EnquiryRecord,
    | "enquiry_type"
    | "product_name"
    | "full_name"
    | "email"
    | "phone"
    | "preferred_contact"
    | "preferred_date"
    | "preferred_location"
    | "message"
  >
): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const toEmail =
    process.env.ADMIN_ALERT_EMAIL?.trim() ||
    process.env.CONCIERGE_NOTIFICATION_EMAIL?.trim();
  const fromEmail =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "STEPUP STORIES Concierge <onboarding@resend.dev>";

  if (!apiKey || !toEmail) {
    return { sent: false };
  }

  const typeLabels: Record<string, string> = {
    product_enquiry: "Timepiece Enquiry",
    private_viewing: "Private Viewing Request",
    general_concierge: "Concierge Consultation"
  };

  const subjectLabel = typeLabels[enquiry.enquiry_type] ?? "Concierge Enquiry";
  const subject = enquiry.product_name
    ? `[STEPUP STORIES] ${subjectLabel} — ${enquiry.product_name}`
    : `[STEPUP STORIES] ${subjectLabel}`;

  const lines = [
    `Enquiry Type: ${subjectLabel}`,
    enquiry.product_name ? `Timepiece: ${enquiry.product_name}` : null,
    `Client Name: ${enquiry.full_name}`,
    `Email: ${enquiry.email}`,
    enquiry.phone ? `Phone: ${enquiry.phone}` : null,
    enquiry.preferred_contact
      ? `Preferred Contact Method: ${enquiry.preferred_contact}`
      : null,
    enquiry.preferred_date
      ? `Preferred Viewing Date/Time: ${enquiry.preferred_date}`
      : null,
    enquiry.preferred_location
      ? `Viewing Preference: ${enquiry.preferred_location}`
      : null,
    "",
    "Message:",
    enquiry.message
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: enquiry.email,
        subject,
        text: lines
      })
    });

    return { sent: response.ok };
  } catch {
    return { sent: false };
  }
}

/**
 * Alerts approved admins when a new order arrives.
 * Dispatches email or push alerts ONLY when the relevant service and admin contact
 * settings are configured in server environment variables.
 */
export async function sendNewOrderAdminAlert(
  order: StoreOrderRecord
): Promise<{ emailSent: boolean; pushSent: boolean }> {
  let emailSent = false;
  let pushSent = false;

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const adminEmail =
    process.env.ADMIN_ALERT_EMAIL?.trim() ||
    process.env.CONCIERGE_NOTIFICATION_EMAIL?.trim();
  const fromEmail =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "STEPUP STORIES Orders <onboarding@resend.dev>";

  if (apiKey && adminEmail) {
    const itemLines = order.items
      .map(
        (i) =>
          `- ${i.quantity}x ${i.name} (₹${i.unit_price.toLocaleString("en-IN")})`
      )
      .join("\n");

    const text = [
      `New Order Received: ${order.order_number}`,
      `Date: ${new Date(order.created_at).toLocaleString("en-IN")}`,
      `Customer: ${order.customer_name} (${order.customer_email}, +91 ${order.customer_phone})`,
      `Delivery City/State: ${order.delivery_address.city}, ${order.delivery_address.state} - ${order.delivery_address.pincode}`,
      `Payment Method: ${order.payment_method.toUpperCase()} (${order.payment_status.toUpperCase()})`,
      `Total Amount: ₹${order.final_total.toLocaleString("en-IN")}`,
      "",
      "Items:",
      itemLines
    ].join("\n");

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [adminEmail],
          subject: `[STEPUP STORIES] New Order ${order.order_number} — ₹${order.final_total.toLocaleString("en-IN")}`,
          text
        })
      });
      emailSent = res.ok;
    } catch {
      emailSent = false;
    }
  }

  const pushWebhookUrl = process.env.ADMIN_PUSH_WEBHOOK_URL?.trim();
  if (pushWebhookUrl) {
    try {
      const res = await fetch(pushWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "new_order",
          order_number: order.order_number,
          final_total: order.final_total,
          currency: order.currency,
          payment_method: order.payment_method,
          payment_status: order.payment_status,
          created_at: order.created_at
        })
      });
      pushSent = res.ok;
    } catch {
      pushSent = false;
    }
  }

  return { emailSent, pushSent };
}

const STATUS_STAGE_LABELS: Record<OrderStatusStage, string> = {
  new: "New",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refund_requested: "Refund Requested"
};

/**
 * Notifies a customer about an order status update ONLY when a verified email,
 * SMS, or push service is configured in server environment variables.
 */
export async function sendOrderStatusCustomerNotification(
  order: StoreOrderRecord,
  newStatus: OrderStatusStage
): Promise<{ sent: boolean; channel: "email" | "sms_webhook" | null }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "STEPUP STORIES <onboarding@resend.dev>";

  const readableStatus = STATUS_STAGE_LABELS[newStatus] ?? newStatus;

  if (apiKey && order.customer_email) {
    const trackingLine =
      order.courier_name || order.tracking_number
        ? `Courier & Tracking: ${[order.courier_name, order.tracking_number]
            .filter(Boolean)
            .join(" — ")}`
        : null;

    const text = [
      `Dear ${order.customer_name},`,
      "",
      `Your STEPUP STORIES order ${order.order_number} has been updated to: ${readableStatus}.`,
      trackingLine,
      `Order Total: ₹${order.final_total.toLocaleString("en-IN")}`,
      "",
      "Thank you for choosing STEPUP STORIES."
    ]
      .filter((line): line is string => line !== null)
      .join("\n");

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [order.customer_email],
          subject: `Order ${order.order_number} Update: ${readableStatus} — STEPUP STORIES`,
          text
        })
      });
      if (res.ok) {
        return { sent: true, channel: "email" };
      }
    } catch {
      // fall through
    }
  }

  const smsWebhook = process.env.CUSTOMER_NOTIFICATION_WEBHOOK_URL?.trim();
  if (smsWebhook) {
    try {
      const res = await fetch(smsWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "order_status_updated",
          order_number: order.order_number,
          customer_phone: order.customer_phone,
          customer_email: order.customer_email,
          new_status: newStatus,
          courier_name: order.courier_name,
          tracking_number: order.tracking_number
        })
      });
      if (res.ok) {
        return { sent: true, channel: "sms_webhook" };
      }
    } catch {
      // ignore
    }
  }

  return { sent: false, channel: null };
}

export function isAdminAlertServiceConfigured(): boolean {
  const hasEmail = Boolean(
    process.env.RESEND_API_KEY?.trim() &&
      (process.env.ADMIN_ALERT_EMAIL?.trim() ||
        process.env.CONCIERGE_NOTIFICATION_EMAIL?.trim())
  );
  const hasPush = Boolean(process.env.ADMIN_PUSH_WEBHOOK_URL?.trim());
  return hasEmail || hasPush;
}

export function isCustomerNotificationServiceConfigured(): boolean {
  const hasEmail = Boolean(process.env.RESEND_API_KEY?.trim());
  const hasWebhook = Boolean(
    process.env.CUSTOMER_NOTIFICATION_WEBHOOK_URL?.trim()
  );
  return hasEmail || hasWebhook;
}
