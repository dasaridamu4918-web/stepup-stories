import { NextResponse } from "next/server";
import { unsubscribeByToken } from "@/lib/repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim();

  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Missing unsubscribe token." },
      { status: 400 }
    );
  }

  const success = await unsubscribeByToken(token);
  if (!success) {
    return NextResponse.json(
      { ok: false, error: "Invalid or expired unsubscribe link." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "You have been unsubscribed from the STEPUP STORIES journal."
  });
}
