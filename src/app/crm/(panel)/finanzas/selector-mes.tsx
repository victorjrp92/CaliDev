import Link from "next/link";
import { Icono } from "../icono";
import { mesActual, mesVecino, nombreMes } from "./fechas";

/** Mes en pantalla con enlaces al anterior y al siguiente (`?mes=AAAA-MM`). */
export function SelectorMes({ mes, base }: { mes: string; base: string }) {
  const href = (m: string) => `${base}?mes=${m}`;
  return (
    <nav aria-label="Mes" className="flex flex-wrap items-center gap-2">
      <Link href={href(mesVecino(mes, -1))} className="boton-chico" aria-label="Mes anterior"><Icono nombre="atras" tamano={14} grosor={2.2} /></Link>
      <span className="fuerte capitalize-first min-w-[9.5rem] text-center">{nombreMes(mes)}</span>
      <Link href={href(mesVecino(mes, 1))} className="boton-chico" aria-label="Mes siguiente"><Icono nombre="flecha" tamano={14} grosor={2.2} /></Link>
      {mes !== mesActual() && <Link href={base} className="boton-chico">Este mes</Link>}
    </nav>
  );
}
