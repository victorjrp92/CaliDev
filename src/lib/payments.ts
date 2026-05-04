import { sql } from "@vercel/postgres";

export interface PaymentLink {
  id: string;
  client_name: string;
  client_email?: string;
  client_address?: string;
  description: string;
  amount: number;
  currency: "EUR" | "USD" | "AUD";
  status: "pending" | "paid";
  stripe_session_id?: string;
  receipt_number?: string;
  created_at: string;
  paid_at?: string;
}

export async function getPaymentLinks(): Promise<PaymentLink[]> {
  const result = await sql`SELECT * FROM payment_links ORDER BY created_at DESC`;
  return result.rows as PaymentLink[];
}

export async function getPaymentLink(id: string): Promise<PaymentLink | undefined> {
  const result = await sql`SELECT * FROM payment_links WHERE id = ${id}`;
  return result.rows[0] as PaymentLink | undefined;
}

export async function savePaymentLink(link: PaymentLink) {
  const existing = await sql`SELECT id FROM payment_links WHERE id = ${link.id}`;
  if (existing.rows.length > 0) {
    await sql`
      UPDATE payment_links SET
        client_name = ${link.client_name},
        client_email = ${link.client_email || null},
        client_address = ${link.client_address || null},
        description = ${link.description},
        amount = ${link.amount},
        currency = ${link.currency},
        status = ${link.status},
        stripe_session_id = ${link.stripe_session_id || null},
        receipt_number = ${link.receipt_number || null},
        paid_at = ${link.paid_at || null}
      WHERE id = ${link.id}
    `;
  } else {
    await sql`
      INSERT INTO payment_links (id, client_name, client_email, client_address, description, amount, currency, status, stripe_session_id, receipt_number, created_at)
      VALUES (${link.id}, ${link.client_name}, ${link.client_email || null}, ${link.client_address || null}, ${link.description}, ${link.amount}, ${link.currency}, ${link.status}, ${link.stripe_session_id || null}, ${link.receipt_number || null}, ${link.created_at})
    `;
  }
}

export async function getNextReceiptNumber(): Promise<string> {
  const result = await sql`
    SELECT receipt_number FROM payment_links
    WHERE receipt_number IS NOT NULL
    ORDER BY receipt_number DESC LIMIT 1
  `;
  const last = result.rows[0]?.receipt_number;
  if (!last) return "CD-2026-001";
  const num = parseInt(last.split("-").pop() || "0") + 1;
  const year = new Date().getFullYear();
  return `CD-${year}-${num.toString().padStart(3, "0")}`;
}

export async function getBusinessInfo() {
  const result = await sql`SELECT * FROM business_info LIMIT 1`;
  return result.rows[0] || {
    name: "CaliDev",
    address: "",
    email: "appprojectscali@gmail.com",
    phone: "",
    tax_id: "",
    tax_note: "Kleinunternehmer gemäß § 19 UStG – No VAT charged",
  };
}
