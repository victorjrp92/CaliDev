import { NextResponse } from "next/server";
import { fijarConteoIg, guardarPublicacion } from "@/lib/social/datos";
import { publicaciones } from "@/lib/social/instagram";
import { sinSesion } from "@/lib/social/sesion";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Trae las publicaciones de Instagram a la base (espejo, sin tocar automatizaciones). */
export async function POST() {
  const no = await sinSesion();
  if (no) return no;
  const ps = await publicaciones(50);
  for (const p of ps) {
    await guardarPublicacion({
      id: p.id, caption: p.caption, permalink: p.permalink, publicado: p.timestamp,
      miniatura: p.thumbnail_url ?? p.media_url, tipo: p.media_product_type ?? p.media_type,
      enPerfil: p.media_product_type === "REELS" ? p.is_shared_to_feed !== false : true,
    });
    await fijarConteoIg(p.id, p.comments_count ?? 0);
  }
  return NextResponse.json({ publicaciones: ps.length });
}
