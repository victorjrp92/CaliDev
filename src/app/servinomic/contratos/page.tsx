import type { Metadata } from "next";
import Link from "next/link";
import { panelAbierto, panelConfigurado } from "@/lib/panel-leads";
import { todosLosContratos, type Contrato, type Firmante } from "@/lib/contratos/datos";
import type { DatosServinomic } from "@/lib/contratos/plantilla-servinomic";
import { Puerta } from "../leads/puerta";
import { Salir } from "../leads/salir";
import { TarjetaContrato } from "./tarjeta-contrato";
import { NuevoContrato, type Base } from "./nuevo-contrato";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contratos · CaliDev",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Los contratos, en calidev.dev/servinomic/contratos (misma contraseña que el
 * panel de leads).
 *
 * Arriba cuántos esperan firma y cuántos están cerrados; después, el
 * formulario para crear uno nuevo desde la plantilla de ServiNomic; al final,
 * una tarjeta por contrato con quién firmó, cuándo, sus enlaces y la
 * descarga. Primero los que esperan alguna firma.
 */
export default async function Contratos() {
  if (!panelConfigurado()) return <main className="mx-auto max-w-sm px-5 py-24">Falta configurar el panel.</main>;
  if (!(await panelAbierto())) return <Puerta />;

  let contratos: (Contrato & { firmantes: Firmante[] })[] = [];
  let fallo: string | null = null;
  try {
    contratos = await todosLosContratos();
  } catch (err) {
    console.error("contratos:", err);
    fallo = "No pudimos leer la base de datos.";
  }

  const completo = (c: (typeof contratos)[number]) => c.firmantes.length > 0 && c.firmantes.every((f) => f.firmado_at);
  const pendientes = contratos.filter((c) => !completo(c));
  const firmados = contratos.filter(completo);
  const bases: Base[] = contratos
    .filter((c) => c.datos)
    .map((c) => ({ id: c.id, titulo: c.titulo, datos: JSON.parse(c.datos!) as DatosServinomic }));

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mono text-[var(--verde)]">Panel privado</p>
          <h1 className="mt-2 text-[30px] font-extrabold leading-tight tracking-tight">Contratos</h1>
          <Link href="/servinomic/leads" className="mt-1 inline-block text-[14px] font-semibold text-[var(--verde)] underline underline-offset-2">
            Ir al seguimiento de leads
          </Link>
          <Link href="/servinomic/arranques" className="ml-4 mt-1 inline-block text-[14px] font-semibold text-[var(--verde)] underline underline-offset-2">
            Arranques
          </Link>
        </div>
        <Salir />
      </div>

      {fallo && <p role="alert" className="mt-6 text-[15px] text-[#B42318]">{fallo}</p>}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:max-w-md">
        <div className="rounded-2xl border border-[#D8DCD4] bg-white p-4">
          <p className="mono text-[11px] text-[#46554D]">Esperan firma</p>
          <p className="mt-1 text-[28px] font-extrabold">{pendientes.length}</p>
        </div>
        <div className="rounded-2xl border border-[#D8DCD4] bg-white p-4">
          <p className="mono text-[11px] text-[#46554D]">Firmados por todos</p>
          <p className="mt-1 text-[28px] font-extrabold">{firmados.length}</p>
        </div>
      </div>

      <div className="mt-6">
        <NuevoContrato bases={bases} />
      </div>

      {contratos.length === 0 && !fallo && (
        <p className="mt-8 text-[15px] text-[#46554D]">Todavía no hay contratos. Crea el primero con el botón de arriba.</p>
      )}

      {pendientes.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[18px] font-bold">Esperan firma</h2>
          <ul className="mt-3 flex flex-col gap-4">
            {pendientes.map((c) => (
              <TarjetaContrato key={c.id} contrato={c} />
            ))}
          </ul>
        </section>
      )}

      {firmados.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[18px] font-bold">Firmados por todos</h2>
          <ul className="mt-3 flex flex-col gap-4">
            {firmados.map((c) => (
              <TarjetaContrato key={c.id} contrato={c} />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
