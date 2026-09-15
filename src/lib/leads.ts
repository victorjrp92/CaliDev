/**
 * Filtro y scoring de leads de ServiNomic.
 *
 * Dos ejes deliberadamente separados:
 *  - VALOR    (0-100): cuánto vale el contacto si cierra. Tamaño y autoridad.
 *  - INTENCIÓN(0-100): qué tan cerca está de moverse. Dolor actual y urgencia.
 *
 * Lo que se pregunta cambió cuando la oferta dejó de ser solo ServiNomic. Con
 * páginas web, marca, flujos de trabajo y asesoría encima de la mesa, cabe casi
 * cualquier empresa, así que el rubro y el modelo de pago dejaron de separar al
 * buen contacto del perdido. Lo que sí lo separa es el momento: estancada,
 * trabajando de más, repitiendo tareas, con libretas y Excel, y con ganas de
 * cambiarlo.
 *
 * El puntaje final es VALOR × INTENCIÓN / 100 en vez de un promedio: multiplicar
 * castiga el desequilibrio, así una empresa grande que "está explorando" no
 * desplaza a una mediana que cierra pagos a mano y lo quiere ya. Con capacidad
 * de 2 proyectos simultáneos, ese orden es el que importa.
 *
 * Regla de diseño del formulario: solo se pregunta lo que mueve el puntaje o el
 * enrutamiento. Todo lo demás se pregunta en la llamada.
 */

export type Option = { value: string; label: string; points?: number };

export type Question = {
  key: LeadAnswerKey;
  step: 1 | 3;
  label: string;
  help?: string;
  options: Option[];
};

export type LeadAnswerKey =
  | "role"
  | "staff"
  | "country"
  | "herramientas"
  | "repetitivo"
  | "freno"
  | "urgency";

export type LeadAnswers = Partial<Record<LeadAnswerKey, string>>;

/** Paso 1: sin datos personales. Compromete al visitante antes de pedirle nada. */
export const STEP_1_QUESTIONS: Question[] = [
  {
    key: "role",
    step: 1,
    label: "¿Tienes una empresa con personal operativo?",
    help: "Personal operativo = gente que presta el servicio en terreno.",
    options: [
      { value: "dueno", label: "Sí, la empresa es mía", points: 15 },
      { value: "socio", label: "Soy socio o la administro", points: 10 },
      { value: "empleado", label: "Trabajo en una, pero no es mía", points: 0 },
      { value: "ninguna", label: "No tengo empresa", points: 0 },
    ],
  },
  {
    key: "staff",
    step: 1,
    label: "¿Cuántas personas trabajan en tu operación?",
    options: [
      { value: "1-3", label: "Entre 1 y 3", points: 5 },
      { value: "4-10", label: "Entre 4 y 10", points: 20 },
      { value: "11-25", label: "Entre 11 y 25", points: 35 },
      { value: "26-50", label: "Entre 26 y 50", points: 45 },
      { value: "50+", label: "Más de 50", points: 50 },
    ],
  },
  {
    key: "country",
    step: 1,
    label: "¿En qué país opera tu empresa?",
    options: [
      { value: "co", label: "Colombia", points: 10 },
      { value: "latam", label: "Otro país de Latinoamérica", points: 5 },
      { value: "otro", label: "Otro país", points: 3 },
    ],
  },
];

/** Paso 3: enmarcado como "para preparar tu diagnóstico", ya con el contacto guardado. */
export const STEP_3_QUESTIONS: Question[] = [
  {
    key: "herramientas",
    step: 3,
    label: "¿Con qué manejas la operación hoy?",
    help: "Lo que de verdad usas todos los días, no lo que te gustaría usar.",
    options: [
      { value: "libretas", label: "Libretas, papel y memoria", points: 35 },
      { value: "excel", label: "Excel y WhatsApp", points: 32 },
      { value: "sueltos", label: "Varios programas que no se hablan entre sí", points: 28 },
      { value: "software", label: "Un software, pero no me sirve del todo", points: 18 },
      { value: "bien", label: "Todo funciona bien como está", points: 0 },
    ],
  },
  {
    key: "repetitivo",
    step: 3,
    label: "¿Cuánto tiempo a la semana se te va en tareas que se repiten?",
    help: "Responder los mismos mensajes, pasar datos de un lado a otro, armar el mismo informe.",
    options: [
      { value: "lt2", label: "Menos de 2 horas", points: 5 },
      { value: "2-5", label: "Entre 2 y 5 horas", points: 18 },
      { value: "5-10", label: "Entre 5 y 10 horas", points: 30 },
      { value: "gt10", label: "Más de 10 horas", points: 40 },
      { value: "nomedido", label: "No lo he medido, pero es mucho", points: 25 },
    ],
  },
  {
    key: "freno",
    step: 3,
    label: "¿Qué te está frenando hoy?",
    options: [
      { value: "nodoyabasto", label: "No doy abasto con lo que ya tengo", points: 25 },
      { value: "desorden", label: "Crecí y se me desordenó todo", points: 25 },
      { value: "plata", label: "No sé por dónde se me va la plata", points: 22 },
      { value: "dependedemi", label: "Todo depende de mí", points: 25 },
      { value: "pocosclientes", label: "Me buscan poco, necesito que me encuentren", points: 18 },
    ],
  },
  {
    key: "urgency",
    step: 3,
    label: "¿Cuándo quisieras empezar a cambiarlo?",
    options: [
      { value: "ya", label: "Ya, es urgente", points: 30 },
      { value: "1-3m", label: "En los próximos 1 a 3 meses", points: 18 },
      { value: "explorando", label: "Estoy explorando por ahora", points: 5 },
    ],
  },
];

export const ALL_QUESTIONS: Question[] = [...STEP_1_QUESTIONS, ...STEP_3_QUESTIONS];

/** Qué preguntas alimentan cada eje. */
const VALUE_KEYS: LeadAnswerKey[] = ["staff", "role", "country"];
const INTENT_KEYS: LeadAnswerKey[] = ["herramientas", "repetitivo", "freno", "urgency"];

function pointsFor(key: LeadAnswerKey, value: string | undefined): number {
  if (!value) return 0;
  const question = ALL_QUESTIONS.find((q) => q.key === key);
  return question?.options.find((o) => o.value === value)?.points ?? 0;
}

function sumPoints(keys: LeadAnswerKey[], answers: LeadAnswers): number {
  return keys.reduce((total, key) => total + pointsFor(key, answers[key]), 0);
}

export type Track = "producto" | "servicio" | "descartado";

export type LeadScore = {
  value: number;
  intent: number;
  total: number;
  track: Track;
  qualified: boolean;
};

/**
 * A qué se parece el encaje. Ya no decide si el contacto sirve, solo por dónde
 * empezaría la conversación.
 *
 * `descartado` es para quien no dirige nada y para quien dice que todo le
 * funciona bien: sin nada que arreglar no hay proyecto, y llamarla es gastarle
 * el tiempo a las dos partes.
 *
 * `producto` es donde ServiNomic encaja tal cual: Colombia, equipo de verdad y
 * la operación todavía a mano. El motor de nómina tiene cableado el régimen
 * colombiano, así que fuera de ahí se construye a medida, que es `servicio` —
 * más caro, no peor.
 */
export function routeTrack(answers: LeadAnswers): Track {
  if (answers.role === "empleado" || answers.role === "ninguna") return "descartado";
  if (answers.herramientas === "bien") return "descartado";

  const enColombia = answers.country === "co";
  const equipoDeVerdad = answers.staff !== "1-3";
  const todaviaAMano = answers.herramientas === "libretas" || answers.herramientas === "excel";

  if (enColombia && equipoDeVerdad && todaviaAMano) return "producto";
  return "servicio";
}

export function scoreLead(answers: LeadAnswers): LeadScore {
  const value = Math.min(100, sumPoints(VALUE_KEYS, answers));
  const intent = Math.min(100, sumPoints(INTENT_KEYS, answers));
  const track = routeTrack(answers);

  // Multiplicativo: premia solo lo que es grande Y caliente a la vez.
  const total = track === "descartado" ? 0 : Math.round((value * intent) / 100);

  return { value, intent, total, track, qualified: track !== "descartado" };
}

/** Etiqueta legible de una respuesta, para la tabla del admin. */
export function labelFor(key: LeadAnswerKey, value: string | null | undefined): string {
  if (!value) return "—";
  const question = ALL_QUESTIONS.find((q) => q.key === key);
  return question?.options.find((o) => o.value === value)?.label ?? value;
}

/** Un lead sin respuestas del paso 3 sigue siendo contactable: se guarda parcial. */
export function isComplete(answers: LeadAnswers): boolean {
  return STEP_3_QUESTIONS.every((q) => Boolean(answers[q.key]));
}
