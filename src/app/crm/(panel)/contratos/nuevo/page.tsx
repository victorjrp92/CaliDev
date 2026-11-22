import type { Metadata } from "next";
import { EJEMPLO_SERVINOMIC } from "@/lib/contratos/plantilla-servinomic";
import { borradorDesdeOportunidad, cuotasPara, fechasPara, hoyColombia } from "@/lib/crm/contratos";
import { ErrorCrm } from "@/lib/crm/actor";
import { actorDePagina, tiene } from "@/lib/crm/pagina";
import { BarraSeccion } from "../../barra-seccion";
import { Cuerpo } from "../../cuerpo";
import { SinPermiso } from "../../sin-permiso";
import { Vacio } from "../../vacio";
import { FormularioContrato, type Vinculo } from "./formulario-contrato";

export const metadata: Metadata = { title: "Nuevo contrato" };

export default async function NuevoContratoPagina({ searchParams }: { searchParams: Promise<{ oportunidad?: string }> }) {
  const a = await actorDePagina();
  const op = Number((await searchParams).oportunidad);
  const volver = Number.isInteger(op) && op > 0 ? { href: `/crm/ventas/${op}`, etiqueta: "Oportunidad" } : { href: "/crm/contratos", etiqueta: "Contratos" };
  if (!tiene(a, "contratos:escribir")) return <><BarraSeccion titulo="Nuevo contrato" volver={volver} /><Cuerpo><SinPermiso que="crear contratos" /></Cuerpo></>;

  if (Number.isInteger(op) && op > 0) {
    const b = await borradorDesdeOportunidad(a, op).catch((e: unknown) => (e instanceof ErrorCrm ? e.message : "No se pudo armar el contrato desde esa oportunidad."));
    if (typeof b === "string") return <><BarraSeccion titulo="Nuevo contrato" volver={volver} /><Cuerpo><Vacio>{b}</Vacio></Cuerpo></>;
    const vinculo: Vinculo = { oportunidad_id: b.oportunidad_id, persona_id: b.persona_id, empresa_id: b.empresa_id };
    return (
      <>
        <BarraSeccion titulo="Nuevo contrato" volver={volver} subtitulo={`ServiNomic · lleno desde «${b.oportunidad}». Revisa y ajusta lo que cambie.`} />
        <Cuerpo><FormularioContrato inicial={b.datos} vinculo={vinculo} /></Cuerpo>
      </>
    );
  }

  const hoy = hoyColombia();
  const inicial = { ...EJEMPLO_SERVINOMIC, nombre: "", negocio: "", fecha: hoy, ...cuotasPara(EJEMPLO_SERVINOMIC.arranque, hoy), ...fechasPara(hoy, EJEMPLO_SERVINOMIC.permanenciaMeses) };
  return (
    <>
      <BarraSeccion titulo="Nuevo contrato" volver={volver} subtitulo="ServiNomic · precios de la lista. Para llenarlo con un cliente, créalo desde su oportunidad." />
      <Cuerpo><FormularioContrato inicial={inicial} vinculo={{ oportunidad_id: null, persona_id: null, empresa_id: null }} /></Cuerpo>
    </>
  );
}
