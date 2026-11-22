import { type Etapa, NOMBRE_ETAPA } from "@/lib/crm/etapas";

const TONO: Partial<Record<Etapa, string>> = { ganado: "verde", perdido: "alerta", propuesta: "info", negociacion: "info" };

export function EtiquetaEtapa({ etapa }: { etapa: Etapa | string | null }) {
  if (!etapa) return null;
  return <span className="chip" data-tono={TONO[etapa as Etapa]}>{NOMBRE_ETAPA[etapa as Etapa] ?? etapa}</span>;
}
