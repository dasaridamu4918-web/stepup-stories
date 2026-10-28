import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import {
  isAdminAlertServiceConfigured,
  isCustomerNotificationServiceConfigured
} from "@/lib/email";
import {
  addAdminProductImage,
  deleteAdminCollection,
  deleteAdminProduct,
  deleteAdminProductImage,
  getAdminDashboardData,
  recordAdminAuditLog,
  saveAdminCollection,
  saveAdminProduct,
  saveAdminSiteSettings,
  updateAdminEnquiry,
  updateAdminOrderStatus
} from "@/lib/repository";
import {
  adminCollectionSchema,
  adminEnquiryUpdateSchema,
  adminOrderStatusUpdateSchema,
  adminProductSchema,
  adminSiteSettingsSchema
} from "@/lib/validations";
import { createSupabaseServiceClient, isServiceRoleConfigured } from "@/lib/supabase/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif"
]);
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  const auth = await verifyAdminRequest();
  if (!auth.authorized) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401, headers: corsHeaders }
    );
  }

  const data = await getAdminDashboardData();
  return NextResponse.json(
    {
      ok: true,
      adminEmail: auth.email,
      alertServiceStatus: {
        emailConfigured: isAdminAlertServiceConfigured(),
        customerNotificationConfigured: isCustomerNotificationServiceConfigured()
      },
      ...data
    },
    { headers: corsHeaders }
  );
}

export async function POST(request: Request) {
  const auth = await verifyAdminRequest(request.headers.get("authorization"));
  if (!auth.authorized || !auth.email) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";

    // Handle multipart/form-data Product Photo Upload
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const productId = String(formData.get("product_id") ?? "").trim();
      const altText = String(formData.get("alt_text") ?? "").trim();
      const isPrimary = formData.get("is_primary") === "true";
      const file = formData.get("file");

      if (!productId || !(file instanceof File)) {
        return NextResponse.json(
          { ok: false, error: "Product ID and image file are required." },
          { status: 400, headers: corsHeaders }
        );
      }

      if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        return NextResponse.json(
          {
            ok: false,
            error: "Unsupported file format. Please upload JPG, PNG, WebP, or AVIF."
          },
          { status: 400, headers: corsHeaders }
        );
      }

      if (file.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json(
          { ok: false, error: "File size exceeds the 8 MB maximum limit." },
          { status: 400, headers: corsHeaders }
        );
      }

      let publicUrl = "";
      let storagePath: string | null = null;

      if (isServiceRoleConfigured()) {
        const service = createSupabaseServiceClient();
        if (service) {
          const ext = file.name.split(".").pop()?.toLowerCase() || "webp";
          const safeName = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const arrayBuffer = await file.arrayBuffer();

          const { error: uploadError } = await service.storage
            .from("product-images")
            .upload(safeName, arrayBuffer, {
              contentType: file.type,
              upsert: false
            });

          if (uploadError) {
            return NextResponse.json(
              { ok: false, error: uploadError.message },
              { status: 400, headers: corsHeaders }
            );
          }

          const { data: urlData } = service.storage
            .from("product-images")
            .getPublicUrl(safeName);

          publicUrl = urlData.publicUrl;
          storagePath = safeName;
        }
      } else {
        // Data URL fallback when Supabase Storage is not yet connected
        const buf = Buffer.from(await file.arrayBuffer());
        publicUrl = `data:${file.type};base64,${buf.toString("base64")}`;
      }

      const image = await addAdminProductImage({
        product_id: productId,
        url: publicUrl,
        storage_path: storagePath,
        alt_text: altText || "STEPUP STORIES timepiece photograph",
        is_primary: isPrimary
      });

      return NextResponse.json({ ok: true, image }, { headers: corsHeaders });
    }

    // Handle JSON Admin Mutations
    const body = (await request.json()) as {
      action: string;
      payload?: unknown;
    };

    switch (body.action) {
      case "save_product": {
        const parsed = adminProductSchema.safeParse(body.payload);
        if (!parsed.success) {
          return NextResponse.json(
            { ok: false, error: "Invalid product data.", issues: parsed.error.flatten() },
            { status: 400, headers: corsHeaders }
          );
        }
        const saved = await saveAdminProduct(parsed.data, auth.email);
        return NextResponse.json({ ok: true, product: saved }, { headers: corsHeaders });
      }

      case "delete_product": {
        const { id } = body.payload as { id: string };
        await deleteAdminProduct(id, auth.email);
        return NextResponse.json({ ok: true }, { headers: corsHeaders });
      }

      case "delete_product_image": {
        const { id } = body.payload as { id: string };
        await deleteAdminProductImage(id);
        return NextResponse.json({ ok: true }, { headers: corsHeaders });
      }

      case "save_collection": {
        const parsed = adminCollectionSchema.safeParse(body.payload);
        if (!parsed.success) {
          return NextResponse.json(
            { ok: false, error: "Invalid collection data.", issues: parsed.error.flatten() },
            { status: 400, headers: corsHeaders }
          );
        }
        const saved = await saveAdminCollection(parsed.data, auth.email);
        return NextResponse.json({ ok: true, collection: saved }, { headers: corsHeaders });
      }

      case "delete_collection": {
        const { id } = body.payload as { id: string };
        await deleteAdminCollection(id);
        return NextResponse.json({ ok: true }, { headers: corsHeaders });
      }

      case "update_enquiry": {
        const parsed = adminEnquiryUpdateSchema.safeParse(body.payload);
        if (!parsed.success) {
          return NextResponse.json(
            { ok: false, error: "Invalid enquiry update payload." },
            { status: 400, headers: corsHeaders }
          );
        }
        const updated = await updateAdminEnquiry(
          parsed.data.id,
          parsed.data.status,
          parsed.data.internal_notes
        );
        return NextResponse.json({ ok: true, enquiry: updated }, { headers: corsHeaders });
      }

      case "update_order_status": {
        const parsed = adminOrderStatusUpdateSchema.safeParse(body.payload);
        if (!parsed.success) {
          return NextResponse.json(
            {
              ok: false,
              error: "Invalid order status update payload.",
              issues: parsed.error.flatten()
            },
            { status: 400, headers: corsHeaders }
          );
        }
        const result = await updateAdminOrderStatus({
          ...parsed.data,
          adminEmail: auth.email
        });
        return NextResponse.json(
          {
            ok: true,
            order: result.order,
            customerNotification: {
              sent: result.customerNotified,
              channel: result.notificationChannel ?? "none"
            }
          },
          { headers: corsHeaders }
        );
      }

      case "log_orders_csv_export": {
        const payload = (body.payload ?? {}) as {
          exported_count?: number;
          filters_summary?: string;
        };
        const count = Number(payload.exported_count ?? 0);
        const auditEntry = await recordAdminAuditLog({
          action_type: "orders_csv_exported",
          actor_email: auth.email,
          target_type: "orders_export",
          target_id: "store_orders_csv",
          summary: `Exported ${count} order(s) to CSV (${payload.filters_summary || "all filters"}).`,
          metadata: {
            exported_count: count,
            filters_summary: payload.filters_summary || "all"
          }
        });
        return NextResponse.json({ ok: true, auditLog: auditEntry }, { headers: corsHeaders });
      }

      case "save_settings": {
        const parsed = adminSiteSettingsSchema.safeParse(body.payload);
        if (!parsed.success) {
          return NextResponse.json(
            { ok: false, error: "Invalid site settings.", issues: parsed.error.flatten() },
            { status: 400, headers: corsHeaders }
          );
        }
        const saved = await saveAdminSiteSettings(
          {
            ...parsed.data,
            tagline: parsed.data.tagline || null,
            hero_headline: parsed.data.hero_headline || null,
            hero_subheadline: parsed.data.hero_subheadline || null,
            hero_backdrop_url: parsed.data.hero_backdrop_url || null,
            story_backdrop_url: parsed.data.story_backdrop_url || null,
            og_image_url: parsed.data.og_image_url || null,
            about_story_title: parsed.data.about_story_title || null,
            about_story_body: parsed.data.about_story_body || null,
            contact_email: parsed.data.contact_email || null,
            contact_phone: parsed.data.contact_phone || null,
            address: parsed.data.address || null,
            opening_hours: parsed.data.opening_hours || null,
            private_viewing_details: parsed.data.private_viewing_details || null,
            footer_text: parsed.data.footer_text || null,
            social_links: parsed.data.social_links ?? []
          },
          auth.email
        );
        return NextResponse.json({ ok: true, settings: saved }, { headers: corsHeaders });
      }

      default:
        return NextResponse.json(
          { ok: false, error: "Unknown admin action." },
          { status: 400, headers: corsHeaders }
        );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Admin operation failed.";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500, headers: corsHeaders }
    );
  }
}
