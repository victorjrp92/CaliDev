import type { Metadata } from "next";
import Link from "next/link";
import { diaLargo, fechaHora } from "@/lib/crm/formato";
import { hoy } from "@/lib/crm/hoy";
import { actorDePagina } from "@/lib/crm/pagina";
import { FilaCita } from "../agenda/fila-cita";
import { Seccion } from "../seccion";
import { SinPermiso } from "../sin-permiso";
import { Vacio } from "../vacio";
import { FilaOportunidad } from "../ventas/fila-oportunidad";
import { FilaTarea } from "./fila-tarea";
import { MetaSemana } from "./meta-semana";

export const metadata: Metadata = { title: "Hoy" };

export default async function Hoy() {
  const a = await actorDePagina();
  const h = await hoy(a);
  const ahora = new Date(h.ahora);
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <p className="mono text-[var(--verde)]">{diaLargo(h.dia)} · hora de Colombia</p>
        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight md:text-[34px]">Hola, {a.usuario.nombre.split(" ")[0]}</h1>
      </header>

      {h.embudo && <MetaSemana e={h.embudo} />}

      <div className="grid gap-8 lg:grid-cols-2">
        <Seccion
          titulo="Citas de hoy"
          cuenta={h.citas?.length}
          accion={h.citas_sin_hora ? <Link href="/crm/agenda" className="text-[13.5px] font-medium text-[var(--verde)] underline-offset-4 hover:underline">{h.citas_sin_hora} invitaciones sin hora</Link> : null}
        >
          {h.citas === null ? <SinPermiso que="la agenda" /> : h.citas.length ? (
            <div className="bloque divide-y divide-[var(--linea-tinta)]">{h.citas.map((c) => <FilaCita key={c.id} c={c} />)}</div>
          ) : <Vacio>No hay citas hoy.</Vacio>}
        </Seccion>

        <Seccion titulo="Esperan tu decisión" cuenta={h.aprobaciones?.total} accion={h.aprobaciones?.total ? <Link href="/crm/aprobaciones" className="text-[13.5px] font-medium text-[var(--verde)] underline-offset-4 hover:underline">Ver todas</Link> : null}>
          {h.aprobaciones === null ? <SinPermiso que="las aprobaciones" /> : h.aprobaciones.total ? (
            <div className="bloque divide-y divide-[var(--linea-tinta)] border-l-4 border-l-[var(--lima)]">
              {h.aprobaciones.primeras.slice(0, 5).map((p) => (
                <Link key={p.id} href={`/crm/aprobaciones#a${p.id}`} className="flex flex-col gap-1 px-4 py-3 hover:bg-[var(--hueso)]">
                  <span className="flex flex-wrap items-center gap-2"><span className="chip">{p.tipo}</span><span className="text-[13px] text-[#46554D]">pide {p.solicitante ?? "—"} · {fechaHora(p.created_at)}</span></span>
                  <span className="line-clamp-2 text-[14px]">{p.vista_previa}</span>
                </Link>
              ))}
            </div>
          ) : <Vacio>Nada esperando aprobación.</Vacio>}
        </Seccion>

        <Seccion titulo="Tareas para hoy" cuenta={h.tareas?.length}>
          {h.tareas === null ? <SinPermiso que="las tareas" /> : h.tareas.length ? (
            <div className="bloque divide-y divide-[var(--linea-tinta)]">{h.tareas.map((t) => <FilaTarea key={t.id} t={t} yo={a.usuario.id} ahora={ahora} />)}</div>
          ) : <Vacio>Ninguna tarea vence hoy.</Vacio>}
        </Seccion>

        <Seccion titulo="Próximo paso vencido" cuenta={h.oportunidades_vencidas?.length}>
          {h.oportunidades_vencidas === null ? <SinPermiso que="las ventas" /> : h.oportunidades_vencidas.length ? (
            <div className="bloque divide-y divide-[var(--linea-tinta)]">{h.oportunidades_vencidas.map((o) => <FilaOportunidad key={o.id} o={o} ahora={ahora} />)}</div>
          ) : <Vacio>Todas las oportunidades abiertas tienen su próximo paso al día.</Vacio>}
        </Seccion>
      </div>
    </div>
  );
}
