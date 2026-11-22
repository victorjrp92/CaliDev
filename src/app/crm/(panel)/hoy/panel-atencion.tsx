import { cuando, fechaHora } from "@/lib/crm/formato";
import type { Hoy } from "@/lib/crm/hoy";
import { FilaEnlace } from "../fila-enlace";
import { FilaTarea } from "./fila-tarea";

/**
 * Lo que pide una decisión hoy: próximos pasos vencidos, aprobaciones y tareas.
 * Un grupo que el rol no puede ver no aparece; si todo está al día, se dice.
 */
export function PanelAtencion({ h, yo, tareas }: { h: Hoy; yo: number; tareas: Hoy["tareas"] }) {
  const ahora = new Date(h.ahora);
  const vencidas = h.oportunidades_vencidas ?? [];
  const aprob = h.aprobaciones;
  const nada = !vencidas.length && !aprob?.total && !tareas?.length;
  return (
    <section className="panel min-w-0 flex-[2_1_320px] overflow-hidden pb-1" aria-labelledby="t-atencion">
      <div className="px-[18px] pb-0.5 pt-4">
        <h2 id="t-atencion" className="titulo-2">Pide tu atención</h2>
      </div>
      {nada && <p className="nota px-[18px] py-4">Todo al día: nada vencido, nada esperando decisión.</p>}

      {!!vencidas.length && (
        <>
          <h3 className="subgrupo"><span>Próximo paso vencido</span><span className="num">{vencidas.length}</span></h3>
          {vencidas.slice(0, 6).map((o) => (
            <FilaEnlace key={o.id} href={`/crm/ventas/${o.id}`} titulo={o.proximo_paso || o.titulo} alerta
              detalle={`${o.persona ?? o.empresa ?? o.titulo} · debía ${cuando(o.proximo_paso_at, ahora).texto}`} />
          ))}
        </>
      )}

      {!!aprob?.total && (
        <>
          <h3 className="subgrupo"><span>Aprobaciones pendientes</span><span className="num">{aprob.total}</span></h3>
          {aprob.primeras.slice(0, 4).map((p) => (
            <FilaEnlace key={p.id} href={`/crm/aprobaciones#a${p.id}`} titulo={p.vista_previa || p.tipo}
              detalle={`${p.tipo} · lo pide ${p.solicitante ?? "—"} · ${fechaHora(p.created_at)}`} />
          ))}
        </>
      )}

      {!!tareas?.length && (
        <>
          <h3 className="subgrupo"><span>Tareas que vencen hoy</span><span className="num">{tareas.length}</span></h3>
          {tareas.map((t) => <FilaTarea key={t.id} t={t} yo={yo} ahora={ahora} />)}
        </>
      )}
    </section>
  );
}
