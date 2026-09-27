import type { Caida, Escena, Punto } from "@/lib/social/caidas";
import { Kpi } from "../../ui/kpi";
import { AccionesVideo } from "./acciones-video";
import { Curva } from "./curva";

/**
 * Pestaña "Video y gancho". Skip rate y tiempo promedio vienen de la API de
 * Instagram; la retención promedio se calcula con la duración del análisis; la
 * curva solo existe si Victor sube la captura (la API no la entrega).
 */
const seg = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function VideoGancho({ mediaId, metricas, video, esVideo }: { mediaId: string; metricas: any | null; video: any | null; esVideo: boolean }) {
  if (!esVideo) return <p className="rounded-2xl border border-[#E3E6E0] bg-white p-6 text-sm text-[#55635C]">Esta publicación no es un video.</p>;
  const duracion: number | null = video?.duracion_s ? Number(video.duracion_s) : null;
  const promedio = metricas?.tiempo_promedio_ms ? Number(metricas.tiempo_promedio_ms) / 1000 : null;
  const retencion = promedio && duracion ? Math.round((promedio / duracion) * 100) : null;
  const repeticiones = metricas?.vistas && metricas?.alcance ? (Number(metricas.vistas) / Number(metricas.alcance)).toFixed(1) : null;
  const curva = (video?.curva ?? null) as Punto[] | null;
  const caidas = (video?.caidas ?? []) as Caida[];
  const escenas = (video?.escenas ?? []) as (Escena & { texto_pantalla?: string })[];
  const g = video?.gancho ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi etiqueta="Skip rate (se van en 3 s)" valor={metricas?.skip_rate != null ? `${Number(metricas.skip_rate).toFixed(1)} %` : "—"} aviso={Number(metricas?.skip_rate) > 60} />
        <Kpi etiqueta="Tiempo promedio visto" valor={promedio ? `${promedio.toFixed(1)} s` : "—"} nota={duracion ? `de ${seg(duracion)}` : undefined} />
        <Kpi etiqueta="Retención promedio" valor={retencion !== null ? `${retencion} %` : "—"} nota={retencion === null ? "necesita el análisis del video" : undefined} />
        <Kpi etiqueta="Repeticiones" valor={repeticiones ? `${repeticiones}×` : "—"} nota="vistas ÷ alcance" />
      </div>

      <section className="flex flex-col gap-4 rounded-2xl border border-[#E3E6E0] bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-lg font-bold">Cómo le fue al video</h2>
          <AccionesVideo mediaId={mediaId} hayAnalisis={!!g} />
        </div>
        {curva && curva.length > 4 ? (
          <Curva puntos={curva} caidas={caidas} />
        ) : (
          <p className="text-sm text-[#55635C]">
            Sin curva todavía. En la app de Instagram abre las estadísticas del reel, toma una captura de la gráfica de retención y súbela aquí.
          </p>
        )}
        {escenas.length > 0 && (
          <ol className="grid gap-1.5 text-xs sm:grid-cols-2 lg:grid-cols-4">
            {escenas.map((e, i) => (
              <li key={i} className="rounded-lg bg-[#F4F5F1] p-2">
                <b>{seg(e.t0)}–{seg(e.t1)}</b>
                <p className="text-[#33413A]">{e.dicho ? `«${e.dicho}»` : e.visual}</p>
                {e.texto_pantalla && <p className="text-[#55635C]">Texto: {e.texto_pantalla}</p>}
              </li>
            ))}
          </ol>
        )}
      </section>

      {g && (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl bg-[var(--verde)] p-5 text-[var(--niebla)]">
            <h2 className="text-lg font-bold text-white">Análisis del gancho</h2>
            <div className="my-3 flex gap-6">
              <p><span className="block text-3xl font-extrabold text-[var(--lima)]">{g.retencion?.total ?? "—"}</span><span className="text-xs">retención /100</span></p>
              <p><span className="block text-3xl font-extrabold text-white">{g.moneda_social?.total ?? "—"}</span><span className="text-xs">moneda social /100</span></p>
            </div>
            <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
              {(g.aciertos ?? []).map((a: string, i: number) => <li key={`a${i}`}>{a}</li>)}
              {(g.fallos ?? []).map((f: string, i: number) => <li key={`f${i}`} className="text-[#FFD4C4]">{f}</li>)}
            </ul>
          </section>
          <section className="flex flex-col gap-3 rounded-2xl border border-[#E3E6E0] bg-white p-5 text-sm">
            <h2 className="text-lg font-bold">Dónde cae y por qué</h2>
            {caidas.length === 0 ? (
              <p className="text-[#55635C]">{curva ? "No hay caídas bruscas: la retención baja de forma pareja." : "Sube la captura de retención para ver dónde cae."}</p>
            ) : caidas.map((c, i) => (
              <p key={i} className="flex gap-2.5">
                <span className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${c.gancho ? "bg-[#E08A2E]" : "bg-[#B8452E] text-white"}`}>{String.fromCharCode(65 + i)}</span>
                <span><b>{seg(c.desde)}–{seg(c.hasta)} · −{c.puntos} puntos</b>{c.gancho ? " en el gancho. " : ". "}{c.escena ? `En ese momento: ${c.escena.dicho ? `«${c.escena.dicho}»` : c.escena.visual}.` : ""}</span>
              </p>
            ))}
            {g.recomendacion && <p className="rounded-xl bg-[#F1F8E0] p-3"><b>Para el próximo video:</b> {g.recomendacion}</p>}
          </section>
        </div>
      )}
    </div>
  );
}
