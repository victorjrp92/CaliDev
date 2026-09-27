import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

/**
 * Recibe los lotes del mapa de calor. Pública (la llama cualquier visitante),
 * así que valida todo, limita el tamaño y no guarda IP: solo el país que
 * Vercel ya calcula.
 */
export const dynamic = "force-dynamic";

const txt = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : null);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

export async function POST(peticion: Request) {
  const crudo = await peticion.text();
  if (crudo.length > 12_000) return NextResponse.json({ error: "Demasiado grande" }, { status: 413 });
  let b: Record<string, unknown>;
  try { b = JSON.parse(crudo); } catch { return NextResponse.json({ error: "JSON" }, { status: 400 }); }
  const visita = txt(b.visita, 40);
  const landing = txt(b.landing, 120);
  if (!visita || !/^[0-9a-f-]{36}$/.test(visita) || !landing?.startsWith("/")) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const codigo = typeof b.codigo === "string" && /^[a-z0-9]{10}$/.test(b.codigo) ? b.codigo : null;
  const secciones = Array.isArray(b.secciones) ? b.secciones.filter((s) => typeof s === "string").slice(0, 20).map((s) => s.slice(0, 30)) : [];
  const pais = peticion.headers.get("x-vercel-ip-country");
  await sql`
    INSERT INTO social_visitas (id, codigo, landing, dispositivo, pais, max_scroll, secciones, paso_formulario, fin)
    VALUES (${visita}, ${codigo}, ${landing}, ${txt(b.dispositivo, 12)}, ${pais}, ${num(b.maxScroll) ?? 0},
      ${JSON.stringify(secciones)}, ${num(b.paso) ?? 0}, NOW())
    ON CONFLICT (id) DO UPDATE SET max_scroll = GREATEST(social_visitas.max_scroll, EXCLUDED.max_scroll),
      secciones = (SELECT jsonb_agg(DISTINCT x) FROM jsonb_array_elements(social_visitas.secciones || EXCLUDED.secciones) x),
      paso_formulario = GREATEST(social_visitas.paso_formulario, EXCLUDED.paso_formulario), fin = NOW()`;

  const clics = Array.isArray(b.clics) ? b.clics.slice(0, 40) : [];
  for (const c of clics as Record<string, unknown>[]) {
    await sql`
      INSERT INTO social_clics (visita_id, selector, seccion, x_rel, y_rel, muerto, rabia)
      VALUES (${visita}, ${txt(c.selector, 160)}, ${txt(c.seccion, 30)}, ${num(c.x)}, ${num(c.y)}, ${c.muerto === true}, ${c.rabia === true})`;
  }
  return new NextResponse(null, { status: 204 });
}
