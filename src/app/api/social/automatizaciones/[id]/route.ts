import { NextResponse } from "next/server";
import { automatizacion, guardarAutomatizacion } from "@/lib/social/datos";
import { evento } from "@/lib/social/db";
import { sinSesion } from "@/lib/social/sesion";
import { validarAutomatizacion } from "@/lib/social/validar";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const no = await sinSesion();
  if (no) return no;
  return NextResponse.json(await automatizacion((await params).id));
}

/** Guarda la configuración. Activar por primera vez fija la fecha desde la que se responden comentarios. */
export async function PUT(peticion: Request, { params }: { params: Promise<{ id: string }> }) {
  const no = await sinSesion();
  if (no) return no;
  const { id } = await params;
  const r = validarAutomatizacion(await peticion.json().catch(() => ({})));
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  await guardarAutomatizacion({ mediaId: id, ...r.valor, activar: r.valor.modo !== "apagado" });
  await evento(`Automatización guardada: modo ${r.valor.modo}${r.valor.sensible ? " (tema sensible)" : ""}`, "info", id);
  return NextResponse.json({ ok: true });
}
