import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

/**
 * Recoge la opinión de una clienta: nota del 1 al 5, una frase y el permiso
 * para publicarla con su nombre.
 *
 * El enlace se manda a mano a tres personas, así que no hay autenticación — lo
 * que sí hay es un tope por IP, porque una URL que circula por WhatsApp acaba
 * donde acaba y una media se estropea con cinco envíos desde el mismo sitio.
 *
 * El permiso se guarda tal cual lo marcó ella. Sin un sí explícito la opinión
 * cuenta para la media y el nombre no se publica: eso lo decide quien opina, no
 * quien monta la página.
 */

const TOPE_POR_IP = 3;
const VENTANA_MS = 24 * 60 * 60 * 1000;
const enviosPorIp = new Map<string, number[]>();

function demasiados(ip: string): boolean {
  const ahora = Date.now();
  const recientes = (enviosPorIp.get(ip) ?? []).filter((t) => ahora - t < VENTANA_MS);
  enviosPorIp.set(ip, recientes);
  if (recientes.length >= TOPE_POR_IP) return true;
  recientes.push(ahora);
  return false;
}

function limpiar(valor: unknown, max: number): string | null {
  if (typeof valor !== "string") return null;
  const t = valor.trim().slice(0, max);
  return t.length > 0 ? t : null;
}

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "desconocida";
    if (demasiados(ip)) {
      return NextResponse.json(
        { error: "Ya recibimos tu opinión. ¡Gracias!" },
        { status: 429 }
      );
    }

    const body = await request.json();

    const nombre = limpiar(body.nombre, 120);
    const nota = Number(body.nota);
    if (!nombre || !Number.isInteger(nota) || nota < 1 || nota > 5) {
      return NextResponse.json(
        { error: "Hace falta tu nombre y una nota del 1 al 5" },
        { status: 400 }
      );
    }

    await sql`
      INSERT INTO opiniones (nombre, empresa, nota, frase, permiso)
      VALUES (
        ${nombre},
        ${limpiar(body.empresa, 160)},
        ${nota},
        ${limpiar(body.frase, 600)},
        ${body.permiso === true}
      )
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error guardando opinión:", err);
    return NextResponse.json({ error: "No pudimos guardarlo" }, { status: 500 });
  }
}
