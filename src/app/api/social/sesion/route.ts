import { NextResponse } from "next/server";
import { abrirPanel, cerrarPanel, contrasenaCorrecta } from "@/lib/social/sesion";

/**
 * Entrada y salida del panel social. Freno de cinco fallos por IP y quince
 * minutos de espera, igual que el panel de leads y el login del admin. El
 * contador vive en memoria de la instancia: suficiente para un panel de una
 * sola persona.
 */
const intentos = new Map<string, { fallos: number; hasta: number }>();
const MAX_FALLOS = 5;
const ESPERA = 15 * 60 * 1000;

function puedeIntentar(ip: string): boolean {
  const registro = intentos.get(ip);
  if (!registro) return true;
  if (Date.now() > registro.hasta) {
    intentos.delete(ip);
    return true;
  }
  return registro.fallos < MAX_FALLOS;
}

function anotarFallo(ip: string) {
  const ahora = Date.now();
  const registro = intentos.get(ip);
  if (registro && ahora <= registro.hasta) registro.fallos += 1;
  else intentos.set(ip, { fallos: 1, hasta: ahora + ESPERA });
}

export async function POST(peticion: Request) {
  const ip = peticion.headers.get("x-forwarded-for") ?? "desconocida";
  if (!puedeIntentar(ip)) {
    return NextResponse.json({ error: "Demasiados intentos. Espera quince minutos." }, { status: 429 });
  }
  const cuerpo = await peticion.json().catch(() => null);
  const contrasena = typeof cuerpo?.password === "string" ? cuerpo.password : "";
  if (!contrasenaCorrecta(contrasena)) {
    anotarFallo(ip);
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }
  intentos.delete(ip);
  await abrirPanel();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await cerrarPanel();
  return NextResponse.json({ ok: true });
}
