import { getPaymentLink } from '@/lib/payments';
import { notFound } from 'next/navigation';
import { PaymentClient } from './payment-client';

export default async function PaymentPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { id } = await params;
  const { status: paymentStatus } = await searchParams;
  const link = getPaymentLink(id);

  if (!link) notFound();

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <PaymentClient link={link} queryStatus={paymentStatus} />
    </main>
  );
}
