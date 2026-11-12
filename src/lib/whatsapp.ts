/**
 * WhatsApp Business de CaliDev.
 *
 * Un solo lugar para el número: la web, el pie y el enlace corto
 * `calidev.dev/whatsapp` (el de la bio de Instagram, en next.config.ts) salen
 * de aquí. Si el número cambia, se cambia aquí y la bio no se toca.
 */
export const NUMERO_WHATSAPP = "573166493144";
export const NUMERO_WHATSAPP_VISIBLE = "+57 316 649 3144";

/** Enlace que abre el chat, con un primer mensaje ya escrito si se da. */
export function enlaceWhatsapp(texto?: string): string {
  const base = `https://wa.me/${NUMERO_WHATSAPP}`;
  return texto ? `${base}?text=${encodeURIComponent(texto)}` : base;
}
