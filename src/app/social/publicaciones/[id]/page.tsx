import { notFound } from "next/navigation";
import { comentariosDe, detallePublicacion, listaPublicacionesCorta } from "@/lib/social/consultas";
import { fechaHora } from "@/lib/social/fecha";
import { comentarios as comentariosIg } from "@/lib/social/instagram";
import { panelAbierto } from "@/lib/social/sesion";
import { ComentariosClave } from "./comentarios-clave";
import { Embudo } from "./embudo";
import { Encabezado } from "./encabezado";
import { KpisMetricas } from "./kpis-metricas";
import { PESTANAS, Pestanas, type Pestana } from "./pestanas";
import { Selector } from "./selector";
import { VideoGancho } from "./video-gancho";
import { LandingMapa } from "./landing-mapa";

export const dynamic = "force-dynamic";

export default async function PublicacionPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; f?: string }>;
}) {
  if (!(await panelAbierto())) return null;
  const { id } = await params;
  const { tab: t, f } = await searchParams;
  const tab: Pestana = PESTANAS.some((p) => p.id === t) ? (t as Pestana) : "resumen";
  const [d, publicaciones, comentarios] = await Promise.all([detallePublicacion(id), listaPublicacionesCorta(), comentariosDe(id)]);
  if (!d) notFound();
  // Publicación sin automatizar: los comentarios se muestran en vivo, sin clasificar.
  const lista = comentarios.length || tab !== "comentarios" ? comentarios
    : (await comentariosIg(id).catch(() => []))
        .filter((c) => !c.parent_id && (c.from?.username ?? c.username) !== "calidevdev")
        .map((c) => ({ id: c.id, usuario: c.from?.username ?? c.username ?? null, texto: c.text, tipo: null, tipoCorregido: null,
          confianza: null, accion: null, respuesta: null, estado: "sin_procesar", meGusta: c.like_count ?? null,
          ts: c.timestamp, cuando: fechaHora(c.timestamp.replace("+0000", "Z")) }));

  return (
    <main className="mx-auto flex max-w-[1180px] flex-col gap-4 px-4 py-6 md:px-8">
      <Selector actual={id} lista={publicaciones} />
      <Encabezado d={d} />
      <Pestanas mediaId={id} actual={tab} />
      {tab === "resumen" && (
        <>
          <KpisMetricas m={d.metricas} leads={d.embudo.si} />
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <Embudo e={d.embudo} />
            <ComentariosClave mediaId={id} comentarios={comentarios} filtro={f ?? "atencion"} tab="resumen" />
          </div>
        </>
      )}
      {tab === "comentarios" && <ComentariosClave mediaId={id} comentarios={lista} filtro={f ?? "todos"} tab="comentarios" />}
      {tab === "video" && <VideoGancho mediaId={id} metricas={d.metricas} video={d.video} esVideo={d.tipo === "REELS"} />}
      {tab === "landing" && <LandingMapa ruta={d.landing ? new URL(d.landing).pathname : null} mediaId={id} />}
    </main>
  );
}
