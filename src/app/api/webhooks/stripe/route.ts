import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getPaymentLink, savePaymentLink } from '@/lib/payments';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const paymentId = session.metadata?.paymentId;
    if (paymentId) {
      const link = getPaymentLink(paymentId);
      if (link) {
        link.status = 'paid';
        link.stripeSessionId = session.id;
        link.paidAt = new Date().toISOString();
        savePaymentLink(link);
      }
    }
  }

  return NextResponse.json({ received: true });
}
