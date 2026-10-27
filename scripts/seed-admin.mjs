/**
 * STEPUP STORIES — First Admin & Baseline Catalog Seed Script
 *
 * Usage:
 *   npm run seed:admin
 *
 * Requires in `.env.local`:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   INITIAL_ADMIN_EMAIL
 *   INITIAL_ADMIN_PASSWORD (optional: creates the Supabase Auth user if not present)
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const adminEmail = process.env.INITIAL_ADMIN_EMAIL?.trim()?.toLowerCase();
const adminPassword = process.env.INITIAL_ADMIN_PASSWORD?.trim();

if (!supabaseUrl || !serviceRoleKey || !adminEmail) {
  console.error(
    "Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or INITIAL_ADMIN_EMAIL."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function runSeed() {
  console.log(`Seeding initial admin for ${adminEmail}...`);

  let userId = null;

  if (adminPassword) {
    const { data: createdUser, error: createErr } =
      await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        app_metadata: { role: "superadmin" }
      });

    if (!createErr && createdUser?.user) {
      userId = createdUser.user.id;
      console.log("Created Supabase Auth user:", userId);
    } else {
      const { data: listData } = await supabase.auth.admin.listUsers();
      const existing = listData?.users?.find(
        (u) => u.email?.toLowerCase() === adminEmail
      );
      if (existing) {
        userId = existing.id;
        console.log("Found existing Supabase Auth user:", userId);
      }
    }
  }

  const { error: adminTableErr } = await supabase.from("admins").upsert(
    {
      user_id: userId,
      email: adminEmail,
      role: "superadmin"
    },
    { onConflict: "email" }
  );

  if (adminTableErr) {
    console.error("Failed to upsert into public.admins:", adminTableErr.message);
    process.exit(1);
  }

  console.log("Successfully registered superadmin in public.admins.");

  // Seed initial 5 collections if not already present
  const collections = [
    {
      slug: "signature",
      name: "Signature",
      subtitle: "The Emblem of Ascent",
      description:
        "Octagonal silhouettes and warm champagne-gold accents that embody the core identity of STEPUP STORIES.",
      cover_image_url: "/images/generated/collection-signature.webp",
      sort_order: 1,
      published: true
    },
    {
      slug: "automatic-classics",
      name: "Automatic Classics",
      subtitle: "Timeless Proportions",
      description:
        "Traditional horological poise balanced with deep charcoal tones and refined architectural indices.",
      cover_image_url: "/images/generated/collection-automatic-classics.webp",
      sort_order: 2,
      published: true
    },
    {
      slug: "modern-minimal",
      name: "Modern Minimal",
      subtitle: "Pure Architectural Form",
      description:
        "Clean dial geometry and slim profiles conceived for effortless contemporary wear.",
      cover_image_url: "/images/generated/collection-modern-minimal.webp",
      sort_order: 3,
      published: true
    },
    {
      slug: "limited-editions",
      name: "Limited Editions",
      subtitle: "Rare & Numbered",
      description:
        "Exclusive releases crafted in small runs with distinctive burgundy and champagne-gold detailing.",
      cover_image_url: "/images/generated/collection-limited-editions.webp",
      sort_order: 4,
      published: true
    },
    {
      slug: "everyday-icons",
      name: "Everyday Icons",
      subtitle: "Versatile Sophistication",
      description:
        "Designed to accompany every milestone from morning briefings to evening gatherings.",
      cover_image_url: "/images/generated/collection-everyday-icons.webp",
      sort_order: 5,
      published: true
    }
  ];

  const { error: colErr } = await supabase
    .from("collections")
    .upsert(collections, { onConflict: "slug" });

  if (colErr) {
    console.warn("Collections seed note:", colErr.message);
  } else {
    console.log("Seeded 5 STEPUP STORIES collections.");
  }
}

runSeed();
