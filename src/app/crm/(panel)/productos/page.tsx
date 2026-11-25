import type { Metadata } from "next";
import { listarProductos, listarPromos } from "@/lib/crm/catalogo";
import { actorDePagina, tiene } from "@/lib/crm/pagina";
import { BarraSeccion } from "../barra-seccion";
import { Cuerpo } from "../cuerpo";
import { Seccion } from "../seccion";
import { SinPermiso } from "../sin-permiso";
import { Vacio } from "../vacio";
import { FilaPromo } from "./fila-promo";
import { NuevaPromo } from "./nueva-promo";
import { NuevoProducto } from "./nuevo-producto";
import { TarjetaProducto } from "./tarjeta-producto";

export const metadata: Metadata = { title: "Productos" };

/** El catálogo: cada producto con su precio vigente por concepto, y las promos que hoy valen. */
export default async function ProductosPagina() {
  const a = await actorDePagina();
  if (!tiene(a, "finanzas:leer")) return <><BarraSeccion titulo="Productos" /><Cuerpo><SinPermiso que="los productos" /></Cuerpo></>;
  const fijar = tiene(a, "precio:fijar");
  const escribir = tiene(a, "finanzas:escribir");
  const productos = await listarProductos(a, { todos: true });
  const promos = await listarPromos(a, { vigentes: true });
  const nombreDe = new Map(productos.map((p) => [p.id, p.nombre]));
  const activos = productos.filter((p) => p.activo);

  return (
    <>
      <BarraSeccion titulo="Productos" subtitulo="Lo que se vende y a qué precio. Un precio nuevo cierra el anterior y queda en el historial." />
      <Cuerpo>
        {escribir && <NuevoProducto />}
        {productos.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {productos.map((p) => <TarjetaProducto key={p.id} p={p} fijar={fijar} escribir={escribir} />)}
          </div>
        ) : <Vacio>Todavía no hay productos.</Vacio>}

        <Seccion titulo="Promos vigentes" cuenta={promos.length}>
          {fijar && <NuevaPromo productos={activos.map((p) => ({ id: p.id, nombre: p.nombre }))} />}
          {promos.length ? (
            <div className="bloque">{promos.map((p) => <FilaPromo key={p.id} p={p} producto={p.producto_id ? (nombreDe.get(p.producto_id) ?? "—") : "todos los productos"} />)}</div>
          ) : <Vacio>No hay promos vigentes.</Vacio>}
        </Seccion>
      </Cuerpo>
    </>
  );
}
