import type { Cobro } from "@/lib/crm/cobros";
import { fecha, plata } from "@/lib/crm/formato";
import { NOMBRE_CONCEPTO } from "../constantes";
import { fechaDia } from "../fechas";
import { AccionesCobro } from "./acciones-cobro";
import { EstadoCobro } from "./estado-cobro";

/** Una fila de la tabla de cobros; las acciones solo salen en los pendientes y a quien puede escribir. */
export function FilaCobro({ c, conAcciones }: { c: Cobro; conAcciones: boolean }) {
  return (
    <tr>
      <td>
        <span className="fuerte">{c.empresa}</span>
        {c.persona && <span className="nota block">{c.persona}</span>}
      </td>
      <td>
        {NOMBRE_CONCEPTO[c.concepto]}
        {c.descripcion && <span className="nota block max-w-[220px] truncate" title={c.descripcion}>{c.descripcion}</span>}
      </td>
      <td className="der num fuerte">{plata(c.valor, c.moneda)}</td>
      <td className="der num">{plata(c.valor_cop)}</td>
      <td className="num">{fechaDia(c.vence_at)}</td>
      <td>
        <EstadoCobro c={c} />
        {c.estado === "pagado" && <span className="nota block">{fecha(c.pagado_at)}</span>}
        {c.estado === "pendiente" && c.enlace_pago && <a href={c.enlace_pago} className="nota block font-semibold" target="_blank" rel="noreferrer">Enlace de pago</a>}
        {c.estado === "anulado" && c.motivo_anulacion && <span className="nota block max-w-[200px] truncate" title={c.motivo_anulacion}>{c.motivo_anulacion}</span>}
      </td>
      {conAcciones && <td>{c.estado === "pendiente" && <AccionesCobro id={c.id} metodo={c.metodo} moneda={c.moneda} />}</td>}
    </tr>
  );
}
