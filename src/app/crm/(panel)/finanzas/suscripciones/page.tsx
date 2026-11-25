import type { Metadata } from "next";
import { plata } from "@/lib/crm/formato";
import { actorDePagina, tiene } from "@/lib/crm/pagina";
import { listarSuscripciones } from "@/lib/crm/suscripciones";
import { Cuerpo } from "../../cuerpo";
import { SinPermiso } from "../../sin-permiso";
import { Vacio } from "../../vacio";
import { BarraFinanzas } from "../barra-finanzas";
import { ChipsFiltro } from "../chips-filtro";
import { fechaDia } from "../fechas";
import { AccionesSuscripcion } from "./acciones-suscripcion";

export const metadata: Metadata = { title: "Suscripciones · Finanzas" };

type Props = { searchParams: Promise<{ estado?: string }> };

const FILTROS = [
  { estado: "activa", etiqueta: "Activas", href: "/crm/finanzas/suscripciones" },
  { estado: "pausada", etiqueta: "Pausadas", href: "/crm/finanzas/suscripciones?estado=pausada" },
  { estado: "cancelada", etiqueta: "Canceladas", href: "/crm/finanzas/suscripciones?estado=cancelada" },
  { estado: "todas", etiqueta: "Todas", href: "/crm/finanzas/suscripciones?estado=todas" },
] as const;

const PILL = { activa: "pill-ok", pausada: "pill-aviso", cancelada: "pill-neutro" } as const;
const NOMBRE = { activa: "Activa", pausada: "Pausada", cancelada: "Cancelada" } as const;

/** El precio pactado con cada cliente: quién paga cuánto al mes y desde cuándo. Aquí se pausa, reactiva o cancela. */
export default async function SuscripcionesPagina({ searchParams }: Props) {
  const a = await actorDePagina();
  const alta = tiene(a, "cobros:crear");
  if (!tiene(a, "finanzas:leer")) return <><BarraFinanzas activo="suscripciones" alta={alta} /><Cuerpo><SinPermiso que="las suscripciones" /></Cuerpo></>;
  const sp = await searchParams;
  const filtro = FILTROS.find((f) => f.estado === sp.estado) ?? FILTROS[0];
  const escribir = tiene(a, "finanzas:escribir");
  const subs = await listarSuscripciones(a, { estado: filtro.estado });

  return (
    <>
      <BarraFinanzas activo="suscripciones" alta={alta} subtitulo={subs.length ? `${subs.length} ${subs.length === 1 ? "suscripción" : "suscripciones"}` : undefined} />
      <Cuerpo>
        <ChipsFiltro etiqueta="Filtrar suscripciones" opciones={FILTROS.map((f) => ({ href: f.href, etiqueta: f.etiqueta, activo: f.estado === filtro.estado }))} />
        {subs.length ? (
          <div className="bloque">
            <div className="overflow-x-auto">
              <table className="tabla">
                <thead>
                  <tr>
                    <th scope="col">Empresa</th>
                    <th scope="col">Producto</th>
                    <th scope="col" className="der">Mensual</th>
                    <th scope="col">Moneda</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Desde</th>
                    {escribir && <th scope="col">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {subs.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <span className="fuerte">{s.empresa}</span>
                        {s.persona && <span className="nota block">{s.persona}</span>}
                      </td>
                      <td>{s.producto}</td>
                      <td className="der num fuerte">{plata(s.valor_mensual, s.moneda)}</td>
                      <td>{s.moneda}</td>
                      <td><span className={`pill ${PILL[s.estado]}`}>{NOMBRE[s.estado]}</span></td>
                      <td className="num">{fechaDia(s.inicio)}</td>
                      {escribir && <td><AccionesSuscripcion id={s.id} estado={s.estado} /></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : <Vacio>{filtro.estado === "todas" ? "Todavía no hay suscripciones. Se crean con el alta de un cliente." : `No hay suscripciones ${filtro.etiqueta.toLowerCase()}.`}</Vacio>}
      </Cuerpo>
    </>
  );
}
