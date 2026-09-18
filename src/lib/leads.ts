/**
 * Filtro y scoring de leads de ServiNomic.
 *
 * Dos ejes deliberadamente separados:
 *  - VALOR    (0-100): cuánto vale el contacto si cierra. Tamaño y autoridad.
 *  - INTENCIÓN(0-100): qué tan cerca está de moverse. Dolor actual y urgencia.
 *
 * El puntaje final es VALOR × INTENCIÓN / 100 en vez de un promedio: multiplicar
 * castiga el desequilibrio, así una empresa grande que "está explorando" no
 * desplaza a una mediana que cierra pagos a mano y lo quiere ya. Con capacidad
 * de 2 proyectos simultáneos, ese orden es el que importa.
 *
 * ── El orden de las preguntas cambió, y ese es el cambio de fondo ──
 *
 * Antes se abría pidiendo credenciales: "¿tienes una empresa con personal
 * operativo?", con una definición que descifrar y "no tengo empresa" como
 * cuarta opción. La persona acababa de leer la historia de Deisy —el punto más
 * alto de su motivación— y lo primero que recibía era un control de acceso con
 * una salida a un toque.
 *
 * Ahora se abre por el dolor: "¿qué te está comiendo la semana?". No hay
 * respuesta incorrecta, la persona se reconoce en el primer toque, y solo
 * después se le pregunta quién es y cuántos son. Las credenciales siguen ahí y
 * siguen filtrando; lo que cambió es que llegan cuando ya está dentro.
 *
 * ── Multirrespuesta donde la realidad no es de una sola ──
 *
 * Nadie tiene un solo freno, y nadie maneja la operación con una sola cosa: se
 * usa la libreta Y el Excel Y un programa a medias. Obligar a elegir una
 * inventaba un dato falso y además creaba deliberación, que es fricción. Marcar
 * varias cuesta menos que descartar.
 *
 * ── El país ya no se pregunta ──
 *
 * Sale del indicativo del WhatsApp, que la persona va a elegir de todos modos.
 * Una pregunta menos sin perder un dato.
 *
 * Regla de diseño del formulario: solo se pregunta lo que mueve el puntaje o el
 * enrutamiento. Todo lo demás se pregunta en la llamada.
 */

export type Option = {
  value: string;
  label: string;
  points?: number;
  /**
   * Al marcarla se desmarca todo lo demás, y viceversa. Es para las opciones
   * que niegan al resto: "todo funciona bien" no convive con "uso libretas".
   */
  exclusiva?: boolean;
};

export type Question = {
  key: LeadAnswerKey;
  step: 1 | 3;
  label: string;
  help?: string;
  /** Admite varias respuestas, guardadas separadas por coma. */
  multi?: boolean;
  options: Option[];
};

export type LeadAnswerKey =
  | "freno"
  | "repetitivo"
  | "role"
  | "staff"
  | "country"
  | "herramientas"
  | "urgency"
  | "aspiracion";

export type LeadAnswers = Partial<Record<LeadAnswerKey, string>>;

/** Claves que guardan varias respuestas separadas por coma. */
export const MULTI_KEYS: LeadAnswerKey[] = ["freno", "herramientas"];

export function esMulti(key: LeadAnswerKey): boolean {
  return MULTI_KEYS.includes(key);
}

/** Los valores de una respuesta, sea de una o de varias. */
export function valoresDe(raw: string | undefined | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * Paso 1: el dolor primero, las credenciales después. Sin datos personales.
 *
 * `freno` y `repetitivo` van delante porque son las que hacen que la persona se
 * sienta leída; `role` y `staff` son las que filtran, y para cuando llegan ya
 * hay tres toques invertidos.
 */
export const STEP_1_QUESTIONS: Question[] = [
  {
    key: "freno",
    step: 1,
    label: "¿Qué te está comiendo la semana?",
    help: "Marca todo lo que te pase.",
    multi: true,
    options: [
      { value: "nodoyabasto", label: "No doy abasto con lo que ya tengo", points: 25 },
      { value: "desorden", label: "Crecí y se me desordenó todo", points: 25 },
      { value: "dependedemi", label: "Todo depende de mí: si no estoy, se para", points: 25 },
      { value: "plata", label: "No sé por dónde se me va la plata", points: 22 },
      { value: "pocosclientes", label: "Me buscan poco, necesito que me encuentren", points: 18 },
    ],
  },
  {
    key: "repetitivo",
    step: 1,
    label: "¿Cuánto de tu semana se va en eso?",
    help: "Responder los mismos mensajes, pasar datos de un lado a otro, armar el mismo informe.",
    options: [
      { value: "lt2", label: "Menos de 2 horas", points: 5 },
      { value: "2-5", label: "Entre 2 y 5 horas", points: 18 },
      { value: "5-10", label: "Entre 5 y 10 horas", points: 30 },
      {
        value: "gt10",
        label: "Más de 10 horas — más de un día entero de trabajo",
        points: 40,
      },
      { value: "nomedido", label: "No lo he medido, pero es mucho", points: 25 },
    ],
  },
  {
    key: "role",
    step: 1,
    label: "¿La empresa es tuya?",
    options: [
      { value: "dueno", label: "Sí, es mía", points: 15 },
      { value: "socio", label: "Soy socia o la administro", points: 10 },
      { value: "empleado", label: "Trabajo ahí, pero no es mía", points: 0 },
      { value: "ninguna", label: "No tengo empresa", points: 0 },
    ],
  },
  {
    key: "staff",
    step: 1,
    label: "¿Cuántas personas hay en la operación?",
    help: "Las que prestan el servicio, no las de oficina.",
    options: [
      { value: "1-3", label: "Entre 1 y 3", points: 5 },
      { value: "4-10", label: "Entre 4 y 10", points: 20 },
      { value: "11-25", label: "Entre 11 y 25", points: 35 },
      { value: "26-50", label: "Entre 26 y 50", points: 45 },
      { value: "50+", label: "Más de 50", points: 50 },
    ],
  },
];

/**
 * Paso 3: "para llegar preparados", ya con el contacto guardado.
 *
 * `urgency` dejó de preguntar cuándo quiere empezar y pasó a preguntar CÓMO
 * empezamos. Las tres opciones son un sí —cambia el canal y el plazo, no el
 * hecho de que la vamos a contactar—, que es lo que en ventas se llama cierre
 * alternativo. No pierde el dato: elegir "esta semana" sigue siendo la señal
 * caliente y "primero cuéntenme" la fría.
 *
 * Y tiene un efecto que la pregunta anterior no tenía: quien ELIGE que le
 * escriban esta semana se queda esperando ese mensaje. La anticipación no la
 * genera la pregunta, la genera haber elegido.
 */
export const STEP_3_QUESTIONS: Question[] = [
  {
    key: "herramientas",
    step: 3,
    label: "¿Con qué manejas la operación hoy?",
    help: "Todo lo que uses, aunque sea a medias.",
    multi: true,
    options: [
      { value: "libretas", label: "Libretas, papel y memoria", points: 35 },
      { value: "excel", label: "Excel y WhatsApp", points: 32 },
      { value: "sueltos", label: "Varios programas que no se hablan entre sí", points: 28 },
      { value: "software", label: "Un software, pero no me sirve del todo", points: 18 },
      {
        value: "bien",
        label: "Todo funciona bien como está",
        points: 0,
        exclusiva: true,
      },
    ],
  },
  {
    key: "urgency",
    step: 3,
    label: "¿Cómo empezamos?",
    options: [
      { value: "ya", label: "Escríbanme por WhatsApp esta semana", points: 30 },
      { value: "1-3m", label: "Una llamada corta este mes", points: 18 },
      { value: "explorando", label: "Primero cuéntenme más por correo", points: 5 },
    ],
  },
];

/**
 * La última, después de enviar y sin botón. No puntúa y no es obligatoria.
 *
 * Existe por lo que da al otro lado: es la frase con la que se abre el WhatsApp.
 * Un primer mensaje que cita lo que la persona dijo que haría con ese tiempo no
 * se lee como una venta, se lee como alguien que la escuchó. Preguntarla aquí
 * es gratis —ya envió, no hay nada que perder— y por eso la contesta casi todo
 * el mundo.
 */
export const ASPIRACION_QUESTION: Question = {
  key: "aspiracion",
  step: 3,
  label: "Si recuperas esas horas, ¿qué es lo primero que harías?",
  options: [
    { value: "descansar", label: "Descansar un día" },
    { value: "vender", label: "Vender más" },
    { value: "incendios", label: "Dejar de apagar incendios" },
    { value: "crecer", label: "Crecer sin que se desordene" },
  ],
};

/**
 * El país ya no se pregunta: sale del indicativo. Se conserva como pregunta
 * para que la puntuación y las etiquetas del panel sigan encontrando sus
 * opciones por la misma vía que las demás.
 */
export const COUNTRY_QUESTION: Question = {
  key: "country",
  step: 1,
  label: "País de la operación",
  options: [
    { value: "co", label: "Colombia", points: 10 },
    { value: "latam", label: "Otro país de Latinoamérica", points: 5 },
    { value: "otro", label: "Otro país", points: 3 },
  ],
};

export const ALL_QUESTIONS: Question[] = [
  ...STEP_1_QUESTIONS,
  ...STEP_3_QUESTIONS,
  ASPIRACION_QUESTION,
  COUNTRY_QUESTION,
];

/** Qué preguntas alimentan cada eje. */
const VALUE_KEYS: LeadAnswerKey[] = ["staff", "role", "country"];
const INTENT_KEYS: LeadAnswerKey[] = ["freno", "repetitivo", "herramientas", "urgency"];

function opcionesDe(key: LeadAnswerKey): Option[] {
  return ALL_QUESTIONS.find((q) => q.key === key)?.options ?? [];
}

/**
 * Puntos de una respuesta.
 *
 * En las de varias respuestas manda la más alta y cada marca adicional suma un
 * poco, con tope. Sumarlas todas convertiría la pregunta en un concurso de
 * marcar casillas; quedarse solo con la más alta tiraría información real —
 * quien nombra cuatro frenos está peor que quien nombra uno—. El extra
 * decreciente recoge eso sin desbalancear el eje.
 */
const EXTRA_POR_MARCA = 4;
const TOPE_MULTI = 35;

function pointsFor(key: LeadAnswerKey, value: string | undefined): number {
  const valores = valoresDe(value);
  if (valores.length === 0) return 0;

  const opciones = opcionesDe(key);
  const puntos = valores.map((v) => opciones.find((o) => o.value === v)?.points ?? 0);
  const mayor = Math.max(...puntos);

  if (!esMulti(key) || valores.length === 1) return mayor;
  return Math.min(TOPE_MULTI, mayor + EXTRA_POR_MARCA * (valores.length - 1));
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
 * A qué se parece el encaje. No decide si el contacto sirve, solo por dónde
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

  const herramientas = valoresDe(answers.herramientas);
  if (herramientas.length === 1 && herramientas[0] === "bien") return "descartado";

  const enColombia = answers.country === "co";
  const equipoDeVerdad = Boolean(answers.staff) && answers.staff !== "1-3";
  const todaviaAMano =
    herramientas.includes("libretas") || herramientas.includes("excel");

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

/**
 * Etiqueta legible de una respuesta, para la tabla del admin. Las de varias
 * respuestas se unen con un punto medio.
 */
export function labelFor(key: LeadAnswerKey, value: string | null | undefined): string {
  const valores = valoresDe(value);
  if (valores.length === 0) return "—";
  const opciones = opcionesDe(key);
  return valores
    .map((v) => opciones.find((o) => o.value === v)?.label ?? v)
    .join(" · ");
}

/**
 * La frase que se le devuelve entre el paso 1 y el paso 2.
 *
 * Repetirle lo que acaba de decir, con sus palabras, antes de pedirle el
 * número. Es el momento más barato y más potente del formulario: confirma que
 * encaja —consistencia con la etiqueta— y le da algo que perdería si se va.
 *
 * Se construye de las respuestas y nunca inventa: si no hay con qué armarla,
 * devuelve `null` y la pantalla enseña solo el título.
 */
const FRENO_EN_ESPEJO: Record<string, string> = {
  nodoyabasto: "no das abasto con lo que ya tienes",
  desorden: "creciste y se te desordenó todo",
  dependedemi: "todo depende de ti",
  plata: "no sabes por dónde se te va la plata",
  pocosclientes: "te buscan poco",
};

const HORAS_EN_ESPEJO: Record<string, string> = {
  "2-5": "se te van entre dos y cinco horas a la semana",
  "5-10": "se te van entre cinco y diez horas a la semana",
  gt10: "se te va más de un día entero de trabajo a la semana",
  nomedido: "no lo has medido, pero es mucho",
};

export function espejoDe(answers: LeadAnswers): string | null {
  const frenos = valoresDe(answers.freno)
    .map((v) => FRENO_EN_ESPEJO[v])
    .filter(Boolean);
  const horas = HORAS_EN_ESPEJO[answers.repetitivo ?? ""];

  const partes: string[] = [];
  if (frenos.length === 1) partes.push(frenos[0]);
  if (frenos.length > 1) partes.push(`${frenos[0]} y ${frenos[1]}`);
  if (horas) partes.push(horas);

  if (partes.length === 0) return null;
  return `Dijiste que ${partes.join(", y que ")}.`;
}

/** Un lead sin respuestas del paso 3 sigue siendo contactable: se guarda parcial. */
export function isComplete(answers: LeadAnswers): boolean {
  return STEP_3_QUESTIONS.every((q) => Boolean(answers[q.key]));
}
