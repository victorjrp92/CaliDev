import type { Metadata } from "next";
import Link from "next/link";
import { ETAPAS_ABIERTAS, ETAPAS_CERRADAS, NOMBRE_ETAPA } from "@/lib/crm/etapas";
import { paraInputFecha } from "@/lib/crm/formato";
import { listarOportunidades } from "@/lib/crm/oportunidades";
import { actorDePagina, tiene } from "@/lib/crm/pagina";
import { buscarPersonas } from "@/lib/crm/personas";
import { SinPermiso } from "../sin-permiso";
import { Vacio } from "../vacio";
import { ColumnaEtapa } from "./columna-etapa";
import { FilaOportunidad } from "./fila-oportunidad";
import { NuevaOportunidad } from "./nueva-oportunidad";

export const metadata: Metadata = { title: "Ventas" };

/** Pipeline: las abiertas por etapa, de izquierda a derecha; las cerradas aparte. */
export default async function Ventas({ searchParams }: { searchParams: Promise<{ vista?: string; nueva?: string; persona?: string }> }) {
  const a = await actorDePagina();
  if (!tiene(a, "ventas:leer")) return <SinPermiso que="las ventas" />;
  const sp = await searchParams;
  const cerradas = sp.vista === "cerradas";
  const ahora = new Date();
  const todas = await listarOportunidades({ limite: 1000 });
  const personas = tiene(a, "ventas:escribir") && tiene(a, "contactos:leer") ? await buscarPersonas(null, 200) : [];
  const personaInicial = Number(sp.persona) || null;

  const pestana = (v: string | null, t: string, n: number) => (
    <Link href={v ? `/crm/ventas?vista=${v}` : "/crm/ventas"} aria-current={(v === "cerradas") === cerradas ? "page" : undefined}
      className={`rounded-full px-3.5 py-1.5 text-[14px] font-medium ${(v === "cerradas") === cerradas ? "bg-[var(--verde)] text-[var(--hueso)]" : "text-[var(--verde)] hover:bg-[var(--niebla)]"}`}>
      {t} <span className="cifra opacity-75">{n}</span>
    </Link>
  );
  const abiertas = todas.filter((o) => ETAPAS_ABIERTAS.includes(o.etapa));
  const fin = todas.filter((o) => ETAPAS_CERRADAS.includes(o.etapa));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="mono text-[var(--verde)]">Pipeline</p>
          <h1 className="text-[28px] font-extrabold leading-tight tracking-tight md:text-[34px]">Ventas</h1>
        </div>
        <nav aria-label="Vista" className="flex gap-1">{pestana(null, "Abiertas", abiertas.length)}{pestana("cerradas", "Cerradas", fin.length)}</nav>
      </header>

      {tiene(a, "ventas:escribir") && (
        <NuevaOportunidad personas={personas.map((p) => ({ id: p.id, nombre: p.nombre, empresa: p.empresa }))} personaInicial={personaInicial}
          fechaInicial={paraInputFecha(new Date(ahora.getTime() + 2 * 864e5))} precio={tiene(a, "precio:fijar")} abierta={sp.nueva === "1" || !!personaInicial} />
      )}

      {cerradas ? (
        <div className="grid gap-8 lg:grid-cols-3">
          {ETAPAS_CERRADAS.map((e) => {
            const ops = fin.filter((o) => o.etapa === e);
            return (
              <section key={e} className="flex flex-col gap-2">
                <h2 className="px-1 text-[14.5px] font-bold">{NOMBRE_ETAPA[e]} <span className="cifra font-normal text-[#5F6B64]">{ops.length}</span></h2>
                {ops.length ? <div className="bloque divide-y divide-[var(--linea-tinta)]">{ops.map((o) => <FilaOportunidad key={o.id} o={o} conEtapa={false} ahora={ahora} />)}</div> : <Vacio>Ninguna.</Vacio>}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
          <div className="flex flex-col gap-6 md:flex-row md:gap-4">
            {ETAPAS_ABIERTAS.map((e) => <ColumnaEtapa key={e} etapa={e} ops={abiertas.filter((o) => o.etapa === e)} ahora={ahora} />)}
          </div>
        </div>
      )}
    </div>
  );
}
