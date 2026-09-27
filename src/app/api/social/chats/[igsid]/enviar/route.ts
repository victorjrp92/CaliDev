import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { mensajesDe } from "@/lib/social/consultas";
import { guardarMensaje } from "@/lib/social/datos";
import { enlaceTarjeta, landingPermitida } from "@/lib/social/enlaces";
import { enviarTarjeta, enviarTexto } from "@/lib/social/instagram";
import { redactar } from "@/lib/social/redactor";
import { ventanaAbierta } from "@/lib/social/reglas";
import { sinSesion } from "@/lib/social/sesion";
import { TEXTOS_INICIALES } from "@/lib/social/textos";
import type { Textos } from "@/lib/social/tipos";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Victor responde desde el panel: sale en ese momento desde @calidevdev.
 * { texto, tarjeta?: boolean }  · { borrador: true } devuelve un borrador de la IA.
 * Si la ventana de 24 h está cerrada, Meta lo rechazaría: se avisa antes.
 */
export async function POST(peticion: Request, { params }: { params: Promise<{ igsid: string }> }) {
  const no = await sinSesion();
  if (no) return no;
  const { igsid } = await params;
  const b = await peticion.json().catch(() => ({}));
  const { rows } = await sql`
    SELECT s.*, a.landing_url, a.textos, a.contexto FROM social_personas s
    LEFT JOIN social_automatizaciones a ON a.media_id = s.media_id WHERE s.igsid = ${igsid}`;
  const p = rows[0];

  const { mensajes, ultimoDeElla } = await mensajesDe(igsid);
  if (b.borrador === true) {
    const ultimo = [...mensajes].reverse().find((m) => !m.nuestro)?.texto ?? "";
    const texto = await redactar(ultimo, "responder su mensaje directo con amabilidad y ayudarle", p?.contexto);
    return NextResponse.json({ borrador: texto });
  }
  if (!ultimoDeElla || !ventanaAbierta(ultimoDeElla)) {
    return NextResponse.json({ error: "La ventana de 24 h está cerrada: Instagram no deja escribirle hasta que ella escriba de nuevo." }, { status: 409 });
  }
  const texto = typeof b.texto === "string" ? b.texto.trim().slice(0, 1000) : "";
  if (!texto && !b.tarjeta) return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });

  try {
    if (texto) await enviarTexto(igsid, texto);
    if (b.tarjeta) {
      const landing: string | null = p?.landing_url ?? null;
      if (!landing || !landingPermitida(landing) || !p?.codigo) {
        return NextResponse.json({ error: "Esta persona no tiene una landing asociada para la tarjeta." }, { status: 400 });
      }
      const t: Textos = { ...TEXTOS_INICIALES, ...(p.textos ?? {}) };
      await enviarTarjeta(igsid, { ...t.tarjetaSi, url: enlaceTarjeta(landing, p.codigo, `ig-${p.media_id}`) });
    }
  } catch (e) {
    return NextResponse.json({ error: `Instagram rechazó el mensaje: ${(e as Error).message.slice(0, 160)}` }, { status: 502 });
  }
  await guardarMensaje({ id: `victor-${Date.now()}`, igsid, texto: texto || "[tarjeta]", nuestro: true, ts: new Date().toISOString(), origen: "victor" });
  await sql`UPDATE social_mensajes SET estado = 'respondido' WHERE igsid = ${igsid} AND estado = 'revision'`;
  return NextResponse.json({ ok: true });
}
