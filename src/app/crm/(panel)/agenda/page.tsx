import type { Metadata } from "next";
import { NuevaCita } from "@/app/servinomic/leads/nueva-cita";
import { todasLasCitas } from "@/lib/citas/datos";
import { idDesdeInicio } from "@/lib/citas/horarios";
import { citasEntre, citasSinHora, semanaColombia, type CitaAgenda } from "@/lib/crm/agenda";
import { diaLargo, fecha, ZONA } from "@/lib/crm/formato";
import { actorDePagina, tiene } from "@/lib/crm/pagina";
import { BarraSeccion } from "../barra-seccion";
import { Cuerpo } from "../cuerpo";
import { SinPermiso } from "../sin-permiso";
import { Vacio } from "../vacio";
import { FilaCita, NOMBRE_TIPO_CITA } from "./fila-cita";

export const metadata: Metadata = { title: "Agenda" };

const diaDe = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));

type Props = { searchParams: Promise<{ vista?: string; nueva?: string }> };

/** La semana en curso (lunes a domingo, hora de Colombia) por día, y las invitaciones que aún no tienen hora. */
export default async function Agenda({ searchParams }: Props) {
  const a = await actorDePagina();
  if (!tiene(a, "agenda:leer")) return <><BarraSeccion titulo="Agenda" /><Cuerpo><SinPermiso que="la agenda" /></Cuerpo></>;
  const sp = await searchParams;
  const vistaSinHora = sp.vista === "sinhora";
  const escribir = tiene(a, "agenda:escribir");
  const { desde, hasta } = semanaColombia();
  const [citas, sinHora, todas] = await Promise.all([citasEntre(desde, hasta), citasSinHora(50), escribir ? todasLasCitas() : Promise.resolve([])]);
  const ocupados = todas.map((c) => idDesdeInicio(c.inicio)).filter((x): x is string => Boolean(x));

  const porDia = new Map<string, CitaAgenda[]>();
  for (const c of citas) {
    const d = diaDe(c.inicio);
    porDia.set(d, [...(porDia.get(d) ?? []), c]);
  }
  const base = vistaSinHora ? "/crm/agenda?vista=sinhora" : "/crm/agenda";

  return (
    <>
      <BarraSeccion
        titulo="Agenda"
        subtitulo={`${fecha(desde)} al ${fecha(new Date(hasta.getTime() - 864e5))} · hora de Colombia`}
        segmentos={[
          { href: "/crm/agenda", etiqueta: "Semana", cuenta: citas.length, activo: !vistaSinHora },
          { href: "/crm/agenda?vista=sinhora", etiqueta: "Sin hora", cuenta: sinHora.length, activo: vistaSinHora },
        ]}
        accion={escribir ? { href: `${base}${vistaSinHora ? "&" : "?"}nueva=1`, etiqueta: "Nueva cita" } : undefined}
      />
      <Cuerpo>
        {escribir && sp.nueva === "1" && <div className="siempre-claro"><NuevaCita ocupados={ocupados} /></div>}

        {vistaSinHora ? (
          sinHora.length ? (
            <div className="bloque">
              {sinHora.map((c, i) => (
                <div key={c.id} className={`fila ${i === 0 ? "!border-t-0" : ""}`}>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="fuerte truncate">{c.nombre}</span>
                    <span className="nota break-words">{c.correo} · enviada {fecha(c.creada)}</span>
                  </span>
                  <span className="pill pill-neutro">{NOMBRE_TIPO_CITA[c.tipo]}</span>
                </div>
              ))}
            </div>
          ) : <Vacio>Ninguna invitación espera hora.</Vacio>
        ) : porDia.size ? (
          [...porDia].map(([dia, delDia]) => (
            <section key={dia} className="bloque" aria-label={diaLargo(dia)}>
              <h2 className="subgrupo"><span className="capitalize-first">{diaLargo(dia)}</span><span className="num">{delDia.length}</span></h2>
              {delDia.map((c) => <FilaCita key={c.id} c={c} />)}
            </section>
          ))
        ) : <Vacio>No hay citas esta semana.</Vacio>}
      </Cuerpo>
    </>
  );
}
