import { describe, it, expect, beforeEach } from "vitest";
import crypto from "crypto";
import {
  enquiryFormSchema,
  newsletterFormSchema,
  adminProductSchema,
  sanitizeText
} from "@/lib/validations";
import { resetRateLimitsForTest } from "@/lib/rate-limit";
import { POST as postEnquiry } from "@/app/api/enquiries/route";
import { POST as postNewsletter } from "@/app/api/newsletter/route";
import { buildMobileCatalog } from "@/lib/mobile-catalog";
import {
  createStoreOrder,
  getAdminDashboardData,
  getStoreOrderById,
  markOrderPaidByProvider,
  updateAdminOrderStatus
} from "@/lib/repository";
import { GET as getAdminCatalog, POST as postAdminCatalog } from "@/app/api/admin/catalog/route";
import { GET as getMobileOrders } from "@/app/api/mobile/orders/route";
import { GET as getWebsiteOrders, POST as postWebsiteOrder } from "@/app/api/orders/route";
import { POST as postRazorpayCreateOrder } from "@/app/api/payments/razorpay/create-order/route";
import { POST as postRazorpayVerify } from "@/app/api/payments/razorpay/verify/route";
import { POST as postRazorpayWebhook } from "@/app/api/razorpay/webhook/route";
import { NextRequest } from "next/server";

describe("STEPUP STORIES Zod Validation & Input Sanitization", () => {
  it("strips HTML/script tags from user input", () => {
    const dirty = `<script>alert("xss")</script>Hello <b>Concierge</b>`;
    expect(sanitizeText(dirty)).toBe(`alert("xss")Hello Concierge`);
  });

  it("validates a well-formed timepiece enquiry and normalizes email", () => {
    const res = enquiryFormSchema.safeParse({
      enquiry_type: "product_enquiry",
      product_name: "Signature Edition I",
      full_name: "Aarav Sharma",
      email: "AARAV@EXAMPLE.COM",
      preferred_contact: "email",
      message: "I would like to arrange a private consultation for this piece."
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.email).toBe("aarav@example.com");
    }
  });

  it("rejects enquiry with short message or invalid email", () => {
    const res = enquiryFormSchema.safeParse({
      enquiry_type: "general_concierge",
      full_name: "A",
      email: "invalid-email",
      message: "Too short"
    });
    expect(res.success).toBe(false);
  });

  it("requires explicit consent boolean for newsletter signup", () => {
    const invalid = newsletterFormSchema.safeParse({
      email: "collector@example.com",
      consent: false
    });
    expect(invalid.success).toBe(false);

    const valid = newsletterFormSchema.safeParse({
      email: "collector@example.com",
      consent: true
    });
    expect(valid.success).toBe(true);
  });

  it("validates admin product schema with flexible key/value specifications", () => {
    const prod = adminProductSchema.safeParse({
      slug: "signature-edition-i",
      name: "Signature Edition I",
      availability_status: "available",
      featured: true,
      published: true,
      specs: [{ key: "Case Material", value: "Brushed Gold" }]
    });
    expect(prod.success).toBe(true);
  });
});

describe("STEPUP STORIES Form API Routes (Enquiry & Newsletter)", () => {
  beforeEach(() => {
    resetRateLimitsForTest();
  });

  it("POST /api/enquiries creates an enquiry and returns 200", async () => {
    const req = new Request("http://localhost:3000/api/enquiries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "203.0.113.10"
      },
      body: JSON.stringify({
        enquiry_type: "private_viewing",
        product_name: "Signature Edition I",
        full_name: "Vikramaditya Rao",
        email: "vikram@example.com",
        preferred_contact: "email",
        preferred_date: "Saturday 4 PM",
        message: "I would like to book a private viewing for Signature Edition I."
      })
    });

    const res = await postEnquiry(req);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; id?: string };
    expect(json.ok).toBe(true);
    expect(json.id).toBeDefined();
  });

  it("POST /api/enquiries blocks invalid payloads with 400", async () => {
    const req = new Request("http://localhost:3000/api/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enquiry_type: "product_enquiry",
        full_name: "",
        email: "not-an-email",
        message: "short"
      })
    });

    const res = await postEnquiry(req);
    expect(res.status).toBe(400);
  });

  it("POST /api/newsletter prevents duplicate active subscriptions", async () => {
    const makeReq = () =>
      new Request("http://localhost:3000/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "203.0.113.55"
        },
        body: JSON.stringify({
          email: "unique.collector@example.com",
          full_name: "Meera Nair",
          consent: true
        })
      });

    const firstRes = await postNewsletter(makeReq());
    expect(firstRes.status).toBe(200);
    const firstJson = (await firstRes.json()) as {
      ok: boolean;
      alreadySubscribed: boolean;
    };
    expect(firstJson.ok).toBe(true);
    expect(firstJson.alreadySubscribed).toBe(false);

    const secondRes = await postNewsletter(makeReq());
    expect(secondRes.status).toBe(200);
    const secondJson = (await secondRes.json()) as {
      ok: boolean;
      alreadySubscribed: boolean;
    };
    expect(secondJson.ok).toBe(true);
    expect(secondJson.alreadySubscribed).toBe(true);
  });

  it("buildMobileCatalog returns 20 photo-backed watches with accurate INR savings and generic names when brand_verified is false", () => {
    const catalog = buildMobileCatalog("https://stepup-stories.vercel.app");
    expect(catalog.collections.length).toBe(5);
    expect(catalog.products.length).toBe(20);

    for (const prod of catalog.products) {
      expect(prod.price_currency).toBe("INR");
      expect(prod.price_amount).toBeGreaterThan(0);
      expect(prod.original_price_amount).toBeGreaterThanOrEqual(prod.price_amount);
      expect(prod.savings_amount).toBe(
        prod.original_price_amount - prod.price_amount
      );
      expect(prod.images.length).toBeGreaterThan(0);
      expect(prod.brand_verified).toBe(false);
      expect(prod.name).toBe(prod.generic_name);
    }
  });

  it("enforces server-side authorization on /api/admin/catalog and /api/mobile/orders", async () => {
    const adminGetRes = await getAdminCatalog();
    expect(adminGetRes.status).toBe(401);

    const adminPostRes = await postAdminCatalog(
      new Request("http://localhost:3000/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_order_status", payload: {} })
      })
    );
    expect(adminPostRes.status).toBe(401);

    const ordersGetRes = await getMobileOrders(
      new NextRequest("http://localhost:3000/api/mobile/orders")
    );
    expect(ordersGetRes.status).toBe(401);
  });

  it("creates orders with pending payment status, marks paid only on provider confirmation, and records admin status changes & audit logs", async () => {
    const order = await createStoreOrder({
      customer_name: "Rohan Mehta",
      customer_email: "rohan.mehta@example.com",
      customer_phone: "9876543210",
      delivery_address: {
        address_line1: "12 Marine Drive",
        address_line2: "Nariman Point",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400021"
      },
      items: [
        {
          product_id: "22222222-2222-4222-8222-222222222223",
          slug: "green-dial-fluted-bezel-date-watch",
          name: "Green Dial Fluted-Bezel Date Watch",
          image_url: "/images/products/rolex-green-fluted-date-1.jpg",
          unit_price: 1499,
          original_unit_price: 1699,
          quantity: 1
        }
      ],
      delivery_fee: 0,
      payment_method: "razorpay",
      payment_reference: "order_test_991122",
      source: "mobile_app"
    });

    // Never marked paid before provider confirmation
    expect(order.payment_status).toBe("pending");
    expect(order.order_status).toBe("new");
    expect(order.item_subtotal).toBe(1699);
    expect(order.discount_total).toBe(200);
    expect(order.final_total).toBe(1499);

    // Provider confirmation marks it paid with safe reference
    const confirmed = await markOrderPaidByProvider({
      orderId: order.id,
      razorpayOrderId: "order_test_991122",
      razorpayPaymentId: "pay_test_778899"
    });
    expect(confirmed?.payment_status).toBe("paid");
    expect(confirmed?.payment_reference).toContain("pay_test_778899");
    expect(confirmed?.order_status).toBe("confirmed");

    // Admin updates stage to shipped with courier & tracking number
    const updated = await updateAdminOrderStatus({
      id: order.id,
      order_status: "shipped",
      courier_name: "BlueDart Priority",
      tracking_number: "BD123456789IN",
      note: "Handed over to insured courier",
      adminEmail: "admin@stepupstories.in"
    });

    expect(updated.order.order_status).toBe("shipped");
    expect(updated.order.courier_name).toBe("BlueDart Priority");
    expect(updated.order.tracking_number).toBe("BD123456789IN");

    const latestHistory =
      updated.order.status_history[updated.order.status_history.length - 1];
    expect(latestHistory?.to_status).toBe("shipped");
    expect(latestHistory?.changed_by).toBe("admin@stepupstories.in");

    const dashboardData = await getAdminDashboardData();
    expect(dashboardData.customers.length).toBeGreaterThanOrEqual(1);
    expect(dashboardData.auditLogs.length).toBeGreaterThanOrEqual(1);
  });

  it("POST & GET /api/orders supports website COD checkout, rejects online payment when provider is unconfigured, and restricts customer lookup to their own order", async () => {
    // 1. Rejects online payment on website when RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not configured
    const unconfiguredOnlineRes = await postWebsiteOrder(
      new NextRequest("http://localhost:3000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: "Priya Kapoor",
          customer_email: "priya@example.com",
          customer_phone: "9811122233",
          delivery_address: {
            address_line1: "45 MG Road",
            city: "Bengaluru",
            state: "Karnataka",
            pincode: "560001"
          },
          items: [
            {
              product_id: "22222222-2222-4222-8222-222222222224",
              slug: "black-dial-gold-tone-watch",
              name: "Black Dial Gold-Tone Watch",
              unit_price: 2499,
              original_unit_price: 2899,
              quantity: 1
            }
          ],
          payment_method: "razorpay",
          source: "website"
        })
      })
    );
    expect(unconfiguredOnlineRes.status).toBe(400);

    // 2. Creates a website Cash on Delivery order and returns order_number
    const codRes = await postWebsiteOrder(
      new NextRequest("http://localhost:3000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: "Priya Kapoor",
          customer_email: "priya@example.com",
          customer_phone: "9811122233",
          delivery_address: {
            address_line1: "45 MG Road",
            city: "Bengaluru",
            state: "Karnataka",
            pincode: "560001"
          },
          items: [
            {
              product_id: "22222222-2222-4222-8222-222222222224",
              slug: "black-dial-gold-tone-watch",
              name: "Black Dial Gold-Tone Watch",
              unit_price: 2499,
              original_unit_price: 2899,
              quantity: 2
            }
          ],
          payment_method: "cod",
          source: "website"
        })
      })
    );
    expect(codRes.status).toBe(201);
    const codJson = (await codRes.json()) as {
      ok: boolean;
      order: { order_number: string; final_total: number; discount_total: number };
    };
    expect(codJson.ok).toBe(true);
    expect(codJson.order.final_total).toBe(4998);
    expect(codJson.order.discount_total).toBe(800);

    // 3. Customer can view ONLY their own order when order_number + matching phone are provided
    const ownLookupRes = await getWebsiteOrders(
      new NextRequest(
        `http://localhost:3000/api/orders?order_number=${codJson.order.order_number}&phone=9811122233`
      )
    );
    expect(ownLookupRes.status).toBe(200);

    // 4. Mismatched phone is rejected with 404
    const wrongPhoneRes = await getWebsiteOrders(
      new NextRequest(
        `http://localhost:3000/api/orders?order_number=${codJson.order.order_number}&phone=9999999999`
      )
    );
    expect(wrongPhoneRes.status).toBe(404);
  });

  it("ignores tampered browser prices, verifies Razorpay HMAC payment signatures, and handles raw-body webhooks idempotently", async () => {
    // 1. Even if a browser sends a tampered unit_price of ₹1, the server calculates the authoritative total from the trusted backend catalog (₹2,499)
    const tamperedOrder = await createStoreOrder({
      customer_name: "Arjun Verma",
      customer_email: "arjun.verma@example.com",
      customer_phone: "9898989898",
      delivery_address: {
        address_line1: "101 Connaught Place",
        city: "New Delhi",
        state: "Delhi (NCT)",
        pincode: "110001"
      },
      items: [
        {
          product_id: "22222222-2222-4222-8222-222222222224",
          slug: "black-dial-gold-tone-watch",
          name: "Black Dial Gold-Tone Watch",
          unit_price: 1,
          original_unit_price: 1,
          quantity: 1
        }
      ],
      delivery_fee: 0,
      payment_method: "razorpay",
      payment_reference: "order_rzp_server_001",
      source: "website"
    });
    expect(tamperedOrder.final_total).toBe(2499);
    expect(tamperedOrder.item_subtotal).toBe(2899);
    expect(tamperedOrder.discount_total).toBe(400);
    expect(tamperedOrder.payment_status).toBe("pending");

    // 2. /api/payments/razorpay/create-order rejects raw browser amounts without a trusted store_order_id or catalog items
    const untrustedAmountRes = await postRazorpayCreateOrder(
      new NextRequest("http://localhost:3000/api/payments/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_inr: 1 })
      })
    );
    expect(untrustedAmountRes.status).toBe(400);

    // 3. /api/payments/razorpay/verify rejects invalid signatures and marks order paid only on valid HMAC-SHA256 signature
    const prevKeySecret = process.env.RAZORPAY_KEY_SECRET;
    const prevWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    process.env.RAZORPAY_KEY_SECRET = "test_secret_key_for_hmac_verification";
    process.env.RAZORPAY_WEBHOOK_SECRET = "test_webhook_secret_for_raw_body";

    try {
      const badSigRes = await postRazorpayVerify(
        new NextRequest("http://localhost:3000/api/payments/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            store_order_id: tamperedOrder.id,
            razorpay_order_id: "order_rzp_server_001",
            razorpay_payment_id: "pay_rzp_001",
            razorpay_signature: "0000000000000000000000000000000000000000000000000000000000000000"
          })
        })
      );
      expect(badSigRes.status).toBe(400);
      expect((await getStoreOrderById(tamperedOrder.id))?.payment_status).toBe("pending");

      const validPaymentSig = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update("order_rzp_server_001|pay_rzp_001")
        .digest("hex");

      const goodSigRes = await postRazorpayVerify(
        new NextRequest("http://localhost:3000/api/payments/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            store_order_id: tamperedOrder.id,
            razorpay_order_id: "order_rzp_server_001",
            razorpay_payment_id: "pay_rzp_001",
            razorpay_signature: validPaymentSig
          })
        })
      );
      expect(goodSigRes.status).toBe(200);
      expect((await getStoreOrderById(tamperedOrder.id))?.payment_status).toBe("paid");

      // 4. Test raw-body webhook signature verification and duplicate-event idempotency on a second order
      const webhookOrder = await createStoreOrder({
        customer_name: "Ananya Iyer",
        customer_email: "ananya.iyer@example.com",
        customer_phone: "9765432109",
        delivery_address: {
          address_line1: "22 Cathedral Road",
          city: "Chennai",
          state: "Tamil Nadu",
          pincode: "600086"
        },
        items: [
          {
            product_id: "22222222-2222-4222-8222-222222222224",
            slug: "black-dial-gold-tone-watch",
            name: "Black Dial Gold-Tone Watch",
            unit_price: 2499,
            original_unit_price: 2899,
            quantity: 1
          }
        ],
        delivery_fee: 0,
        payment_method: "razorpay",
        payment_reference: "order_rzp_webhook_002",
        source: "website"
      });

      const rawWebhookPayload = JSON.stringify({
        event: "payment.captured",
        payload: {
          payment: {
            entity: {
              id: "pay_rzp_webhook_002",
              order_id: "order_rzp_webhook_002",
              amount: 249900,
              currency: "INR",
              status: "captured",
              notes: {
                store_order_id: webhookOrder.id
              }
            }
          }
        }
      });

      const validWebhookSig = crypto
        .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawWebhookPayload)
        .digest("hex");

      // First webhook delivery marks order paid and confirmed
      const firstWebhookRes = await postRazorpayWebhook(
        new NextRequest("http://localhost:3000/api/razorpay/webhook", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-razorpay-signature": validWebhookSig,
            "x-razorpay-event-id": "evt_razorpay_unique_002"
          },
          body: rawWebhookPayload
        })
      );
      expect(firstWebhookRes.status).toBe(200);
      const firstWebhookJson = (await firstWebhookRes.json()) as {
        ok: boolean;
        duplicate: boolean;
        razorpay_payment_id: string;
        razorpay_order_id: string;
        customer_name: string;
        customer_email: string;
        customer_phone: string;
        product_name: string;
        amount: number;
        payment_status: string;
        order_status: string;
        created_at: string;
      };
      expect(firstWebhookJson.ok).toBe(true);
      expect(firstWebhookJson.duplicate).toBe(false);
      expect(firstWebhookJson.razorpay_payment_id).toBe("pay_rzp_webhook_002");
      expect(firstWebhookJson.razorpay_order_id).toBe("order_rzp_webhook_002");
      expect(firstWebhookJson.customer_name).toBe("Ananya Iyer");
      expect(firstWebhookJson.customer_email).toBe("ananya.iyer@example.com");
      expect(firstWebhookJson.customer_phone).toBe("9765432109");
      expect(firstWebhookJson.product_name).toContain("Black Dial Gold-Tone Watch");
      expect(firstWebhookJson.amount).toBe(2499);
      expect(firstWebhookJson.payment_status).toBe("paid");
      expect(firstWebhookJson.order_status).toBe("confirmed");
      expect(firstWebhookJson.created_at).toBeTruthy();

      const historyLengthAfterFirst =
        (await getStoreOrderById(webhookOrder.id))?.status_history.length ?? 0;

      // Second (duplicate) webhook delivery is handled safely without duplicating status history
      const duplicateWebhookRes = await postRazorpayWebhook(
        new NextRequest("http://localhost:3000/api/razorpay/webhook", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-razorpay-signature": validWebhookSig,
            "x-razorpay-event-id": "evt_razorpay_unique_002"
          },
          body: rawWebhookPayload
        })
      );
      expect(duplicateWebhookRes.status).toBe(200);
      const duplicateWebhookJson = (await duplicateWebhookRes.json()) as {
        ok: boolean;
        duplicate: boolean;
      };
      expect(duplicateWebhookJson.ok).toBe(true);
      expect(duplicateWebhookJson.duplicate).toBe(true);
      expect(
        (await getStoreOrderById(webhookOrder.id))?.status_history.length
      ).toBe(historyLengthAfterFirst);

      // 5. Rejects invalid webhook signature with clear error and HTTP 400
      const invalidWebhookSigRes = await postRazorpayWebhook(
        new NextRequest("http://localhost:3000/api/razorpay/webhook", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-razorpay-signature": "invalid_signature_hex_value",
            "x-razorpay-event-id": "evt_invalid_sig_003"
          },
          body: rawWebhookPayload
        })
      );
      expect(invalidWebhookSigRes.status).toBe(400);
      const invalidWebhookJson = (await invalidWebhookSigRes.json()) as {
        ok: boolean;
        error: string;
      };
      expect(invalidWebhookJson.ok).toBe(false);
      expect(invalidWebhookJson.error).toContain("Invalid Razorpay webhook signature");

      // 6. Out-of-order `payment.failed` arriving AFTER `payment.captured` does NOT downgrade a paid order
      const outOfOrderFailedPayload = JSON.stringify({
        event: "payment.failed",
        payload: {
          payment: {
            entity: {
              id: "pay_rzp_failed_attempt_001",
              order_id: "order_rzp_webhook_002",
              amount: 249900,
              currency: "INR",
              status: "failed",
              error_description: "First card attempt timed out"
            }
          }
        }
      });
      const outOfOrderFailedSig = crypto
        .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(outOfOrderFailedPayload)
        .digest("hex");

      const outOfOrderFailedRes = await postRazorpayWebhook(
        new NextRequest("http://localhost:3000/api/razorpay/webhook", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-razorpay-signature": outOfOrderFailedSig,
            "x-razorpay-event-id": "evt_out_of_order_failed_004"
          },
          body: outOfOrderFailedPayload
        })
      );
      expect(outOfOrderFailedRes.status).toBe(200);
      const outOfOrderFailedJson = (await outOfOrderFailedRes.json()) as {
        ok: boolean;
        out_of_order: boolean;
        payment_status: string;
      };
      expect(outOfOrderFailedJson.ok).toBe(true);
      expect(outOfOrderFailedJson.out_of_order).toBe(true);
      expect(outOfOrderFailedJson.payment_status).toBe("paid");

      // 7. `refund.processed` marks order as `refunded`, and a delayed `payment.captured` arriving out of order does NOT revert `refunded` to `paid`
      const refundPayload = JSON.stringify({
        event: "refund.processed",
        payload: {
          refund: {
            entity: {
              id: "rfnd_rzp_002",
              payment_id: "pay_rzp_webhook_002",
              order_id: "order_rzp_webhook_002",
              amount: 249900,
              status: "processed"
            }
          }
        }
      });
      const refundSig = crypto
        .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(refundPayload)
        .digest("hex");

      const refundRes = await postRazorpayWebhook(
        new NextRequest("http://localhost:3000/api/razorpay/webhook", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-razorpay-signature": refundSig,
            "x-razorpay-event-id": "evt_refund_processed_005"
          },
          body: refundPayload
        })
      );
      expect(refundRes.status).toBe(200);
      const refundJson = (await refundRes.json()) as {
        ok: boolean;
        payment_status: string;
      };
      expect(refundJson.ok).toBe(true);
      expect(refundJson.payment_status).toBe("refunded");

      const lateCaptureRes = await postRazorpayWebhook(
        new NextRequest("http://localhost:3000/api/razorpay/webhook", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-razorpay-signature": validWebhookSig,
            "x-razorpay-event-id": "evt_late_capture_after_refund_006"
          },
          body: rawWebhookPayload
        })
      );
      expect(lateCaptureRes.status).toBe(200);
      const lateCaptureJson = (await lateCaptureRes.json()) as {
        ok: boolean;
        out_of_order: boolean;
        payment_status: string;
      };
      expect(lateCaptureJson.ok).toBe(true);
      expect(lateCaptureJson.out_of_order).toBe(true);
      expect(lateCaptureJson.payment_status).toBe("refunded");
    } finally {
      if (prevKeySecret === undefined) delete process.env.RAZORPAY_KEY_SECRET;
      else process.env.RAZORPAY_KEY_SECRET = prevKeySecret;
      if (prevWebhookSecret === undefined) delete process.env.RAZORPAY_WEBHOOK_SECRET;
      else process.env.RAZORPAY_WEBHOOK_SECRET = prevWebhookSecret;
    }
  });
});
