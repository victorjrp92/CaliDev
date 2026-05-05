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

  // Input validation
  if (!clientName || typeof clientName !== "string" || clientName.trim() === "") {
    return NextResponse.json({ error: "clientName is required and must be a non-empty string" }, { status: 400 });
  }
  if (!description || typeof description !== "string" || description.trim() === "") {
    return NextResponse.json({ error: "description is required and must be a non-empty string" }, { status: 400 });
  }
  if (typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "amount must be a number greater than 0" }, { status: 400 });
  }
  const allowedCurrencies = ["EUR", "USD", "AUD"];
  if (currency && !allowedCurrencies.includes(currency)) {
    return NextResponse.json({ error: `currency must be one of: ${allowedCurrencies.join(", ")}` }, { status: 400 });
  }

  const id = `pay_${crypto.randomUUID()}`;

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
