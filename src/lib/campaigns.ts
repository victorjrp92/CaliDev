/**
 * Variantes de la landing de ServiNomic, una por campaña.
 *
 * Lanzar una campaña nueva = agregar una entrada aquí. El formulario, el
 * scoring y el admin se comparten, así una corrección al filtro se aplica a
 * todas las campañas a la vez en lugar de tener que replicarla en N páginas.
 *
 * El `slug` es la URL: /servinomic/{slug}. Se guarda con cada lead para saber
 * qué campaña trajo a los buenos.
 *
 * REGLA DE DATOS: nunca se publican cifras absolutas de ingresos ni utilidades
 * del cliente — en Colombia eso es información delicada. Solo el crecimiento
 * porcentual, que dice lo mismo sin exponer al cliente.
 */

export type Campaign = {
  slug: string;
  /** De dónde viene el visitante. Aparece en la barra superior. */
  referrer: string | null;
  /** Titular. Debe nombrar al destinatario para que el no calificado se vaya en 3 segundos. */
  headline: string;
  /** Fragmento del titular que va resaltado. Debe existir dentro de `headline`. */
  headlineHighlight: string;
  subhead: string;
  /**
   * Lo que deja de hacerse a mano, en renglones sueltos.
   *
   * Sustituye al párrafo de entrada. Quien llega de un video no lee prosa: mira
   * si algo de esto le pasa a ella, y en una lista lo sabe en dos segundos.
   */
  bullets: string[];
  /** Texto del primer botón, arriba del pliegue. */
  heroCta: string;

  /** Testimonio que continúa el anuncio. La landing es la segunda mitad de esa historia. */
  quote: string;
  quoteAuthor: string;
  quoteRole: string;
  /** Línea de verificación bajo la cita: convierte el testimonio en dato comprobable. */
  quoteMeta: string;
  /** Nombre corto del cliente, para encabezados. */
  clientName: string;
  /** Otro trabajo hecho para el mismo cliente. Prueba verificable adicional. */
  clientSite: { intro: string; label: string; href: string } | null;

  /** Foto del equipo del cliente. Personas reales, no stock. */
  teamPhoto: { src: string; alt: string; caption: string };

  /** Cifras del caso. Solo relativas — ver REGLA DE DATOS arriba. */
  stats: { value: string; label: string }[];

  /** El costo humano antes del sistema. Es el dato que más conecta. */
  reliefTitle: string;
  reliefBody: string;

  /** Cuántas empresas se acompañan a la vez. Número real, no escasez inventada. */
  slots: number;
};

const LIMPIAEXPRESS: Campaign = {
  slug: "limpiaexpress",
  referrer: "Vienes del video de Deisy",
  // El titular no describe la herramienta de nadie en particular (agenda de
  // papel, Excel, WhatsApp): cada empresa se organiza distinto y decirlo mal
  // hace que la lectora sienta que no le hablan a ella. El dolor que sí es
  // universal en una empresa de servicios es que la operación entera depende
  // de la memoria del dueño.
  headline: "Cuatro horas al día organizando. Hoy, diez minutos.",
  headlineHighlight: "Hoy, diez minutos.",
  subhead: "Le pasó a LimpiaExpress Cali. Esto es lo que dejaron de hacer a mano:",
  bullets: [
    "Cuadrar la nómina y la seguridad social",
    "Armar la ruta del día y repartir al equipo",
    "Sumar ingresos, gastos y margen por servicio",
    "Buscar en cuarenta chats quién atendió qué",
  ],
  heroCta: "Ver si aplica a mi empresa",

  quote:
    "Yo no tenía un negocio desorganizado, tenía un negocio que me tenía ocupada doce horas al día. Todo estaba en libretas y Excel. Cali Dev entendió que mi problema no era de ventas, era de tiempo y herramientas. Pasé de planear por horas a dirigir en minutos.",
  quoteAuthor: "Deisy Moncayo",
  quoteRole: "CEO, LimpiaExpress Cali",
  quoteMeta: "Cliente desde 2026 · 20 colaboradoras · 3 ciudades",
  clientName: "LimpiaExpress Cali",
  clientSite: {
    intro: "También les construimos la página web y el perfil de Google:",
    label: "limpiaexpresscali.com",
    href: "https://limpiaexpresscali.com",
  },

  teamPhoto: {
    src: "/servinomic/equipo.jpg",
    alt: "El equipo de LimpiaExpress Cali: colaboradoras en uniforme, reunidas y sonriendo",
    caption: "El equipo de LimpiaExpress Cali — 20 colaboradoras, 3 ciudades",
  },

  /**
   * CIFRAS: las mismas que Deisy dice en el video. Si cambian ahí, cambian
   * aquí — y este es el único sitio donde viven.
   */
  stats: [
    { value: "+56%", label: "Crecimiento en ingresos" },
    { value: "10 → 20", label: "Colaboradoras" },
    { value: "+40 hrs", label: "Recuperadas cada semana" },
    { value: "10 min", label: "Planear el día, antes 4 horas" },
  ],

  reliefTitle: "Antes no descansaba ni los domingos.",
  reliefBody:
    "Dieciséis horas por semana cuadrando pagos. Cada servicio anotado a mano. Cada dirección buscada una por una. Más de cuarenta horas a la semana en total: un empleado de tiempo completo que nadie ve. Hoy Deisy dirige una empresa más grande y descansa un día a la semana.",

  slots: 3,
};

/** Variante por defecto para quien llegue a /servinomic sin campaña. */
const DIRECTO: Campaign = {
  ...LIMPIAEXPRESS,
  slug: "directo",
  referrer: null,
  subhead: "Lo que las empresas de servicios dejan de hacer a mano:",
};

export const CAMPAIGNS: Record<string, Campaign> = {
  limpiaexpress: LIMPIAEXPRESS,
  directo: DIRECTO,
};

export function getCampaign(slug: string | undefined): Campaign {
  if (!slug) return DIRECTO;
  return CAMPAIGNS[slug] ?? DIRECTO;
}

export function campaignSlugs(): string[] {
  return Object.keys(CAMPAIGNS).filter((slug) => slug !== "directo");
}
