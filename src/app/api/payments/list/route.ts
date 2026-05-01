import { NextResponse } from 'next/server';
import { getPaymentLinks } from '@/lib/payments';

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const links = getPaymentLinks();
  return NextResponse.json({ links });
}
