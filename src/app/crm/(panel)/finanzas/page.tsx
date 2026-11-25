import type { Metadata } from "next";
import Link from "next/link";
import { resumen } from "@/lib/crm/finanzas";
import { plata } from "@/lib/crm/formato";
import { actorDePagina, tiene } from "@/lib/crm/pagina";
import { Cuerpo } from "../cuerpo";
import { Seccion } from "../seccion";
import { SinPermiso } from "../sin-permiso";
import { Vacio } from "../vacio";
import { BarraFinanzas } from "./barra-finanzas";
import { CifraResumen } from "./cifra-resumen";
import { mesActual, mesValido } from "./fechas";
import { MetaIngreso } from "./meta-ingreso";
import { SelectorMes } from "./selector-mes";
import { TablaMargen } from "./tabla-margen";

export const metadata: Metadata = { title: "Finanzas" };

type Props = { searchParams: Promise<{ mes?: string | string[] }> };

/** El mes en cifras: MRR, ingreso contra la meta, por cobrar, mora, gastos y el margen de cada cliente. */
export default async function FinanzasResumen({ searchParams }: Props) {
  const a = await actorDePagina();
  const alta = tiene(a, "cobros:crear");
  if (!tiene(a, "finanzas:leer")) return <><BarraFinanzas activo="resumen" alta={alta} /><Cuerpo><SinPermiso que="las finanzas" /></Cuerpo></>;
  const sp = await searchParams;
  const pedido = typeof sp.mes === "string" && sp.mes ? sp.mes : null;
  const mes = pedido ?? mesActual();
  if (!mesValido(mes)) {
    return (
      <>
        <BarraFinanzas activo="resumen" alta={alta} />
        <Cuerpo>
          <Vacio>«{mes}» no es un mes: se escribe AAAA-MM, por ejemplo {mesActual()}. <Link href="/crm/finanzas" className="font-semibold">Ver el mes actual</Link></Vacio>
        </Cuerpo>
      </>
    );
  }
  const r = await resumen(a, { mes });
  const eur = r.ingreso_mes_eur > 0 ? ` · ${plata(r.ingreso_mes_eur, "EUR")}` : "";

  return (
    <>
      <BarraFinanzas activo="resumen" alta={alta} />
      <Cuerpo>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SelectorMes mes={mes} base="/crm/finanzas" />
          <a href={`/api/crm/v1/finanzas/exportar?mes=${mes}`} className="boton-secundario">Exportar CSV</a>
        </div>

        {!r.mrr_completo && (
          <p role="status" className="panel !bg-[var(--aviso-fondo)] px-4 py-3 text-[13.5px] text-[var(--aviso)]">
            Falta la tasa de cambio de hoy: el MRR solo suma las suscripciones en pesos, así que está incompleto.
          </p>
        )}

        <div className="flex flex-wrap gap-4">
          <CifraResumen titulo="MRR (ingreso mensual recurrente)" valor={plata(r.mrr_cop)} nota={`${r.suscripciones_activas} ${r.suscripciones_activas === 1 ? "suscripción activa" : "suscripciones activas"}`} />
          <CifraResumen titulo="Ingreso del mes" valor={plata(r.ingreso_mes_cop)} nota={`${r.cobros_pagados_mes} ${r.cobros_pagados_mes === 1 ? "cobro pagado" : "cobros pagados"}${eur}`} />
          <CifraResumen titulo="Por cobrar" valor={plata(r.por_cobrar_cop)} nota={<Link href="/crm/finanzas/cobros" className="font-semibold">Ver pendientes</Link>} />
          <CifraResumen titulo="En mora" valor={plata(r.mora.total_cop)} alerta={r.mora.cobros > 0}
            nota={<>{r.mora.cobros} {r.mora.cobros === 1 ? "cobro vencido" : "cobros vencidos"} · <Link href="/crm/finanzas/cobros?vista=mora" className="font-semibold">Ver en mora</Link></>} />
          <CifraResumen titulo="Gastos del mes" valor={plata(r.gastos_mes_cop)} nota={<Link href={`/crm/finanzas/gastos?mes=${mes}`} className="font-semibold">Ver gastos</Link>} />
          <CifraResumen titulo="Resultado del mes" valor={plata(r.resultado_mes_cop)} alerta={r.resultado_mes_cop < 0} nota="Ingreso menos gastos" />
        </div>

        <section className="panel px-[18px] py-4" aria-label="Meta de ingreso">
          <MetaIngreso ingreso={r.ingreso_mes_cop} meta={r.meta.ingreso_mes_cop} avance={r.meta.avance} mesesRestantes={r.meta.meses_restantes} mesMeta={r.meta.mes} />
        </section>

        <Seccion titulo="Margen por cliente" cuenta={r.margen.length}>
          <TablaMargen filas={r.margen} />
        </Seccion>
      </Cuerpo>
    </>
  );
}
