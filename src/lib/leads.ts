/**
 * Filtro y scoring de leads de ServiNomic.
 *
 * Dos ejes deliberadamente separados:
 *  - VALOR    (0-100): cuánto vale el lead si cierra — tamaño, volumen, autoridad, país.
 *  - INTENCIÓN(0-100): qué tan cerca está de comprar — dolor actual y urgencia.
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
  | "payment_model"
  | "payroll_hours"
  | "services_month"
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
    key: "payment_model",
    step: 3,
    label: "¿Cómo le pagas hoy a tu equipo?",
    options: [
      { value: "prestacion", label: "Por horas o por servicio (prestación de servicios)", points: 20 },
      { value: "nomina", label: "Nómina fija mensual", points: 5 },
      { value: "mezcla", label: "Una mezcla de las dos", points: 25 },
      { value: "informal", label: "Sin un sistema definido", points: 30 },
    ],
  },
  {
    key: "payroll_hours",
    step: 3,
    label: "¿Cuánto tiempo te toma cerrar los pagos cada periodo?",
    help: "Contando cuadrar horas, calcular descuentos y responder reclamos.",
    options: [
      { value: "lt1", label: "Menos de 1 hora", points: 5 },
      { value: "2-4", label: "Entre 2 y 4 horas", points: 15 },
      { value: "5-10", label: "Entre 5 y 10 horas", points: 30 },
      { value: "gt10", label: "Más de 10 horas", points: 40 },
      { value: "nomedido", label: "Nunca lo he medido", points: 10 },
    ],
  },
  {
    key: "services_month",
    step: 3,
    label: "¿Cuántos servicios atiendes al mes?",
    options: [
      { value: "lt50", label: "Menos de 50", points: 5 },
      { value: "50-200", label: "Entre 50 y 200", points: 12 },
      { value: "201-500", label: "Entre 201 y 500", points: 20 },
      { value: "500+", label: "Más de 500", points: 25 },
    ],
  },
  {
    key: "urgency",
    step: 3,
    label: "¿Cuándo quisieras tenerlo funcionando?",
    options: [
      { value: "ya", label: "Ya, es urgente", points: 30 },
      { value: "1-3m", label: "En los próximos 1 a 3 meses", points: 18 },
      { value: "explorando", label: "Estoy explorando por ahora", points: 5 },
    ],
  },
];

export const ALL_QUESTIONS: Question[] = [...STEP_1_QUESTIONS, ...STEP_3_QUESTIONS];

/** Qué preguntas alimentan cada eje. */
const VALUE_KEYS: LeadAnswerKey[] = ["staff", "services_month", "role", "country"];
const INTENT_KEYS: LeadAnswerKey[] = ["payroll_hours", "payment_model", "urgency"];

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
 * ServiNomic como producto solo aplica en Colombia: el motor de nómina tiene
 * cableado el régimen colombiano (IBC, salud, pensión, ARL, caja) y el modelo
 * de prestación de servicios. Fuera de ese encaje el lead va a track servicio,
 * que es a medida — y más caro, así que no se pierde.
 */
export function routeTrack(answers: LeadAnswers): Track {
  if (answers.role === "empleado" || answers.role === "ninguna") return "descartado";

  const isColombia = answers.country === "co";

  // "informal" también encaja: una operación sin sistema definido en Colombia
  // adopta prestación de servicios AL entrar a ServiNomic — es el mejor
  // candidato al producto listo, no a un proyecto a medida que no puede pagar.
  // El que no encaja es "nomina" (nómina fija mensual): otro régimen legal que
  // el motor no calcula.
  const fitsPayrollEngine = answers.payment_model !== "nomina";
  const tooBigForOffTheShelf = answers.staff === "26-50" || answers.staff === "50+";

  if (isColombia && fitsPayrollEngine && !tooBigForOffTheShelf) return "producto";
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
