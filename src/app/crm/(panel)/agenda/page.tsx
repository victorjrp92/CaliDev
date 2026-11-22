import type { Metadata } from "next";
import { NuevaCita } from "@/app/servinomic/leads/nueva-cita";
import { todasLasCitas } from "@/lib/citas/datos";
import { idDesdeInicio } from "@/lib/citas/horarios";
import { citasEntre, citasSinHora, semanaColombia, type CitaAgenda } from "@/lib/crm/agenda";
import { diaLargo, fecha, ZONA } from "@/lib/crm/formato";
import { actorDePagina, tiene } from "@/lib/crm/pagina";
import { Seccion } from "../seccion";
import { SinPermiso } from "../sin-permiso";
import { Vacio } from "../vacio";
import { FilaCita, NOMBRE_TIPO_CITA } from "./fila-cita";

export const metadata: Metadata = { title: "Agenda" };

const diaDe = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));

/** La semana en curso (lunes a domingo, hora de Colombia) por día, y las invitaciones que aún no tienen hora. */
export default async function Agenda() {
  const a = await actorDePagina();
  if (!tiene(a, "agenda:leer")) return <SinPermiso que="la agenda" />;
  const { desde, hasta } = semanaColombia();
  const [citas, sinHora, todas] = await Promise.all([citasEntre(desde, hasta), citasSinHora(50), todasLasCitas()]);
  const ocupados = todas.map((c) => idDesdeInicio(c.inicio)).filter((x): x is string => Boolean(x));

  const porDia = new Map<string, CitaAgenda[]>();
  for (const c of citas) {
    const d = diaDe(c.inicio);
    porDia.set(d, [...(porDia.get(d) ?? []), c]);
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <p className="mono text-[var(--verde)]">{fecha(desde)} al {fecha(new Date(hasta.getTime() - 864e5))} · hora de Colombia</p>
        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight md:text-[34px]">Agenda</h1>
      </header>

      {tiene(a, "agenda:escribir") && <NuevaCita ocupados={ocupados} />}

      <Seccion titulo="Esta semana" cuenta={citas.length}>
        {porDia.size ? (
          <div className="flex flex-col gap-6">
            {[...porDia].map(([dia, delDia]) => (
              <div key={dia} className="flex flex-col gap-2">
                <h3 className="px-1 text-[14.5px] font-bold capitalize">{diaLargo(dia)}</h3>
                <div className="bloque divide-y divide-[var(--linea-tinta)]">{delDia.map((c) => <FilaCita key={c.id} c={c} />)}</div>
              </div>
            ))}
          </div>
        ) : <Vacio>No hay citas esta semana.</Vacio>}
      </Seccion>

      <Seccion titulo="Invitaciones sin hora" cuenta={sinHora.length}>
        {sinHora.length ? (
          <div className="bloque divide-y divide-[var(--linea-tinta)]">
            {sinHora.map((c) => (
              <div key={c.id} className="flex min-w-0 flex-col gap-1 px-4 py-3">
                <span className="flex flex-wrap items-center gap-2"><span className="font-semibold">{c.nombre}</span><span className="chip">{NOMBRE_TIPO_CITA[c.tipo]}</span></span>
                <span className="break-words text-[13.5px] text-[#46554D]">{c.correo} · enviada {fecha(c.creada)}</span>
              </div>
            ))}
          </div>
        ) : <Vacio>Ninguna invitación espera hora.</Vacio>}
      </Seccion>
    </div>
  );
}
