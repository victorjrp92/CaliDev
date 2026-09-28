import type { Prioridad } from "@/lib/delegar/prioridad";

/**
 * La fila de un lead «delegar» tal como la devuelve la base, con lo que usan
 * los correos. Todo lo de texto libre (nombre, empresa, actividad, «otro») lo
 * escribió el visitante: se escapa antes de ir a HTML.
 */
export type LeadDelegar = {
  id: number;
  name: string;
  company: string | null;
  whatsapp: string;
  email: string | null;
  country_other: string | null;
  role: string | null;
  staff: string | null;
  actividad: string | null;
  dolor: string | null;
  dolor_otro: string | null;
  herramientas: string | null;
  herramientas_otro: string | null;
  busca: string | null;
  plazo: string | null;
  prioridad: Prioridad | null;
  prioridad_motivo: string | null;
  utm: string | null;
  completed: boolean;
};

export function primerNombre(nombre: string): string {
  return nombre.trim().split(/\s+/)[0] || nombre;
}
