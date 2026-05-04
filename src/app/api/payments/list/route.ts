import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPaymentLinks } from "@/lib/payments";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const links = await getPaymentLinks();
  return NextResponse.json({ links });
}
