import type { Metadata } from "next";
import Link from "next/link";
import { limitesMes } from "@/lib/crm/finanzas";
import { plata } from "@/lib/crm/formato";
import { listarGastos } from "@/lib/crm/gastos";
import { actorDePagina, tiene } from "@/lib/crm/pagina";
import { Cuerpo } from "../../cuerpo";
import { SinPermiso } from "../../sin-permiso";
import { Vacio } from "../../vacio";
import { BarraFinanzas } from "../barra-finanzas";
import { empresasDeSuscripciones } from "../empresas-de-suscripciones";
import { fechaDia, mesActual, mesValido } from "../fechas";
import { SelectorMes } from "../selector-mes";
import { BorrarGasto } from "./borrar-gasto";
import { NuevoGasto } from "./nuevo-gasto";

export const metadata: Metadata = { title: "Gastos · Finanzas" };

type Props = { searchParams: Promise<{ mes?: string | string[] }> };

/** Los gastos de un mes (`?mes=AAAA-MM`) con su valor en pesos a la tasa de su día. */
export default async function GastosPagina({ searchParams }: Props) {
  const a = await actorDePagina();
  const alta = tiene(a, "cobros:crear");
  if (!tiene(a, "finanzas:leer")) return <><BarraFinanzas activo="gastos" alta={alta} /><Cuerpo><SinPermiso que="los gastos" /></Cuerpo></>;
  const sp = await searchParams;
  const pedido = typeof sp.mes === "string" && sp.mes ? sp.mes : null;
  const mes = pedido ?? mesActual();
  if (!mesValido(mes)) {
    return (
      <>
        <BarraFinanzas activo="gastos" alta={alta} />
        <Cuerpo>
          <Vacio>«{mes}» no es un mes: se escribe AAAA-MM, por ejemplo {mesActual()}. <Link href="/crm/finanzas/gastos" className="font-semibold">Ver el mes actual</Link></Vacio>
        </Cuerpo>
      </>
    );
  }
  const escribir = tiene(a, "finanzas:escribir");
  const l = limitesMes(mes);
  const gastos = await listarGastos(a, { desde: l.primerDia, hasta: l.ultimoDia });
  const empresas = escribir ? await empresasDeSuscripciones(a) : [];
  const total = gastos.reduce((s, g) => s + g.valor_cop, 0);

  return (
    <>
      <BarraFinanzas activo="gastos" alta={alta} subtitulo={gastos.length ? `${gastos.length} ${gastos.length === 1 ? "gasto" : "gastos"} · ${plata(total)}` : undefined} />
      <Cuerpo>
        <SelectorMes mes={mes} base="/crm/finanzas/gastos" />
        {escribir && <NuevoGasto empresas={empresas} />}
        {gastos.length ? (
          <div className="bloque">
            <div className="overflow-x-auto">
              <table className="tabla">
                <thead>
                  <tr>
                    <th scope="col">Fecha</th>
                    <th scope="col">Proveedor</th>
                    <th scope="col">Concepto</th>
                    <th scope="col">Cliente</th>
                    <th scope="col" className="der">Valor</th>
                    <th scope="col" className="der">En pesos</th>
                    {escribir && <th scope="col"><span className="oculto">Acciones</span></th>}
                  </tr>
                </thead>
                <tbody>
                  {gastos.map((g) => (
                    <tr key={g.id}>
                      <td className="num">{fechaDia(g.fecha)}</td>
                      <td className="fuerte">{g.proveedor}</td>
                      <td>{g.concepto}</td>
                      <td>{g.empresa ?? "—"}</td>
                      <td className="der num fuerte">{plata(g.valor, g.moneda)}</td>
                      <td className="der num">{plata(g.valor_cop)}</td>
                      {escribir && <td><BorrarGasto id={g.id} /></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : <Vacio>No hay gastos registrados en este mes.</Vacio>}
      </Cuerpo>
    </>
  );
}
