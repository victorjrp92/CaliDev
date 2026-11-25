import { plata } from "@/lib/crm/formato";
import type { MargenCliente } from "@/lib/crm/finanzas";
import { Vacio } from "../vacio";

/** Lo cobrado en el mes menos sus gastos, por cliente, con su MRR al lado. */
export function TablaMargen({ filas }: { filas: MargenCliente[] }) {
  if (!filas.length) return <Vacio>Todavía no hay clientes con suscripción, cobros o gastos este mes.</Vacio>;
  return (
    <div className="bloque">
      <div className="overflow-x-auto">
        <table className="tabla">
          <thead>
            <tr>
              <th scope="col">Cliente</th>
              <th scope="col" className="der">MRR</th>
              <th scope="col" className="der">Ingreso del mes</th>
              <th scope="col" className="der">Gastos</th>
              <th scope="col" className="der">Margen</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((m) => (
              <tr key={m.empresa_id}>
                <td className="fuerte">{m.empresa}</td>
                <td className="der num">{plata(m.mrr_cop)}</td>
                <td className="der num">{plata(m.ingreso_mes_cop)}</td>
                <td className="der num">{plata(m.gastos_mes_cop)}</td>
                <td className={`der num fuerte ${m.margen_cop < 0 ? "!text-[var(--peligro)]" : ""}`}>{plata(m.margen_cop)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
