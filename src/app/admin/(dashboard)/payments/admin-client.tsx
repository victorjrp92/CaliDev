"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus, Copy, FileText, ExternalLink } from "lucide-react";

interface PaymentLink {
  id: string;
  client_name: string;
  client_email?: string;
  client_address?: string;
  description: string;
  amount: number;
  currency: string;
  status: string;
  receipt_number?: string;
  created_at: string;
  paid_at?: string;
}

export function AdminPayments() {
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    clientAddress: "",
    description: "",
    amount: "",
    currency: "EUR",
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadLinks();
  }, []);

  async function loadLinks() {
    const res = await fetch("/api/payments/list");
    if (res.ok) {
      const data = await res.json();
      setLinks(data.links);
    }
    setLoading(false);
  }

  async function createLink() {
    setCreating(true);
    const res = await fetch("/api/payments/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    if (res.ok) {
      setForm({ clientName: "", clientEmail: "", clientAddress: "", description: "", amount: "", currency: "EUR" });
      await loadLinks();
    }
    setCreating(false);
  }

  function copyUrl(id: string) {
    navigator.clipboard.writeText(`${window.location.origin}/pay/${id}`);
  }

  async function generateReceipt(id: string) {
    const res = await fetch(`/api/payments/receipt?id=${id}`, { method: "POST" });
    if (res.ok) {
      await loadLinks();
      window.open(`/receipt/${id}`, "_blank");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <CreditCard className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Payment Links</h1>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Plus className="h-5 w-5" /> Create Payment Link
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Client Name *</Label>
            <Input value={form.clientName} onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Client Email</Label>
            <Input type="email" value={form.clientEmail} onChange={(e) => setForm((f) => ({ ...f, clientEmail: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Client Address</Label>
            <Input value={form.clientAddress} onChange={(e) => setForm((f) => ({ ...f, clientAddress: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Description *</Label>
            <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Amount *</Label>
            <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.currency}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="AUD">AUD</option>
            </select>
          </div>
        </div>
        <Button
          onClick={createLink}
          disabled={creating || !form.clientName || !form.amount || !form.description}
          className="cursor-pointer"
        >
          {creating ? "Creating..." : "Create Link"}
        </Button>
      </div>

      <div className="space-y-3">
        {links.map((link) => (
          <div
            key={link.id}
            className="rounded-xl border border-border bg-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
          >
            <div className="space-y-1">
              <p className="font-medium">
                {link.client_name} — {link.description}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Intl.NumberFormat("en", { style: "currency", currency: link.currency }).format(link.amount)} ·{" "}
                {new Date(link.created_at).toLocaleDateString()}
                {link.client_email && ` · ${link.client_email}`}
              </p>
              {link.receipt_number && (
                <p className="text-xs text-muted-foreground">Receipt: {link.receipt_number}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={link.status === "paid" ? "default" : "secondary"}>{link.status}</Badge>
              <Button variant="outline" size="sm" onClick={() => copyUrl(link.id)} className="cursor-pointer">
                <Copy className="h-3.5 w-3.5 mr-1" /> Copy Link
              </Button>
              <Button variant="outline" size="sm" onClick={() => generateReceipt(link.id)} className="cursor-pointer">
                <FileText className="h-3.5 w-3.5 mr-1" /> Receipt
              </Button>
              {link.receipt_number && (
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  render={<a href={`/receipt/${link.id}`} target="_blank" rel="noopener noreferrer" />}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> View
                </Button>
              )}
            </div>
          </div>
        ))}
        {links.length === 0 && <p className="text-center text-muted-foreground py-8">No payment links yet.</p>}
      </div>
    </div>
  );
}
