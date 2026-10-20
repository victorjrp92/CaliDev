import type { Metadata } from "next";
import Link from "next/link";
import { panelAbierto, panelConfigurado } from "@/lib/panel-leads";
import { armarPersonas, type Persona } from "@/lib/seguimiento/personas";
import { idDesdeInicio } from "@/lib/citas/horarios";
import { todasLasCitas } from "@/lib/citas/datos";
import { Puerta } from "./puerta";
import { Salir } from "./salir";
import { ResumenEtapas } from "./resumen-etapas";
import { TarjetaPersona } from "./tarjeta-persona";
import { InvitarCita } from "./invitar-cita";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Seguimiento de leads · CaliDev",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Seguimiento de cada lead hasta el cierre, en calidev.dev/servinomic/leads.
 *
 * Arriba, cuántos hay en cada etapa. Después, una ficha por persona ordenada
 * por lo que pide atención: primero a quien hay que invitar o enviarle la
 * propuesta, después las citas por venir, al final los cerrados. Al pie, una
 * invitación nueva para alguien que todavía no está en la lista (llegó por
 * Instagram).
 */
export default async function SeguimientoLeads() {
  if (!panelConfigurado()) {
    return (
      <main className="mx-auto max-w-sm px-5 py-24">
        <p className="mono text-[var(--verde)]">Panel privado</p>
        <h1 className="mt-3 text-[26px] font-extrabold leading-tight">Falta configurarlo</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#46554D]">
          No hay contraseña puesta en este entorno. Se define en la variable
          <code className="mono mx-1">PANEL_LEADS_PASSWORD</code>.
        </p>
      </main>
    );
  }
  if (!(await panelAbierto())) return <Puerta />;

  let personas: Persona[] = [];
  let ocupados: string[] = [];
  let fallo: string | null = null;
  try {
    const [p, citas] = await Promise.all([armarPersonas(), todasLasCitas()]);
    personas = p;
    ocupados = citas.map((c) => idDesdeInicio(c.inicio)).filter((x): x is string => Boolean(x));
  } catch (err) {
    console.error("seguimiento:", err);
    fallo = "No pudimos leer la base de datos.";
  }

  const activos = personas.filter((p) => !["ganado", "perdido", "pausa"].includes(p.etapa));
  const cerrados = personas.filter((p) => ["ganado", "perdido", "pausa"].includes(p.etapa));

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mono text-[var(--verde)]">Panel privado</p>
          <h1 className="mt-2 text-[30px] font-extrabold leading-tight tracking-tight">Seguimiento de leads</h1>
          <Link href="/servinomic/contratos" className="mt-1 inline-block text-[14px] font-semibold text-[var(--verde)] underline underline-offset-2">
            Ver contratos
          </Link>
        </div>
        <Salir />
      </div>

      {fallo && <p role="alert" className="mt-6 text-[15px] text-[#B42318]">{fallo}</p>}

      <div className="mt-6">
        <ResumenEtapas personas={personas} />
      </div>

      <ul className="mt-6 flex flex-col gap-4">
        {activos.map((p) => (
          <TarjetaPersona key={p.clave} persona={p} ocupados={ocupados} />
        ))}
      </ul>

      {cerrados.length > 0 && (
        <details className="mt-8">
          <summary className="cursor-pointer text-[15px] font-bold">Cerrados y en pausa ({cerrados.length})</summary>
          <ul className="mt-4 flex flex-col gap-4">
            {cerrados.map((p) => (
              <TarjetaPersona key={p.clave} persona={p} ocupados={ocupados} />
            ))}
          </ul>
        </details>
      )}

      <section className="mt-10 rounded-3xl border border-[#D8DCD4] bg-white p-5">
        <h2 className="text-[20px] font-extrabold tracking-tight">Nueva invitación</h2>
        <p className="mt-1 text-[14px] text-[#46554D]">
          Para alguien que todavía no está en la lista, por ejemplo quien escribió por Instagram. Elige el tipo de cita y los horarios.
        </p>
        <div className="mt-4">
          <InvitarCita tipo="primera" ocupados={ocupados} elegirTipo />
        </div>
      </section>
    </main>
  );
}
