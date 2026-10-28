import { NextRequest, NextResponse } from "next/server";
import { buildMobileCatalog } from "@/lib/mobile-catalog";
import { getPublishedCollections, getPublishedProducts } from "@/lib/repository";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const origin =
    request.nextUrl.origin ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://stepup-stories.vercel.app";

  const [liveProducts, liveCollections] = await Promise.all([
    getPublishedProducts(),
    getPublishedCollections()
  ]);

  const catalog = buildMobileCatalog(origin, liveProducts, liveCollections);

  return NextResponse.json(
    {
      store: "STEPUP STORIES",
      currency: "INR",
      currency_symbol: "₹",
      updated_at: new Date().toISOString(),
      collections: catalog.collections,
      products: catalog.products
    },
    { status: 200, headers: corsHeaders }
  );
}
