import Link from "next/link";
import type { CitaAgenda } from "@/lib/crm/agenda";
import { FilaCita } from "../agenda/fila-cita";
import { SinPermiso } from "../sin-permiso";

/** Las citas del día, y al pie las invitaciones que aún no tienen hora. */
export function PanelCitas({ citas, sinHora }: { citas: CitaAgenda[] | null; sinHora: number | null }) {
  return (
    <section className="panel min-w-0 flex-[3_1_420px] overflow-hidden" aria-labelledby="t-citas">
      <div className="panel-cabeza">
        <h2 id="t-citas" className="titulo-2">Citas</h2>
        {citas && <span className="nota num">{citas.length} hoy · hora de Colombia</span>}
      </div>
      {citas === null ? <SinPermiso que="la agenda" /> : citas.length ? (
        citas.map((c) => <FilaCita key={c.id} c={c} />)
      ) : (
        <p className="fila nota">No hay citas hoy.</p>
      )}
      {!!sinHora && (
        <div className="fila">
          <span className="hora nota !text-[13px]">—</span>
          <span className="nota flex-1">{sinHora === 1 ? "1 invitación enviada sin hora reservada" : `${sinHora} invitaciones enviadas sin hora reservada`}</span>
          <Link href="/crm/agenda?vista=sinhora" className="text-[13px] font-semibold">Ver en Agenda</Link>
        </div>
      )}
    </section>
  );
}
