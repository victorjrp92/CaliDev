import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listarAuditoria } from "@/lib/crm/auditoria";
import { listarContratos } from "@/lib/crm/contratos";
import { NOMBRE_ETAPA, type Etapa } from "@/lib/crm/etapas";
import { cuando, fecha, fechaHora, paraInputFecha, plata } from "@/lib/crm/formato";
import { notasDe } from "@/lib/crm/notas";
import { historialDe, oportunidadPorId } from "@/lib/crm/oportunidades";
import { actorDePagina, tiene } from "@/lib/crm/pagina";
import { listarUsuarios } from "@/lib/crm/usuarios";
import { Registro } from "../../auditoria/registro";
import { BarraSeccion } from "../../barra-seccion";
import { EstadoContrato } from "../../contratos/estado-contrato";
import { Cuerpo } from "../../cuerpo";
import { EtiquetaEtapa } from "../../etiqueta-etapa";
import { FilaEnlace } from "../../fila-enlace";
import { ListaNotas } from "../../notas/lista-notas";
import { Seccion } from "../../seccion";
import { SinPermiso } from "../../sin-permiso";
import { EditarOportunidad } from "./editar-oportunidad";
import { MoverEtapa } from "./mover-etapa";

export const metadata: Metadata = { title: "Oportunidad" };

export default async function OportunidadPagina({ params }: { params: Promise<{ id: string }> }) {
  const a = await actorDePagina();
  if (!tiene(a, "ventas:leer")) return <><BarraSeccion titulo="Oportunidad" volver={{ href: "/crm/ventas", etiqueta: "Ventas" }} /><Cuerpo><SinPermiso que="las ventas" /></Cuerpo></>;
  const id = Number((await params).id);
  const o = Number.isInteger(id) && id > 0 ? await oportunidadPorId(id) : null;
  if (!o) notFound();
  const [historial, notas, auditoria, usuarios, contratos] = await Promise.all([
    historialDe(id),
    tiene(a, "notas:leer") ? notasDe("oportunidad", id) : Promise.resolve(null),
    tiene(a, "auditoria:leer") ? listarAuditoria({ entidad: "oportunidad", id: String(id), limite: 100 }) : Promise.resolve(null),
    listarUsuarios(),
    tiene(a, "contratos:leer") ? listarContratos(a, { oportunidadId: id }) : Promise.resolve(null),
  ]);
  const escribir = tiene(a, "ventas:escribir");
  const c = cuando(o.proximo_paso_at);
  const datos: [string, React.ReactNode][] = [
    ["Persona", o.persona_id ? <Link href={`/crm/contactos/${o.persona_id}`} className="font-medium text-[var(--acento-texto)] underline-offset-4 hover:underline">{o.persona}</Link> : "—"],
    ["Empresa", o.empresa ?? "—"],
    ["Arranque", plata(o.valor_arranque, o.moneda)],
    ["Mensualidad", o.valor_mensual ? `${plata(o.valor_mensual, o.moneda)}/mes` : "—"],
    ["Responsable", o.responsable ?? "—"],
    ["Origen", o.origen ?? "—"],
  ];

  return (
    <>
      <BarraSeccion
        volver={{ href: "/crm/ventas", etiqueta: "Ventas" }}
        titulo={<span className="inline-flex flex-wrap items-center gap-3">{o.titulo} <EtiquetaEtapa etapa={o.etapa} /></span>}
        subtitulo={o.proximo_paso ? (
          <span><span className={c.vencido ? "font-semibold text-[var(--peligro)]" : "font-semibold text-[var(--texto)]"}>{c.vencido ? "Vencido · " : ""}{c.texto}, {fecha(o.proximo_paso_at)}:</span> {o.proximo_paso}</span>
        ) : o.motivo_perdida ? `Motivo de pérdida: ${o.motivo_perdida}` : undefined}
      />
      <Cuerpo>
      <dl className="bloque grid grid-cols-2 gap-x-6 gap-y-4 px-[18px] py-4 sm:grid-cols-3">
        {datos.map(([k, v]) => (
          <div key={k} className="flex min-w-0 flex-col gap-0.5"><dt className="nota">{k}</dt><dd className="cifra truncate text-[15px]">{v}</dd></div>
        ))}
      </dl>
      {o.proximo_paso && o.motivo_perdida && <p className="text-[15px]">Motivo de pérdida: {o.motivo_perdida}</p>}

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-8">
          {escribir && (
            <Seccion titulo="Etapa y próximo paso">
              <div className="bloque px-[18px] py-4">
                <MoverEtapa id={o.id} etapa={o.etapa as Etapa} paso={o.proximo_paso} fecha={paraInputFecha(o.proximo_paso_at)} puedeGanar={tiene(a, "oportunidad:ganar")} />
              </div>
            </Seccion>
          )}
          {contratos && (contratos.length > 0 || tiene(a, "contratos:escribir")) && (
            <Seccion titulo="Contratos" cuenta={contratos.length || null}
              accion={tiene(a, "contratos:escribir") && o.moneda === "COP" ? <Link href={`/crm/contratos/nuevo?oportunidad=${o.id}`} className="boton-chico">Crear contrato</Link> : undefined}>
              {contratos.length ? (
                <div className="bloque flex flex-col divide-y divide-[var(--linea)]">
                  {contratos.map((k) => <FilaEnlace key={k.id} href={`/crm/contratos/${k.id}`} titulo={<span className="inline-flex flex-wrap items-center gap-2">{k.titulo} <EstadoContrato c={k} /></span>} detalle={`Creado ${fecha(k.created_at)}`} />)}
                </div>
              ) : <p className="nota px-1">{o.moneda === "COP" ? "Aún sin contrato. Se llena con la persona, la empresa y el precio de esta oportunidad." : "La plantilla de ServiNomic es en pesos; esta oportunidad está en otra moneda."}</p>}
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
                <summary className="cursor-pointer select-none font-semibold text-[var(--acento-texto)]">Editar título, responsable{tiene(a, "precio:fijar") ? " y precio" : ""}</summary>
                <div className="mt-4">
                  <EditarOportunidad id={o.id} precio={tiene(a, "precio:fijar")}
                    usuarios={usuarios.filter((u) => u.tipo === "humano" && u.activo).map((u) => ({ id: u.id, nombre: u.nombre }))}
                    inicial={{ titulo: o.titulo, valor_arranque: o.valor_arranque ? String(Number(o.valor_arranque)) : "", valor_mensual: o.valor_mensual ? String(Number(o.valor_mensual)) : "", moneda: o.moneda, responsable_id: o.responsable_id ? String(o.responsable_id) : "" }} />
                </div>
              </details>
            </Seccion>
          )}
          <Seccion titulo="Historial de etapas" cuenta={historial.length}>
            <ol className="bloque flex flex-col divide-y divide-[var(--linea)]">
              {historial.map((h, i) => (
                <li key={i} className="px-4 py-2.5 text-[14px]">
                  <span className="font-medium">{h.de ? `${NOMBRE_ETAPA[h.de as Etapa] ?? h.de} → ` : "Nace en "}{NOMBRE_ETAPA[h.a as Etapa] ?? h.a}</span>
                  <span className="nota block">{fechaHora(h.at)} · {h.usuario ?? "sistema"}</span>
                </li>
              ))}
            </ol>
          </Seccion>
          {auditoria && <Registro filas={auditoria} />}
        </div>
      </div>
      </Cuerpo>
    </>
  );
}
