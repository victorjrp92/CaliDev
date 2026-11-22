import type { Metadata } from "next";
import Link from "next/link";
import { listarAprobaciones } from "@/lib/crm/aprobaciones";
import { listarAuditoria } from "@/lib/crm/auditoria";
import { actorDePagina, tiene } from "@/lib/crm/pagina";
import { Registro } from "../auditoria/registro";
import { BarraSeccion } from "../barra-seccion";
import { Cuerpo } from "../cuerpo";
import { SinPermiso } from "../sin-permiso";
import { Vacio } from "../vacio";
import { TarjetaAprobacion } from "./tarjeta-aprobacion";

export const metadata: Metadata = { title: "Aprobaciones" };

const ESTADOS = ["ejecutada", "aprobada", "rechazada", "fallida", "todas"] as const;
const NOMBRE: Record<(typeof ESTADOS)[number], string> = {
  ejecutada: "Ejecutadas", aprobada: "Aprobadas", rechazada: "Rechazadas", fallida: "Fallidas", todas: "Todas",
};
const SUBTITULO = "Nada de lo que un agente quiere mandar hacia afuera sale sin tu visto bueno; lo que corrijas es lo que sale.";

type Props = { searchParams: Promise<{ vista?: string; estado?: string }> };

/**
 * La cola: todo lo que un agente quiere hacer hacia afuera (mandar un mensaje,
 * un contrato, un cobro) espera aquí a que Victor o Karen lo vean tal cual.
 */
export default async function AprobacionesPagina({ searchParams }: Props) {
  const a = await actorDePagina();
  if (!tiene(a, "aprobaciones:leer")) return <><BarraSeccion titulo="Aprobaciones" /><Cuerpo><SinPermiso que="las aprobaciones" /></Cuerpo></>;
  const sp = await searchParams;
  const auditoria = tiene(a, "auditoria:leer");
  const vista = sp.vista === "historial" || (sp.vista === "auditoria" && auditoria) ? sp.vista : "pendientes";
  const estado = ESTADOS.find((e) => e === sp.estado) ?? "todas";
  const decidir = tiene(a, "aprobaciones:decidir") && a.usuario.tipo === "humano";

  const [pendientes, historial, registro] = await Promise.all([
    listarAprobaciones("pendiente", 200),
    vista === "historial" ? listarAprobaciones(estado === "todas" ? null : estado, 200) : Promise.resolve([]),
    vista === "auditoria" ? listarAuditoria({ entidad: "aprobacion", limite: 100 }) : Promise.resolve([]),
  ]);
  const segmentos = [
    { href: "/crm/aprobaciones", etiqueta: "Pendientes", cuenta: pendientes.length, activo: vista === "pendientes" },
    { href: "/crm/aprobaciones?vista=historial", etiqueta: "Historial", activo: vista === "historial" },
    ...(auditoria ? [{ href: "/crm/aprobaciones?vista=auditoria", etiqueta: "Auditoría", activo: vista === "auditoria" }] : []),
  ];

  return (
    <>
      <BarraSeccion titulo="Aprobaciones" subtitulo={SUBTITULO} segmentos={segmentos} />
      <Cuerpo>
        {vista === "pendientes" && (pendientes.length
          ? <div className="flex flex-col gap-4">{pendientes.map((x) => <TarjetaAprobacion key={x.id} a={x} decidir={decidir} />)}</div>
          : <Vacio>Nada esperando tu decisión.</Vacio>)}

        {vista === "historial" && (
          <>
            <nav aria-label="Filtrar por estado" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
              {ESTADOS.map((e) => (
                <Link key={e} href={e === "todas" ? "/crm/aprobaciones?vista=historial" : `/crm/aprobaciones?vista=historial&estado=${e}`} aria-current={e === estado ? "page" : undefined}
                  className={`chip shrink-0 ${e === estado ? "!bg-[var(--acento)] !text-[var(--sobre-acento)]" : ""}`}>{NOMBRE[e]}</Link>
              ))}
            </nav>
            {historial.length
              ? <div className="flex flex-col gap-4">{historial.filter((x) => x.estado !== "pendiente").map((x) => <TarjetaAprobacion key={x.id} a={x} decidir={false} />)}</div>
              : <Vacio>{estado === "todas" ? "Todavía no hay decisiones." : `No hay aprobaciones ${NOMBRE[estado].toLowerCase()}.`}</Vacio>}
          </>
        )}

        {vista === "auditoria" && <Registro filas={registro} plegado={false} />}
      </Cuerpo>
    </>
  );
}
