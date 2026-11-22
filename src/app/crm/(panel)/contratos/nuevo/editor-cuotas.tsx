import { pesos, type DatosServinomic } from "@/lib/contratos/plantilla-servinomic";

type Cuota = DatosServinomic["cuotas"][number];

/** Las cuotas del arranque, con la suma a la vista: si no cuadra con el precio, sale en rojo. */
export function EditorCuotas({ cuotas, arranque, cambiar }: { cuotas: Cuota[]; arranque: number; cambiar: (c: Cuota[]) => void }) {
  const suma = cuotas.reduce((s, c) => s + c.valor, 0);
  const pon = (i: number, c: Partial<Cuota>) => cambiar(cuotas.map((x, j) => (j === i ? { ...x, ...c } : x)));
  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <span className="text-[13px] font-medium text-[var(--texto-2)]">Cuotas</span>
      {cuotas.map((c, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <input aria-label={`Cuándo se paga la cuota ${i + 1}`} className="campo min-w-0 flex-1 basis-[240px]" placeholder="Entre el 1 y el 5 de enero de 2027" value={c.cuando} onChange={(e) => pon(i, { cuando: e.target.value })} />
          <input aria-label={`Valor de la cuota ${i + 1}`} className="campo num w-36" inputMode="numeric" placeholder="Valor" value={c.valor ? String(c.valor) : ""} onChange={(e) => pon(i, { valor: Number(e.target.value.replace(/\D/g, "")) || 0 })} />
          <button type="button" className="boton-chico" data-tono="no" onClick={() => cambiar(cuotas.filter((_, j) => j !== i))}>Quitar</button>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="boton-chico" onClick={() => cambiar([...cuotas, { cuando: "", valor: 0 }])}>Agregar cuota</button>
        <span className={`num text-[13px] ${suma === arranque ? "text-[var(--texto-2)]" : "text-[var(--peligro)]"}`}>Suman {pesos(suma)} de {pesos(arranque)}</span>
      </div>
    </div>
  );
}
