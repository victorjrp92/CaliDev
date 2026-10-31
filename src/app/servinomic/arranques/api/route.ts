import { NextResponse } from "next/server";
import { panelAbierto } from "@/lib/panel-leads";
import { borrarArranque, crearArranque } from "@/lib/arranque/datos";
import { PLANTILLAS } from "@/lib/arranque/plantillas";

/**
 * Crear y borrar formularios de arranque desde el panel (bajo /servinomic por
 * la cookie). Crear devuelve el enlace para mandarle al cliente.
 */
export async function POST(request: Request) {
  if (!(await panelAbierto())) return NextResponse.json({ error: "Abre el panel con la contraseña." }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const cliente = typeof body.cliente === "string" ? body.cliente.trim().slice(0, 100) : "";
  const negocio = typeof body.negocio === "string" ? body.negocio.trim().slice(0, 120) : "";
  const plantilla = typeof body.plantilla === "string" && body.plantilla in PLANTILLAS ? body.plantilla : "servinomic";
  if (cliente.length < 2) return NextResponse.json({ error: "Escribe el nombre del cliente." }, { status: 400 });
  const a = await crearArranque(cliente, negocio || null, plantilla);
  return NextResponse.json({ id: a.id, enlace: `https://calidev.dev/arranque/${a.token}` });
}

export async function DELETE(request: Request) {
  if (!(await panelAbierto())) return NextResponse.json({ error: "Abre el panel con la contraseña." }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  return (await borrarArranque(Number(body.id))) ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "No existe." }, { status: 404 });
}
