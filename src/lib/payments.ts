import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data/payments.json');

export interface PaymentLink {
  id: string;
  clientName: string;
  description: string;
  amount: number;
  currency: 'EUR' | 'USD';
  status: 'pending' | 'paid';
  stripeSessionId?: string;
  createdAt: string;
  paidAt?: string;
}

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');
}

export function getPaymentLinks(): PaymentLink[] {
  ensureDataDir();
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

export function getPaymentLink(id: string): PaymentLink | undefined {
  return getPaymentLinks().find(p => p.id === id);
}

export function savePaymentLink(link: PaymentLink) {
  const links = getPaymentLinks();
  const idx = links.findIndex(l => l.id === link.id);
  if (idx >= 0) links[idx] = link;
  else links.push(link);
  fs.writeFileSync(DATA_FILE, JSON.stringify(links, null, 2));
}
