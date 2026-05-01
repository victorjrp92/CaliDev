"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Send, CheckCircle, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export function ContactForm() {
  const t = useTranslations("contact");
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');

    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <p className="text-lg font-medium">{t('success')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">{t('name')}</Label>
        <Input id="name" name="name" placeholder={t('name_placeholder')} required className="h-12" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{t('email')}</Label>
        <Input id="email" name="email" type="email" placeholder={t('email_placeholder')} required className="h-12" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">{t('message')}</Label>
        <Textarea id="message" name="message" placeholder={t('message_placeholder')} required rows={6} />
      </div>
      {status === 'error' && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          {t('error')}
        </div>
      )}
      <Button type="submit" size="lg" className="w-full cursor-pointer" disabled={status === 'loading'}>
        {status === 'loading' ? (
          <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            {t('send')}
          </>
        )}
      </Button>
    </form>
  );
}
