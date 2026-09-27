import { NextResponse } from "next/server";
import { sinSesion } from "@/lib/social/sesion";
import { sincronizarBandeja, sincronizarMensajes } from "@/lib/social/sincronizar-chats";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Botón «Actualizar» de Chats: toda la bandeja, o una conversación (`igsid`). */
export async function POST(peticion: Request) {
  const no = await sinSesion();
  if (no) return no;
  const b = await peticion.json().catch(() => ({}));
  try {
    if (typeof b.igsid === "string" && /^\d+$/.test(b.igsid)) {
      return NextResponse.json({ nuevos: await sincronizarMensajes(b.igsid) });
    }
    return NextResponse.json(await sincronizarBandeja(true, 10));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message.slice(0, 200) }, { status: 502 });
  }
}
