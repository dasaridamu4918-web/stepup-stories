import type { EnquiryRecord } from "@/types/database";

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
  const toEmail = process.env.CONCIERGE_NOTIFICATION_EMAIL?.trim();
  const fromEmail =
    process.env.RESEND_FROM_EMAIL?.trim() || "STEPUP STORIES Concierge <onboarding@resend.dev>";

  if (!apiKey || !toEmail) {
    // Email notification skipped cleanly until RESEND_API_KEY and CONCIERGE_NOTIFICATION_EMAIL are configured
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
    enquiry.preferred_contact ? `Preferred Contact Method: ${enquiry.preferred_contact}` : null,
    enquiry.preferred_date ? `Preferred Viewing Date/Time: ${enquiry.preferred_date}` : null,
    enquiry.preferred_location ? `Viewing Preference: ${enquiry.preferred_location}` : null,
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
