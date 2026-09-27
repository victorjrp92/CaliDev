import { clicsPorPosicion, mapaLanding } from "@/lib/social/consultas";
import { Kpi } from "../../ui/kpi";
import { MapaCalor } from "./mapa-calor";

/**
 * "Landing y mapa de calor", con datos del seguimiento propio (30 días).
 * Sirve para una publicación (mediaId: cuántas visitas vinieron de ella) y
 * para la página Landings (mediaId null).
 */
const NOMBRE_SECCION: Record<string, string> = {
  propuesta: "Propuesta de valor", caso: "Caso LimpiaExpress", servicio: "Cómo trabajamos",
  despues: "Qué pasa después", formulario: "Formulario", detalle: "Cómo se ve por dentro",
  preguntas: "Preguntas frecuentes", cierre: "Cierre",
};
const PASOS = ["Empezaron", "Pasaron a contacto", "Dejaron sus datos", "Completaron"];

export async function LandingMapa({ ruta, mediaId }: { ruta: string | null; mediaId: string | null }) {
  if (!ruta) {
    return <p className="rounded-2xl border border-[#E3E6E0] bg-white p-6 text-sm text-[#55635C]">Esta publicación no tiene landing. Asígnale una en su automatización.</p>;
  }
  const [m, clics] = await Promise.all([mapaLanding(ruta, mediaId), clicsPorPosicion(ruta)]);
  if (m.total === 0) {
    return <p className="rounded-2xl border border-[#E3E6E0] bg-white p-6 text-sm text-[#55635C]">Todavía no hay visitas medidas en {ruta} (últimos 30 días). El seguimiento empieza cuando la landing con medición esté en producción.</p>;
  }
  const muertos = clics.filter((c) => c.muerto).length;
  const rabia = clics.filter((c) => c.rabia).length;
  const maxPaso = Math.max(1, m.pasos[0].n);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi etiqueta="Visitas (30 días)" valor={m.total} />
        {mediaId ? <Kpi etiqueta="Desde esta publicación" valor={m.desdeEsta} destacado /> : <Kpi etiqueta="Desde Instagram" valor={m.desdeEsta} destacado />}
        <Kpi etiqueta="Desde el celular" valor={`${m.celular} %`} />
        <Kpi etiqueta="Bajan en promedio" valor={`${m.scrollMedio} %`} />
        <Kpi etiqueta="Clics muertos / de rabia" valor={`${muertos} / ${rabia}`} aviso={rabia > 0} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <section className="rounded-2xl border border-[#E3E6E0] bg-white p-4">
          <h2 className="mb-2 text-lg font-bold">Mapa de calor</h2>
          <MapaCalor secciones={m.secciones} clics={clics} />
          <p className="mt-2 text-xs text-[#55635C]">Naranja: clics. Con borde: clics de rabia. Gris: clics sin efecto. El verde de fondo: cuánta gente llegó a esa sección.</p>
        </section>
        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border border-[#E3E6E0] bg-white p-5">
            <h2 className="mb-3 text-lg font-bold">Hasta dónde llegan</h2>
            <ol className="flex flex-col gap-2 text-sm">
              {m.secciones.map((s) => (
                <li key={s.seccion} className="grid grid-cols-[minmax(0,12rem)_1fr_3rem] items-center gap-3">
                  <span>{NOMBRE_SECCION[s.seccion] ?? s.seccion}</span>
                  <span className="h-4 rounded bg-[#F0F2EE]"><span className={`block h-full rounded ${s.seccion === "formulario" ? "bg-[#E08A2E]" : "bg-[var(--verde)]"}`} style={{ width: `${s.pct}%` }} /></span>
                  <b className="text-right">{s.pct} %</b>
                </li>
              ))}
            </ol>
          </section>
          <section className="rounded-2xl border border-[#E3E6E0] bg-white p-5">
            <h2 className="mb-3 text-lg font-bold">Formulario: dónde abandonan</h2>
            <div className="grid h-36 grid-cols-4 items-end gap-3">
              {m.pasos.map((p, i) => (
                <div key={p.paso} className="flex h-full flex-col items-center justify-end gap-1.5">
                  <b>{p.n}</b>
                  <div className={`w-full rounded-t-lg ${i === 3 ? "bg-[var(--lima)]" : "bg-[var(--verde)]"}`} style={{ height: `${Math.max(3, (p.n / maxPaso) * 100)}%` }} />
                </div>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-4 gap-3 text-center text-xs text-[#33413A]">{PASOS.map((p) => <span key={p}>{p}</span>)}</div>
          </section>
          <section className="rounded-2xl border border-[#E3E6E0] bg-white p-5">
            <h2 className="mb-3 text-lg font-bold">Qué tocan más</h2>
            {m.clics.length === 0 ? <p className="text-sm text-[#55635C]">Sin clics registrados.</p> : (
              <ul className="flex flex-col divide-y divide-[#EEF0EB] text-sm">
                {m.clics.map((c, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-2 py-2">
                    <b className="w-10">{c.n}</b>
                    <span className="min-w-0 flex-1 break-all font-mono text-xs">{c.selector}</span>
                    <span className="text-xs text-[#55635C]">{NOMBRE_SECCION[c.seccion ?? ""] ?? ""}</span>
                    {c.muertos > 0 && <span className="rounded-md bg-[#FDEDEA] px-2 py-0.5 text-xs text-[#8F2E1B]">{c.muertos} sin efecto</span>}
                    {c.rabia > 0 && <span className="rounded-md bg-[#FBE4DE] px-2 py-0.5 text-xs font-semibold text-[#8F2E1B]">{c.rabia} de rabia</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
