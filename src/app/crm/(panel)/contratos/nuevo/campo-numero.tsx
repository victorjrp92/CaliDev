import { pesos } from "@/lib/contratos/plantilla-servinomic";
import { Campo } from "../../campo";

/** Número entero; si es plata, muestra el valor formateado debajo para no equivocarse con los ceros. */
export function CampoNumero({ etiqueta, valor, cambiar, plata = true }: { etiqueta: string; valor: number; cambiar: (v: number) => void; plata?: boolean }) {
  return (
    <Campo etiqueta={etiqueta} ayuda={plata && valor > 0 ? pesos(valor) : undefined}>
      <input className="campo num" inputMode="numeric" value={valor ? String(valor) : ""} onChange={(e) => cambiar(Number(e.target.value.replace(/\D/g, "")) || 0)} />
    </Campo>
  );
}
