import type { Producto } from "@/lib/crm/catalogo";
import { fecha, plata } from "@/lib/crm/formato";
import { ActivarProducto } from "./activar-producto";
import { CONCEPTOS_PRECIO, NOMBRE_PRECIO } from "./conceptos-precio";
import { FijarPrecio } from "./fijar-precio";

/** Un producto con su precio vigente por concepto; con los permisos, también se le fija precio o se desactiva. */
export function TarjetaProducto({ p, fijar, escribir }: { p: Producto; fijar: boolean; escribir: boolean }) {
  return (
    <article className="bloque" aria-label={p.nombre}>
      <div className="flex items-start justify-between gap-3 px-4 py-3.5">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="fuerte flex flex-wrap items-center gap-2">{p.nombre}{!p.activo && <span className="chip">Inactivo</span>}</h3>
          {p.descripcion && <p className="nota break-words">{p.descripcion}</p>}
        </div>
        {escribir && <ActivarProducto id={p.id} activo={p.activo} />}
      </div>
      <dl>
        {CONCEPTOS_PRECIO.map((c) => {
          const v = p.precios.find((x) => x.concepto === c && x.vigente_hasta === null);
          return (
            <div key={c} className="fila !items-baseline justify-between">
              <dt className="min-w-0">
                <span>{NOMBRE_PRECIO[c]}</span>
                {v?.incluye && <span className="nota block">{v.incluye}</span>}
              </dt>
              <dd className="m-0 text-right">
                {v ? (
                  <>
                    <span className="fuerte num">{plata(v.valor, v.moneda)}</span>
                    <span className="nota block">{v.moneda} · desde {fecha(v.vigente_desde)}</span>
                  </>
                ) : <span className="nota">Sin precio</span>}
              </dd>
            </div>
          );
        })}
      </dl>
      {fijar && <FijarPrecio productoId={p.id} />}
    </article>
  );
}
