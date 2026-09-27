import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { detallePublicacion } from "@/lib/social/consultas";
import { automatizacion } from "@/lib/social/datos";
import { panelAbierto } from "@/lib/social/sesion";
import { TEXTOS_INICIALES } from "@/lib/social/textos";
import { Editor, type ConfigEditable } from "./editor";

export const dynamic = "force-dynamic";

const PREDETERMINADA: ConfigEditable = {
  modo: "apagado", sensible: false, landingUrl: null, palabrasClave: ["ayuda", "info"],
  detectarInteres: true, umbral: 0.7, contexto: null, textos: TEXTOS_INICIALES,
};

export default async function AutomatizacionPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await panelAbierto())) return null;
  const { id } = await params;
  const [d, a, otrasFilas] = await Promise.all([
    detallePublicacion(id),
    automatizacion(id),
    sql`SELECT a.media_id, p.caption FROM social_automatizaciones a JOIN social_publicaciones p USING (media_id) WHERE a.media_id <> ${id}`,
  ]);
  if (!d) notFound();
  const otras = (await Promise.all(otrasFilas.rows.map(async (r) => {
    const x = await automatizacion(r.media_id);
    return x ? { mediaId: r.media_id as string, titulo: String(r.caption ?? "").split("\n")[0].slice(0, 60), config: x } : null;
  }))).filter((x) => x !== null);
  const landings = [...new Set(["https://calidev.dev/servinomic/limpiaexpress", ...otras.map((o) => o.config.landingUrl).filter((l): l is string => !!l)])];

  return (
    <main className="mx-auto flex max-w-[1180px] flex-col gap-4 px-4 py-7 md:px-8">
      <div>
        <p className="text-sm text-[#55635C]">Automatización</p>
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight">{d.titulo}</h1>
      </div>
      <Editor mediaId={id} inicial={a ?? PREDETERMINADA} landings={landings} otras={otras} />
    </main>
  );
}
