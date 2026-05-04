import { getPaymentLink, getBusinessInfo } from "@/lib/payments";
import { notFound } from "next/navigation";
import { PrintButton } from "./print-button";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const link = await getPaymentLink(id);

  if (!link || !link.receipt_number) {
    notFound();
  }

  const biz = await getBusinessInfo();

  const formattedAmount = new Intl.NumberFormat("en", {
    style: "currency",
    currency: link.currency,
  }).format(link.amount);

  const issueDate = link.paid_at
    ? new Date(link.paid_at).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
    : new Date(link.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <html lang="en">
      <head>
        <title>Receipt {link.receipt_number} — {biz.name}</title>
        <style>{`
          @media print {
            body { margin: 0; }
            .no-print { display: none !important; }
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #1a1a1a;
            background: #f5f5f5;
            margin: 0;
            padding: 2rem;
          }
          .receipt {
            max-width: 700px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            padding: 3rem;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 2.5rem;
            padding-bottom: 1.5rem;
            border-bottom: 2px solid #0A3C30;
          }
          .logo-section h1 {
            font-size: 1.5rem;
            font-weight: 700;
            color: #0A3C30;
            margin: 0 0 0.25rem;
          }
          .logo-section p {
            font-size: 0.8rem;
            color: #666;
            margin: 0.15rem 0;
          }
          .receipt-meta {
            text-align: right;
          }
          .receipt-meta h2 {
            font-size: 1.75rem;
            font-weight: 700;
            color: #0A3C30;
            margin: 0 0 0.5rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
          }
          .receipt-meta p {
            font-size: 0.85rem;
            color: #666;
            margin: 0.2rem 0;
          }
          .parties {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            margin-bottom: 2.5rem;
          }
          .party h3 {
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            color: #999;
            margin: 0 0 0.5rem;
            font-weight: 600;
          }
          .party p {
            font-size: 0.9rem;
            margin: 0.2rem 0;
            color: #333;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 2rem;
          }
          th {
            text-align: left;
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #999;
            font-weight: 600;
            padding: 0.75rem 0;
            border-bottom: 1px solid #e5e5e5;
          }
          th:last-child { text-align: right; }
          td {
            padding: 1rem 0;
            font-size: 0.9rem;
            border-bottom: 1px solid #f0f0f0;
          }
          td:last-child { text-align: right; font-weight: 600; }
          .total-row {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 2rem;
          }
          .total-box {
            background: #0A3C30;
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            text-align: right;
          }
          .total-box .label {
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            opacity: 0.8;
          }
          .total-box .amount {
            font-size: 1.5rem;
            font-weight: 700;
            margin-top: 0.25rem;
          }
          .status {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 999px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .status-paid {
            background: #dcfce7;
            color: #166534;
          }
          .status-pending {
            background: #fef3c7;
            color: #92400e;
          }
          .footer {
            margin-top: 2rem;
            padding-top: 1.5rem;
            border-top: 1px solid #e5e5e5;
            font-size: 0.8rem;
            color: #999;
            text-align: center;
          }
          .print-btn {
            display: block;
            margin: 1.5rem auto 0;
            padding: 0.75rem 2rem;
            background: #0A3C30;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
          }
          .print-btn:hover { opacity: 0.9; }
        `}</style>
      </head>
      <body>
        <div className="receipt">
          <div className="header">
            <div className="logo-section">
              <h1>{biz.name}</h1>
              {biz.address && <p>{biz.address}</p>}
              {biz.email && <p>{biz.email}</p>}
              {biz.phone && <p>{biz.phone}</p>}
              {biz.tax_id && <p>Tax ID: {biz.tax_id}</p>}
            </div>
            <div className="receipt-meta">
              <h2>Receipt</h2>
              <p><strong>{link.receipt_number}</strong></p>
              <p>Date: {issueDate}</p>
              <p>
                <span className={`status ${link.status === "paid" ? "status-paid" : "status-pending"}`}>
                  {link.status}
                </span>
              </p>
            </div>
          </div>

          <div className="parties">
            <div className="party">
              <h3>From</h3>
              <p><strong>{biz.name}</strong></p>
              {biz.address && <p>{biz.address}</p>}
              {biz.email && <p>{biz.email}</p>}
            </div>
            <div className="party">
              <h3>Bill To</h3>
              <p><strong>{link.client_name}</strong></p>
              {link.client_email && <p>{link.client_email}</p>}
              {link.client_address && <p>{link.client_address}</p>}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{link.description}</td>
                <td>{formattedAmount}</td>
              </tr>
            </tbody>
          </table>

          <div className="total-row">
            <div className="total-box">
              <div className="label">Total</div>
              <div className="amount">{formattedAmount}</div>
            </div>
          </div>

          {biz.tax_note && (
            <div className="footer">
              <p>{biz.tax_note}</p>
            </div>
          )}

          <div className="footer">
            <p>Thank you for your business.</p>
          </div>
        </div>

        <PrintButton />
      </body>
    </html>
  );
}
