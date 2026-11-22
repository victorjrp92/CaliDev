import type { Metadata } from "next";
import { listarContratos } from "@/lib/crm/contratos";
import { fecha } from "@/lib/crm/formato";
import { actorDePagina, tiene } from "@/lib/crm/pagina";
import { BarraSeccion } from "../barra-seccion";
import { Cuerpo } from "../cuerpo";
import { FilaEnlace } from "../fila-enlace";
import { SinPermiso } from "../sin-permiso";
import { Vacio } from "../vacio";
import { EstadoContrato } from "./estado-contrato";

export const metadata: Metadata = { title: "Contratos" };

type Props = { searchParams: Promise<{ vista?: string }> };

/** Los contratos y quién falta por firmar. Se crean desde la oportunidad. */
export default async function ContratosPagina({ searchParams }: Props) {
  const a = await actorDePagina();
  if (!tiene(a, "contratos:leer")) return <><BarraSeccion titulo="Contratos" /><Cuerpo><SinPermiso que="los contratos" /></Cuerpo></>;
  const sp = await searchParams;
  const vista = sp.vista === "firmados" || sp.vista === "todos" ? sp.vista : "esperando";
  const todos = await listarContratos(a);
  const esperando = todos.filter((c) => c.estado === "esperando");
  const firmados = todos.filter((c) => c.estado === "firmado");
  const lista = vista === "esperando" ? esperando : vista === "firmados" ? firmados : todos;
  const segmentos = [
    { href: "/crm/contratos", etiqueta: "Esperan firma", cuenta: esperando.length, activo: vista === "esperando" },
    { href: "/crm/contratos?vista=firmados", etiqueta: "Firmados", cuenta: firmados.length, activo: vista === "firmados" },
    { href: "/crm/contratos?vista=todos", etiqueta: "Todos", activo: vista === "todos" },
  ];

  return (
    <>
      <BarraSeccion titulo="Contratos" subtitulo="Se arman desde la oportunidad con su precio; el enlace de firma sale por correo."
        segmentos={segmentos} accion={tiene(a, "contratos:escribir") ? { href: "/crm/contratos/nuevo", etiqueta: "Nuevo contrato" } : undefined} />
      <Cuerpo>
        {lista.length ? (
          <div className="bloque flex flex-col divide-y divide-[var(--linea)]">
            {lista.map((c) => {
              const pendiente = c.firmantes.filter((f) => !f.firmado_at).map((f) => f.etiqueta);
              return (
                <FilaEnlace key={c.id} href={`/crm/contratos/${c.id}`}
                  titulo={<span className="inline-flex max-w-full items-center gap-2"><span className="truncate">{c.titulo}</span> <EstadoContrato c={c} /></span>}
                  detalle={[c.persona ?? c.empresa, `creado ${fecha(c.created_at)}`, pendiente.length ? `falta ${pendiente.join(" y ")}` : null].filter(Boolean).join(" · ")} />
              );
            })}
          </div>
        ) : (
          <Vacio>{vista === "esperando" ? "Ningún contrato esperando firma." : vista === "firmados" ? "Todavía no hay contratos firmados." : "Todavía no hay contratos. Se crean desde una oportunidad en Ventas."}</Vacio>
        )}
      </Cuerpo>
    </>
  );
}
