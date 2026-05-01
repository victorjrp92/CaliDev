import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { savePaymentLink, type PaymentLink } from '@/lib/payments';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { clientName, description, amount, currency } = body;

  const id = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const link: PaymentLink = {
    id,
    clientName,
    description,
    amount,
    currency: currency || 'EUR',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  savePaymentLink(link);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  return NextResponse.json({
    success: true,
    link,
    paymentUrl: `${siteUrl}/pay/${id}`,
  });
}
