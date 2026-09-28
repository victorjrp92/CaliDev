/**
 * Envío de correos de la landing «delegar» por la API de Resend.
 *
 * Nunca lanza: si falta la clave, Resend responde con error o la red se cae,
 * devuelve `false` y deja constancia en el log. Un correo que no sale no puede
 * tumbar el guardado de un lead; por eso además se llama desde `after()`, con
 * el lead ya guardado y la respuesta ya enviada al navegador.
 *
 * Remitente: `CORREO_REMITENTE` o `info@calidev.dev`, del dominio verificado en
 * Resend (DKIM en resend._domainkey.calidev.dev). Las respuestas van a
 * `calidevdev@gmail.com` con `reply_to`, porque calidev.dev no tiene buzón.
 *
 * `fetch` y no el SDK: es un POST con un JSON, no vale una dependencia.
 */

const REMITENTE = process.env.CORREO_REMITENTE || "Víctor de CaliDev <info@calidev.dev>";
export const CORREO_VICTOR = process.env.AVISO_LEADS_CORREO || "calidevdev@gmail.com";

export type Correo = {
  para: string;
  asunto: string;
  texto: string;
  html: string;
};

export async function enviarCorreo(correo: Correo): Promise<boolean> {
  const clave = process.env.RESEND_API_KEY;
  if (!clave) {
    console.error("Correo sin enviar: falta RESEND_API_KEY");
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${clave}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: REMITENTE,
        to: [correo.para],
        reply_to: CORREO_VICTOR,
        subject: correo.asunto,
        text: correo.texto,
        html: correo.html,
      }),
    });
    if (!res.ok) {
      console.error("Resend respondió", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.error("Error enviando correo:", err);
    return false;
  }
}

/**
 * Todo lo que escribió el visitante pasa por aquí antes de entrar al HTML: un
 * nombre como `<a href=…>` no puede convertirse en un enlace dentro del correo.
 */
export function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Envoltorio HTML sencillo: parece un mensaje de una persona, no un boletín. */
export function envolver(cuerpo: string): string {
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:16px;line-height:1.6;color:#14201B;max-width:560px">${cuerpo}</div>`;
}
