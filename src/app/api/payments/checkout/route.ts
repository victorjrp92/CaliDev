import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getPaymentLink } from '@/lib/payments';

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("API error: STRIPE_SECRET_KEY is not configured");
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const { paymentId } = await request.json();
    const link = await getPaymentLink(paymentId);

    if (!link) {
      return NextResponse.json({ error: 'Payment link not found' }, { status: 404 });
    }

    if (link.status === 'paid') {
      return NextResponse.json({ error: 'Already paid' }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://calidev.dev';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: link.currency.toLowerCase(),
          product_data: {
            name: link.description,
            description: `Payment for ${link.client_name}`,
          },
          unit_amount: Math.round(link.amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${siteUrl}/pay/${paymentId}?status=success`,
      cancel_url: `${siteUrl}/pay/${paymentId}?status=cancelled`,
      metadata: { paymentId },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
