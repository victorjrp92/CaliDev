/**
 * Preguntas del formulario «Quiero empezar a delegar».
 *
 * Es un formulario distinto del de ServiNomic (lib/leads.ts), no una versión:
 * aquel puntuaba valor × intención para vender un producto; este califica por
 * categorías para priorizar conversaciones. Por eso tiene su propio
 * diccionario, y el panel usa la columna `variante` para saber cuál aplicar.
 *
 * Selección única donde se pide una prioridad, un tamaño o una intención;
 * múltiple solo en herramientas, porque nadie organiza el trabajo con una sola
 * cosa.
 *
 * Los `value` son lo que se guarda en la base: cortos, estables y sin tildes.
 * Cambiar una etiqueta es seguro; cambiar un `value` deja huérfanos los leads
 * que ya lo tienen.
 */

export type Opcion = { value: string; label: string };

export type PreguntaDelegar = {
  key: ClaveDelegar;
  label: string;
  ayuda?: string;
  multi?: boolean;
  opciones: Opcion[];
};

export type ClaveDelegar = "rol" | "dolor" | "tamano" | "herramientas" | "busca" | "plazo";

export type RespuestasDelegar = Partial<Record<ClaveDelegar, string>>;

export const ROL: PreguntaDelegar = {
  key: "rol",
  label: "¿Qué papel tienes en el negocio?",
  opciones: [
    { value: "dueno", label: "Soy dueño/a o socio/a y participo en las decisiones" },
    { value: "dirige", label: "Dirijo o administro el negocio" },
    // Un empleado puede impulsar la compra: sigue el flujo normal.
    { value: "empleado", label: "Trabajo ahí y quiero proponer una mejora" },
    { value: "ninguna", label: "Todavía no tengo negocio" },
  ],
};

export const DOLOR: PreguntaDelegar = {
  key: "dolor",
  label: "¿Qué necesitas resolver primero?",
  opciones: [
    { value: "tiempo", label: "Todo pasa por mí y me falta tiempo" },
    { value: "delegar", label: "Intento delegar, pero termino haciéndolo yo" },
    { value: "crecer", label: "Queremos crecer y la operación se desordena" },
    // Es la puerta para quien viene buscando tecnología: la página no lo
    // mencionaba en ningún otro sitio del recorrido.
    { value: "tecnologia", label: "Busco una app, software o página web que me quite trabajo" },
    { value: "otro", label: "Otro problema" },
  ],
};

export const TAMANO: PreguntaDelegar = {
  key: "tamano",
  label: "¿Cuántas personas trabajan en la operación, incluyéndote?",
  opciones: [
    { value: "solo", label: "Solo yo" },
    { value: "2-3", label: "2 a 3" },
    { value: "4-10", label: "4 a 10" },
    { value: "11-25", label: "11 a 25" },
    { value: "26+", label: "26 o más" },
  ],
};

export const HERRAMIENTAS: PreguntaDelegar = {
  key: "herramientas",
  label: "¿Con qué organizas el trabajo hoy?",
  ayuda: "Marca todo lo que uses.",
  multi: true,
  opciones: [
    { value: "papel", label: "Papel, libretas o memoria" },
    { value: "excel", label: "Excel o Google Sheets" },
    { value: "whatsapp", label: "WhatsApp" },
    { value: "programas", label: "Uno o varios programas" },
    { value: "otro", label: "Otro" },
  ],
};

export const BUSCA: PreguntaDelegar = {
  key: "busca",
  label: "¿Qué buscas en esta conversación?",
  opciones: [
    { value: "contratar", label: "Evaluar una solución para contratarla si me sirve" },
    { value: "opciones", label: "Entender las opciones y costos antes de decidir" },
    { value: "conocer", label: "Por ahora, solo conocer cómo funciona" },
  ],
};

export const PLAZO: PreguntaDelegar = {
  key: "plazo",
  label: "¿Cuándo te gustaría implementar una mejora?",
  opciones: [
    { value: "30d", label: "En los próximos 30 días" },
    { value: "1-3m", label: "En los próximos 1 a 3 meses" },
    { value: "sinfecha", label: "Estoy explorando, todavía no tengo una fecha" },
  ],
};

export const PREGUNTAS_DELEGAR: PreguntaDelegar[] = [ROL, DOLOR, TAMANO, HERRAMIENTAS, BUSCA, PLAZO];

/** Separa una respuesta múltiple guardada como «a,b,c». */
export function valoresDelegar(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * Deja solo valores que existan en la pregunta, en el orden en que están
 * declarados. Una cadena manipulada desde el navegador no llega a la base.
 */
export function limpiarRespuesta(pregunta: PreguntaDelegar, raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const permitidos = pregunta.opciones.map((o) => o.value);
  if (!pregunta.multi) return permitidos.includes(raw) ? raw : null;

  const elegidos = new Set(valoresDelegar(raw));
  const orden = permitidos.filter((v) => elegidos.has(v));
  return orden.length > 0 ? orden.join(",") : null;
}

/** Etiqueta legible para el panel. Las múltiples se unen con un punto medio. */
export function etiquetaDelegar(key: ClaveDelegar, raw: string | null | undefined): string {
  const pregunta = PREGUNTAS_DELEGAR.find((p) => p.key === key);
  const valores = valoresDelegar(raw);
  if (!pregunta || valores.length === 0) return "—";
  return valores
    .map((v) => pregunta.opciones.find((o) => o.value === v)?.label ?? v)
    .join(" · ");
}
