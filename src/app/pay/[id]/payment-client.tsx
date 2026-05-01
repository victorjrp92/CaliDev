"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, CreditCard } from "lucide-react";
import type { PaymentLink } from "@/lib/payments";

export function PaymentClient({ link, queryStatus }: { link: PaymentLink; queryStatus?: string }) {
  const [loading, setLoading] = useState(false);

  if (link.status === 'paid' || queryStatus === 'success') {
    return (
      <div className="max-w-md w-full text-center space-y-4 p-8 bg-card rounded-2xl border border-border shadow-lg">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        <h1 className="text-2xl font-bold">Payment Successful</h1>
        <p className="text-muted-foreground">Thank you, {link.clientName}. Your payment has been received.</p>
      </div>
    );
  }

  if (queryStatus === 'cancelled') {
    return (
      <div className="max-w-md w-full text-center space-y-4 p-8 bg-card rounded-2xl border border-border shadow-lg">
        <XCircle className="h-16 w-16 text-destructive mx-auto" />
        <h1 className="text-2xl font-bold">Payment Cancelled</h1>
        <p className="text-muted-foreground">The payment was not completed. You can try again.</p>
        <Button onClick={() => window.location.reload()} className="cursor-pointer">Try Again</Button>
      </div>
    );
  }

  async function handlePay() {
    setLoading(true);
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: link.id }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setLoading(false);
    }
  }

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: link.currency,
  }).format(link.amount);

  return (
    <div className="max-w-md w-full space-y-6 p-8 bg-card rounded-2xl border border-border shadow-lg">
      <div className="text-center">
        <CreditCard className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Payment Request</h1>
      </div>
      <div className="space-y-3 p-4 rounded-xl bg-muted">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Client</span>
          <span className="font-medium">{link.clientName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Description</span>
          <span className="font-medium text-right max-w-[200px]">{link.description}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Amount</span>
          <span className="text-2xl font-bold text-primary">{formatted}</span>
        </div>
      </div>
      <Button onClick={handlePay} size="lg" className="w-full cursor-pointer" disabled={loading}>
        {loading ? (
          <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
        ) : (
          'Pay Now'
        )}
      </Button>
      <p className="text-xs text-muted-foreground text-center">Secure payment powered by Stripe</p>
    </div>
  );
}
