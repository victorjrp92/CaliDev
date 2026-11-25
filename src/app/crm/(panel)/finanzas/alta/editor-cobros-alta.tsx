import { plata } from "@/lib/crm/formato";
import { CONCEPTOS, NOMBRE_CONCEPTO } from "../constantes";

export type CobroEditable = { valor: string; vence: string; concepto: string };

/** Los cobros acordados con el cliente: valor, fecha y concepto de cada uno, con la suma a la vista. */
export function EditorCobrosAlta({ cobros, moneda, cambiar }: { cobros: CobroEditable[]; moneda: string; cambiar: (c: CobroEditable[]) => void }) {
  const suma = cobros.reduce((s, c) => s + (Number(c.valor.replace(",", ".")) || 0), 0);
  const pon = (i: number, c: Partial<CobroEditable>) => cambiar(cobros.map((x, j) => (j === i ? { ...x, ...c } : x)));
  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <span className="text-[13px] font-medium text-[var(--texto-2)]">Cobros acordados</span>
      {cobros.map((c, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <input aria-label={`Valor del cobro ${i + 1}`} className="campo num w-36" inputMode="decimal" placeholder="Valor" value={c.valor} onChange={(e) => pon(i, { valor: e.target.value })} />
          <input aria-label={`Vence el cobro ${i + 1}`} type="date" className="campo w-44" value={c.vence} onChange={(e) => pon(i, { vence: e.target.value })} />
          <select aria-label={`Concepto del cobro ${i + 1}`} className="campo w-40" value={c.concepto} onChange={(e) => pon(i, { concepto: e.target.value })}>
            {CONCEPTOS.map((x) => <option key={x} value={x}>{NOMBRE_CONCEPTO[x]}</option>)}
          </select>
          <button type="button" className="boton-chico" data-tono="no" onClick={() => cambiar(cobros.filter((_, j) => j !== i))}>Quitar</button>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="boton-chico" onClick={() => cambiar([...cobros, { valor: "", vence: "", concepto: "cuota" }])}>Agregar cobro</button>
        <span className="num text-[13px] text-[var(--texto-2)]">{cobros.length ? `Suman ${plata(suma, moneda)}` : "Sin cobros: solo se crea la suscripción."}</span>
      </div>
    </div>
  );
}
