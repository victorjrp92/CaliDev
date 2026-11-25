import type { Metadata } from "next";
import { listarCobros } from "@/lib/crm/cobros";
import { plata } from "@/lib/crm/formato";
import { actorDePagina, tiene } from "@/lib/crm/pagina";
import { Cuerpo } from "../../cuerpo";
import { SinPermiso } from "../../sin-permiso";
import { Vacio } from "../../vacio";
import { BarraFinanzas } from "../barra-finanzas";
import { ChipsFiltro } from "../chips-filtro";
import { empresasDeSuscripciones } from "../empresas-de-suscripciones";
import { FilaCobro } from "./fila-cobro";
import { NuevoCobro } from "./nuevo-cobro";

export const metadata: Metadata = { title: "Cobros · Finanzas" };

type Props = { searchParams: Promise<{ vista?: string; nuevo?: string }> };

const VACIOS = { pendientes: "No hay cobros pendientes.", mora: "Ningún cobro en mora.", pagados: "Todavía no hay cobros pagados." } as const;

/** Lo que los clientes deben (pendientes y en mora) y lo que ya pagaron. Aquí se registra el pago o se anula. */
export default async function CobrosPagina({ searchParams }: Props) {
  const a = await actorDePagina();
  const alta = tiene(a, "cobros:crear");
  if (!tiene(a, "finanzas:leer")) return <><BarraFinanzas activo="cobros" alta={alta} /><Cuerpo><SinPermiso que="los cobros" /></Cuerpo></>;
  const sp = await searchParams;
  const vista = sp.vista === "mora" || sp.vista === "pagados" ? sp.vista : "pendientes";
  const escribir = tiene(a, "finanzas:escribir");
  const cobros = vista === "pagados"
    ? (await listarCobros(a, { estado: "pagado", limite: 200 })).sort((x, y) => Date.parse(y.pagado_at ?? "") - Date.parse(x.pagado_at ?? ""))
    : vista === "mora" ? await listarCobros(a, { mora: true }) : await listarCobros(a, { estado: "pendiente" });
  const empresas = alta ? await empresasDeSuscripciones(a) : [];
  const conAcciones = escribir && vista !== "pagados";
  const total = cobros.reduce((s, c) => s + c.valor_cop, 0);

  return (
    <>
      <BarraFinanzas activo="cobros" alta={alta} subtitulo={cobros.length ? `${cobros.length} ${cobros.length === 1 ? "cobro" : "cobros"} · ${plata(total)}` : undefined} />
      <Cuerpo>
        {alta && <NuevoCobro empresas={empresas} abierto={sp.nuevo === "1"} />}
        <ChipsFiltro etiqueta="Filtrar cobros" opciones={[
          { href: "/crm/finanzas/cobros", etiqueta: "Pendientes", activo: vista === "pendientes" },
          { href: "/crm/finanzas/cobros?vista=mora", etiqueta: "En mora", activo: vista === "mora" },
          { href: "/crm/finanzas/cobros?vista=pagados", etiqueta: "Pagados", activo: vista === "pagados" },
        ]} />
        {cobros.length ? (
          <div className="bloque">
            <div className="overflow-x-auto">
              <table className="tabla">
                <thead>
                  <tr>
                    <th scope="col">Empresa</th>
                    <th scope="col">Concepto</th>
                    <th scope="col" className="der">Valor</th>
                    <th scope="col" className="der">En pesos</th>
                    <th scope="col">Vence</th>
                    <th scope="col">Estado</th>
                    {conAcciones && <th scope="col">Acciones</th>}
                  </tr>
                </thead>
                <tbody>{cobros.map((c) => <FilaCobro key={c.id} c={c} conAcciones={conAcciones} />)}</tbody>
              </table>
            </div>
          </div>
        ) : <Vacio>{VACIOS[vista]}</Vacio>}
      </Cuerpo>
    </>
  );
}
