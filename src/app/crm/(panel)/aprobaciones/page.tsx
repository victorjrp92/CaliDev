import type { Metadata } from "next";
import Link from "next/link";
import { listarAprobaciones } from "@/lib/crm/aprobaciones";
import { listarAuditoria } from "@/lib/crm/auditoria";
import { actorDePagina, tiene } from "@/lib/crm/pagina";
import { Registro } from "../auditoria/registro";
import { SinPermiso } from "../sin-permiso";
import { Vacio } from "../vacio";
import { TarjetaAprobacion } from "./tarjeta-aprobacion";

export const metadata: Metadata = { title: "Aprobaciones" };

const ESTADOS = ["pendiente", "ejecutada", "aprobada", "rechazada", "fallida", "todas"] as const;
const NOMBRE: Record<(typeof ESTADOS)[number], string> = {
  pendiente: "Pendientes", ejecutada: "Ejecutadas", aprobada: "Aprobadas", rechazada: "Rechazadas", fallida: "Fallidas", todas: "Todas",
};

/**
 * La cola: todo lo que un agente quiere hacer hacia afuera (mandar un mensaje,
 * un contrato, un cobro) espera aquí a que Victor o Karen lo vean tal cual.
 */
export default async function AprobacionesPagina({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const a = await actorDePagina();
  if (!tiene(a, "aprobaciones:leer")) return <SinPermiso que="las aprobaciones" />;
  const pedido = (await searchParams).estado;
  const estado = ESTADOS.find((e) => e === pedido) ?? "pendiente";
  const [lista, registro] = await Promise.all([
    listarAprobaciones(estado === "todas" ? null : estado, 200),
    tiene(a, "auditoria:leer") ? listarAuditoria({ entidad: "aprobacion", limite: 50 }) : Promise.resolve(null),
  ]);
  const decidir = tiene(a, "aprobaciones:decidir") && a.usuario.tipo === "humano";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-[26px] font-extrabold tracking-tight md:text-[32px]">Aprobaciones</h1>
        <p className="max-w-prose text-[15px] text-[#46554D]">Lo que un agente quiere mandar hacia afuera. Nada sale sin que lo apruebes; lo que corrijas es lo que sale.</p>
      </header>
      <nav aria-label="Filtrar por estado" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {ESTADOS.map((e) => (
          <Link key={e} href={e === "pendiente" ? "/crm/aprobaciones" : `/crm/aprobaciones?estado=${e}`} aria-current={e === estado ? "page" : undefined}
            className={`chip shrink-0 ${e === estado ? "!bg-[var(--verde)] !text-[var(--hueso)]" : ""}`}>{NOMBRE[e]}</Link>
        ))}
      </nav>
      {lista.length ? (
        <div className="flex flex-col gap-4">{lista.map((x) => <TarjetaAprobacion key={x.id} a={x} decidir={decidir} />)}</div>
      ) : (
        <Vacio>{estado === "pendiente" ? "Nada esperando tu decisión." : `No hay aprobaciones ${NOMBRE[estado].toLowerCase()}.`}</Vacio>
      )}
      {registro && <Registro filas={registro} titulo="Registro de decisiones" />}
    </div>
  );
}
