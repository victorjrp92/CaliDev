"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus, Copy, LogIn } from "lucide-react";
import type { PaymentLink } from "@/lib/payments";

export function AdminPayments() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [form, setForm] = useState({ clientName: '', description: '', amount: '', currency: 'EUR' as 'EUR' | 'USD' });
  const [creating, setCreating] = useState(false);

  const authHeader = { Authorization: `Bearer ${password}` };

  async function login() {
    const res = await fetch('/api/payments/list', { headers: authHeader });
    if (res.ok) {
      setAuthenticated(true);
      const data = await res.json();
      setLinks(data.links);
    }
  }

  async function loadLinks() {
    const res = await fetch('/api/payments/list', { headers: authHeader });
    if (res.ok) {
      const data = await res.json();
      setLinks(data.links);
    }
  }

  async function createLink() {
    setCreating(true);
    const res = await fetch('/api/payments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    if (res.ok) {
      setForm({ clientName: '', description: '', amount: '', currency: 'EUR' });
      await loadLinks();
    }
    setCreating(false);
  }

  function copyUrl(id: string) {
    navigator.clipboard.writeText(`${window.location.origin}/pay/${id}`);
  }

  if (!authenticated) {
    return (
      <div className="max-w-sm mx-auto mt-20 space-y-4">
        <h1 className="text-2xl font-bold text-center">Admin Login</h1>
        <Input
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
        />
        <Button onClick={login} className="w-full cursor-pointer">
          <LogIn className="mr-2 h-4 w-4" /> Login
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <CreditCard className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Payment Links</h1>
      </div>

      {/* Create form */}
      <div className="p-6 bg-card rounded-xl border border-border space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Plus className="h-5 w-5" /> Create Payment Link
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Client Name</Label>
            <Input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={form.currency}
              onChange={e => setForm(f => ({ ...f, currency: e.target.value as 'EUR' | 'USD' }))}
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
        <Button onClick={createLink} disabled={creating || !form.clientName || !form.amount} className="cursor-pointer">
          {creating ? 'Creating...' : 'Create Link'}
        </Button>
      </div>

      {/* Links table */}
      <div className="space-y-3">
        {links.map(link => (
          <div key={link.id} className="p-4 bg-card rounded-xl border border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="font-medium">{link.clientName} — {link.description}</p>
              <p className="text-sm text-muted-foreground">
                {new Intl.NumberFormat('en', { style: 'currency', currency: link.currency }).format(link.amount)} · {new Date(link.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={link.status === 'paid' ? 'default' : 'secondary'}>
                {link.status}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => copyUrl(link.id)} className="cursor-pointer">
                <Copy className="h-3.5 w-3.5 mr-1" /> Copy Link
              </Button>
            </div>
          </div>
        ))}
        {links.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No payment links yet.</p>
        )}
      </div>
    </div>
  );
}
