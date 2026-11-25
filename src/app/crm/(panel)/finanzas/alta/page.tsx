import type { Metadata } from "next";
import { listarProductos, listarPromos } from "@/lib/crm/catalogo";
import { actorDePagina, tiene } from "@/lib/crm/pagina";
import { BarraSeccion } from "../../barra-seccion";
import { Cuerpo } from "../../cuerpo";
import { SinPermiso } from "../../sin-permiso";
import { Vacio } from "../../vacio";
import { FormularioAlta } from "./formulario-alta";

export const metadata: Metadata = { title: "Alta de cliente" };

/** Empresa, contacto, suscripción y cobros de un cliente nuevo en un solo formulario. */
export default async function AltaClientePagina() {
  const a = await actorDePagina();
  const volver = { href: "/crm/finanzas", etiqueta: "Finanzas" };
  if (!tiene(a, "cobros:crear") || !tiene(a, "finanzas:escribir")) {
    return <><BarraSeccion titulo="Alta de cliente" volver={volver} /><Cuerpo><SinPermiso que="el alta de clientes" /></Cuerpo></>;
  }
  const productos = (await listarProductos(a)).filter((p) => p.activo);
  const promos = await listarPromos(a, { vigentes: true });
  const inicial = productos.find((p) => p.nombre === "ServiNomic") ?? productos[0] ?? null;

  return (
    <>
      <BarraSeccion titulo="Alta de cliente" volver={volver} subtitulo="Crea la empresa, el contacto, la suscripción y sus cobros de una vez. Lo que dejes vacío toma el precio publicado." />
      <Cuerpo>
        {productos.length ? <FormularioAlta productos={productos} promos={promos} productoInicial={inicial?.id ?? null} /> : <Vacio>No hay productos activos. Crea uno en Productos antes de dar de alta un cliente.</Vacio>}
      </Cuerpo>
    </>
  );
}
