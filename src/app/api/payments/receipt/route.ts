import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPaymentLink, savePaymentLink, getNextReceiptNumber } from "@/lib/payments";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Payment ID required" }, { status: 400 });
  }

  const link = await getPaymentLink(id);
  if (!link) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  if (!link.receipt_number) {
    link.receipt_number = await getNextReceiptNumber();
    await savePaymentLink(link);
  }

  return NextResponse.json({ success: true, receipt_number: link.receipt_number });
}
