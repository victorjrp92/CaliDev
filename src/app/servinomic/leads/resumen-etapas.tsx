import { NOMBRE_ETAPA, type Etapa, type Persona } from "@/lib/seguimiento/personas";

/**
 * Cuántas personas hay en cada etapa, en el orden del embudo, con las que piden
 * acción (invitar, enviar propuesta) marcadas en amarillo. Las etapas vacías no
 * se muestran.
 */
const ORDEN: Etapa[] = [
  "por-invitar",
  "esperando-hora-1",
  "cita-1",
  "por-invitar-2",
  "esperando-hora-2",
  "cita-2",
  "por-proponer",
  "propuesta",
  "ganado",
  "perdido",
  "pausa",
];
const PIDEN_ACCION: Etapa[] = ["por-invitar", "por-invitar-2", "por-proponer"];

export function ResumenEtapas({ personas }: { personas: Persona[] }) {
  const cuenta = (e: Etapa) => personas.filter((p) => p.etapa === e).length;
  return (
    <ul className="flex flex-wrap gap-2">
      {ORDEN.filter((e) => cuenta(e) > 0).map((e) => (
        <li
          key={e}
          className={`flex items-baseline gap-2 rounded-xl border px-3 py-2 ${
            PIDEN_ACCION.includes(e) ? "border-[#E8D9A8] bg-[#FDF3D8]" : "border-[#D8DCD4] bg-white"
          }`}
        >
          <span className="text-[20px] font-extrabold tabular-nums leading-none">{cuenta(e)}</span>
          <span className="text-[12.5px] text-[#46554D]">{NOMBRE_ETAPA[e]}</span>
        </li>
      ))}
    </ul>
  );
}
