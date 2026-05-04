import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { savePaymentLink, type PaymentLink } from "@/lib/payments";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { clientName, clientEmail, clientAddress, description, amount, currency } = body;

  const id = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const link: PaymentLink = {
    id,
    client_name: clientName,
    client_email: clientEmail || undefined,
    client_address: clientAddress || undefined,
    description,
    amount,
    currency: currency || "EUR",
    status: "pending",
    created_at: new Date().toISOString(),
  };

  await savePaymentLink(link);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://calidev.dev";

  return NextResponse.json({
    success: true,
    link,
    paymentUrl: `${siteUrl}/pay/${id}`,
  });
}
