import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPaymentLinks } from "@/lib/payments";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const links = await getPaymentLinks();
    return NextResponse.json({ links });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
