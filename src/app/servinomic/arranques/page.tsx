import type { Metadata } from "next";
import Link from "next/link";
import { panelAbierto, panelConfigurado } from "@/lib/panel-leads";
import { respuestasDe, todosLosArranques, type Arranque } from "@/lib/arranque/datos";
import { avance } from "@/lib/arranque/validar";
import { fechaColombia } from "@/lib/contratos/correos";
import { Puerta } from "../leads/puerta";
import { Salir } from "../leads/salir";
import { CopiarEnlace } from "../contratos/copiar-enlace";
import { NuevoArranque } from "./nuevo-arranque";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Arranques · CaliDev",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Formularios de arranque de ServiNomic: uno por cliente nuevo, con su avance
 * y si ya lo envió. Desde aquí se crea el enlace y se abren las respuestas.
 */
export default async function Arranques() {
  if (!panelConfigurado()) return <main className="mx-auto max-w-sm px-5 py-24">Falta configurar el panel.</main>;
  if (!(await panelAbierto())) return <Puerta />;

  let lista: Arranque[] = [];
  let fallo: string | null = null;
  try {
    lista = await todosLosArranques();
  } catch (err) {
    console.error("arranques:", err);
    fallo = "No pudimos leer la base de datos.";
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mono text-[var(--verde)]">Panel privado</p>
          <h1 className="mt-2 text-[30px] font-extrabold leading-tight tracking-tight">Arranques de ServiNomic</h1>
          <p className="mt-1 flex flex-wrap gap-x-4 text-[14px] font-semibold">
            <Link href="/servinomic/leads" className="text-[var(--verde)] underline underline-offset-2">Leads</Link>
            <Link href="/servinomic/contratos" className="text-[var(--verde)] underline underline-offset-2">Contratos</Link>
          </p>
        </div>
        <Salir />
      </div>

      {fallo && <p role="alert" className="mt-6 text-[15px] text-[#B42318]">{fallo}</p>}

      <div className="mt-6">
        <NuevoArranque />
      </div>

      <ul className="mt-8 flex flex-col gap-4">
        {lista.map((a) => {
          const { porcentaje } = avance(respuestasDe(a));
          const enlace = `https://calidev.dev/arranque/${a.token}`;
          return (
            <li key={a.id} className="rounded-2xl border border-[#D8DCD4] bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[17px] font-bold">{a.negocio || a.cliente}</p>
                  <p className="text-[13px] text-[#46554D]">
                    {a.cliente} · creado el {fechaColombia(a.created_at).replace(" (hora de Colombia)", "")}
                  </p>
                </div>
                <span className={`mono rounded-full px-2.5 py-1 text-[10.5px] ${a.enviado_at ? "bg-[var(--verde)] text-[var(--lima)]" : "bg-[#FDF3D8] text-[#6B4E00]"}`}>
                  {a.enviado_at ? `Enviado · ${fechaColombia(a.enviado_at).replace(" (hora de Colombia)", "")}` : `En curso · ${porcentaje}%`}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E3E6E0]">
                <div className="h-full rounded-full bg-[var(--verde)]" style={{ width: `${porcentaje}%` }} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Link href={`/servinomic/arranques/${a.id}`} className="rounded-lg bg-[var(--lima)] px-3.5 py-2 text-[13px] font-bold text-[var(--tinta)]">
                  Ver respuestas
                </Link>
                <CopiarEnlace enlace={enlace} />
                <span className="text-[12.5px] text-[#5A6B63]">Última actividad: {fechaColombia(a.updated_at).replace(" (hora de Colombia)", "")}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
