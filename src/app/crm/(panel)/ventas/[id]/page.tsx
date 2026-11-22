import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listarAuditoria } from "@/lib/crm/auditoria";
import { NOMBRE_ETAPA, type Etapa } from "@/lib/crm/etapas";
import { cuando, fecha, fechaHora, paraInputFecha, plata } from "@/lib/crm/formato";
import { notasDe } from "@/lib/crm/notas";
import { historialDe, oportunidadPorId } from "@/lib/crm/oportunidades";
import { actorDePagina, tiene } from "@/lib/crm/pagina";
import { listarUsuarios } from "@/lib/crm/usuarios";
import { Registro } from "../../auditoria/registro";
import { EtiquetaEtapa } from "../../etiqueta-etapa";
import { ListaNotas } from "../../notas/lista-notas";
import { Seccion } from "../../seccion";
import { SinPermiso } from "../../sin-permiso";
import { EditarOportunidad } from "./editar-oportunidad";
import { MoverEtapa } from "./mover-etapa";

export const metadata: Metadata = { title: "Oportunidad" };

export default async function OportunidadPagina({ params }: { params: Promise<{ id: string }> }) {
  const a = await actorDePagina();
  if (!tiene(a, "ventas:leer")) return <SinPermiso que="las ventas" />;
  const id = Number((await params).id);
  const o = Number.isInteger(id) && id > 0 ? await oportunidadPorId(id) : null;
  if (!o) notFound();
  const [historial, notas, auditoria, usuarios] = await Promise.all([
    historialDe(id),
    tiene(a, "notas:leer") ? notasDe("oportunidad", id) : Promise.resolve(null),
    tiene(a, "auditoria:leer") ? listarAuditoria({ entidad: "oportunidad", id: String(id), limite: 100 }) : Promise.resolve(null),
    listarUsuarios(),
  ]);
  const escribir = tiene(a, "ventas:escribir");
  const c = cuando(o.proximo_paso_at);
  const datos: [string, React.ReactNode][] = [
    ["Persona", o.persona_id ? <Link href={`/crm/contactos/${o.persona_id}`} className="font-medium text-[var(--verde)] underline-offset-4 hover:underline">{o.persona}</Link> : "—"],
    ["Empresa", o.empresa ?? "—"],
    ["Arranque", plata(o.valor_arranque, o.moneda)],
    ["Mensualidad", o.valor_mensual ? `${plata(o.valor_mensual, o.moneda)}/mes` : "—"],
    ["Responsable", o.responsable ?? "—"],
    ["Origen", o.origen ?? "—"],
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <Link href="/crm/ventas" className="mono w-fit text-[var(--verde)]">← Ventas</Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[26px] font-extrabold leading-tight tracking-tight md:text-[32px]">{o.titulo}</h1>
          <EtiquetaEtapa etapa={o.etapa} />
        </div>
        {o.proximo_paso && (
          <p className="text-[15px]">
            <span className={c.vencido ? "font-semibold text-[#B42318]" : "font-semibold"}>{c.vencido ? "Vencido · " : ""}{c.texto}, {fecha(o.proximo_paso_at)}:</span> {o.proximo_paso}
          </p>
        )}
        {o.motivo_perdida && <p className="text-[15px]">Motivo de pérdida: {o.motivo_perdida}</p>}
      </header>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        {datos.map(([k, v]) => (
          <div key={k} className="flex min-w-0 flex-col gap-1"><dt className="mono text-[#5F6B64]">{k}</dt><dd className="cifra truncate text-[15px]">{v}</dd></div>
        ))}
      </dl>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-8">
          {escribir && (
            <Seccion titulo="Etapa y próximo paso">
              <div className="bloque px-4 py-4">
                <MoverEtapa id={o.id} etapa={o.etapa as Etapa} paso={o.proximo_paso} fecha={paraInputFecha(o.proximo_paso_at)} puedeGanar={tiene(a, "oportunidad:ganar")} />
              </div>
            </Seccion>
          )}
          <Seccion titulo="Notas" cuenta={notas?.length}>
            {notas === null ? <SinPermiso que="las notas" /> : <ListaNotas notas={notas} entidad="oportunidad" id={o.id} escribir={tiene(a, "notas:escribir")} />}
          </Seccion>
        </div>
        <div className="flex flex-col gap-8">
          {escribir && (
            <Seccion titulo="Datos">
              <details className="bloque px-4 py-3">
                <summary className="cursor-pointer select-none font-semibold text-[var(--verde)]">Editar título, responsable{tiene(a, "precio:fijar") ? " y precio" : ""}</summary>
                <div className="mt-4">
                  <EditarOportunidad id={o.id} precio={tiene(a, "precio:fijar")}
                    usuarios={usuarios.filter((u) => u.tipo === "humano" && u.activo).map((u) => ({ id: u.id, nombre: u.nombre }))}
                    inicial={{ titulo: o.titulo, valor_arranque: o.valor_arranque ? String(Number(o.valor_arranque)) : "", valor_mensual: o.valor_mensual ? String(Number(o.valor_mensual)) : "", moneda: o.moneda, responsable_id: o.responsable_id ? String(o.responsable_id) : "" }} />
                </div>
              </details>
            </Seccion>
          )}
          <Seccion titulo="Historial de etapas" cuenta={historial.length}>
            <ol className="flex flex-col gap-2 border-l-2 border-[var(--linea-tinta)] pl-4">
              {historial.map((h, i) => (
                <li key={i} className="text-[14px]">
                  <span className="font-medium">{h.de ? `${NOMBRE_ETAPA[h.de as Etapa] ?? h.de} → ` : "Nace en "}{NOMBRE_ETAPA[h.a as Etapa] ?? h.a}</span>
                  <span className="block text-[13px] text-[#5F6B64]">{fechaHora(h.at)} · {h.usuario ?? "sistema"}</span>
                </li>
              ))}
            </ol>
          </Seccion>
          {auditoria && <Registro filas={auditoria} />}
        </div>
      </div>
    </div>
  );
}
