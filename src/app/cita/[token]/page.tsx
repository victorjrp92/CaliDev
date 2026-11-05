import { notFound } from "next/navigation";
import { citaPorToken, horasOcupadas, sesionesDe } from "@/lib/citas/datos";
import { describir, disponibleAun, horaDe, horarioDeCita, horariosDeCita, porDia, textoDuracion, tipoDe } from "@/lib/citas/horarios";
import { enlaceGoogleCalendar } from "@/lib/citas/ics";
import { NOMBRE_PROGRAMA, esSesion, nombreSaludo, rotuloSesion } from "@/lib/citas/sesion";
import { ElegirHorario, type GrupoHorarios } from "@/components/citas/elegir-horario";

export const dynamic = "force-dynamic";

/**
 * La página personal de una cita: calidev.dev/cita/<token>.
 *
 * Llega desde un botón del correo con `?h=<horario>` ya marcado, pero no
 * reserva nada hasta que la persona pulsa «Confirmar». Si ya tenía hora, la
 * página la muestra y le deja cambiarla.
 */
export default async function PaginaCita({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ h?: string }>;
}) {
  const { token } = await params;
  const { h } = await searchParams;

  const cita = await citaPorToken(token);
  if (!cita) notFound();

  const ocupadas = new Set(await horasOcupadas(cita.id));
  const reservado = horarioDeCita(cita);
  const segunda = tipoDe(cita) === "segunda";
  const sesion = esSesion(cita);
  // Las sesiones se agendan una tras otra: al confirmar, la página lleva a la que falta.
  const pendiente = sesion ? (await sesionesDe(cita.correo)).find((c) => c.id !== cita.id && !c.inicio) : undefined;

  const ofrecidos = horariosDeCita(cita);
  const grupos: GrupoHorarios[] = porDia(ofrecidos).map((g) => ({
    dia: g.dia,
    horarios: g.horarios.map((x) => ({
      id: x.id,
      hora: horaDe(x.inicio),
      descripcion: describir(x),
      estado: !disponibleAun(x) ? "pasado" : ocupadas.has(x.inicio.getTime()) ? "ocupado" : "libre",
    })),
  }));

  const preseleccion = ofrecidos.find((x) => x.id === h);

  return (
    <main className="mx-auto max-w-xl px-5 pb-16 pt-10">
      <p className="mono text-[var(--verde)]">
        {sesion
          ? `${NOMBRE_PROGRAMA} · ${rotuloSesion(cita)} · ${textoDuracion(cita)}`
          : segunda
            ? `Presentación de la propuesta · ${textoDuracion(cita)}`
            : `Videollamada gratuita · ${textoDuracion(cita)}`}
      </p>
      <h1 className="mt-3 text-[32px] font-extrabold leading-[1.1] tracking-tight [text-wrap:balance]">
        {nombreSaludo(cita)}, elige tu horario.
      </h1>
      <p className="mt-3 text-[16px] leading-relaxed text-[#2C3A33]">
        {sesion
          ? "Una hora incluida en tu contrato, dedicada al crecimiento de tu empresa: procesos, organización del equipo y lo que necesites priorizar."
          : segunda
          ? "Revisamos juntos tu propuesta de trabajo y sus opciones. Cuando elijas la que te sirva, te envío la propuesta formal con el presupuesto."
          : "Me cuentas cómo funciona tu negocio y sus procesos. Después te envío una propuesta de trabajo y, cuando elijas la opción que te sirva, la propuesta formal con el presupuesto."}
      </p>
      <ElegirHorario
        token={cita.token}
        grupos={grupos}
        inicial={preseleccion?.id ?? reservado?.id ?? null}
        nombreCita={sesion ? rotuloSesion(cita) : "videollamada"}
        siguiente={pendiente ? { rotulo: rotuloSesion(pendiente), enlace: `/cita/${pendiente.token}` } : null}
        reservado={
          reservado
            ? { id: reservado.id, descripcion: describir(reservado), google: enlaceGoogleCalendar(cita, reservado) }
            : null
        }
      />
    </main>
  );
}
