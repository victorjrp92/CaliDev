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
  referrer: "Lo usa LimpiaExpress",
  // El titular no describe la herramienta de nadie en particular (agenda de
  // papel, Excel, WhatsApp): cada empresa se organiza distinto y decirlo mal
  // hace que la lectora sienta que no le hablan a ella. El dolor que sí es
  // universal en una empresa de servicios es que la operación entera depende
  // de la memoria del dueño.
  headline: "Tu empresa depende de que tú te acuerdes de todo.",
  headlineHighlight: "de que tú te acuerdes de todo.",
  subhead:
    "Quién trabaja dónde, cuánto le debes a cada quien, qué cliente no ha vuelto, en qué se te fue la plata. ServiNomic no es una app de nómina: es el cerebro de tu empresa de servicios — el que recuerda, calcula y te avisa por ti.",
  heroCta: "Ver si aplica a mi empresa",

  quote:
    "Yo manejaba todo en agendas de papel, WhatsApp y uno que otro archivo de Excel. Victor no solo nos hizo una app: analizó toda la operación, encontró dónde perdíamos dinero y construyó el sistema que hoy la sostiene.",
  quoteAuthor: "Deisy Moncayo",
  quoteRole: "CEO, LimpiaExpress Cali",
  quoteMeta: "Cliente desde 2026 · 22 colaboradoras · 3 ciudades",
  clientName: "LimpiaExpress Cali",
  clientSite: {
    intro: "También les construimos la página web y el perfil de Google:",
    label: "limpiaexpresscali.com",
    href: "https://limpiaexpresscali.com",
  },

  teamPhoto: {
    src: "/servinomic/equipo.jpg",
    alt: "El equipo de LimpiaExpress Cali: colaboradoras en uniforme, reunidas y sonriendo",
    caption: "El equipo de LimpiaExpress Cali — 22 colaboradoras, 3 ciudades",
  },

  stats: [
    { value: "+53%", label: "Crecimiento en ingresos" },
    { value: "10 → 22", label: "Colaboradoras" },
    { value: "40+ hrs", label: "Recuperadas cada semana" },
    { value: "1 → 3", label: "Ciudades" },
  ],

  reliefTitle: "Antes no descansaba ni los domingos.",
  reliefBody:
    "Cuadrar la seguridad social y los pagos de la semana le tomaba 16 horas. Sumado a registrar cada servicio en la agenda, buscar direcciones, ubicar a quién supervisar, sumar ingresos y gastos a mano, y archivar facturas una por una, la operación se comía más de 40 horas semanales — un empleado de tiempo completo invisible. Hoy Deisy dirige una empresa más grande y se toma un día a la semana para descansar.",

  slots: 3,
};

/** Variante por defecto para quien llegue a /servinomic sin campaña. */
const DIRECTO: Campaign = {
  ...LIMPIAEXPRESS,
  slug: "directo",
  referrer: null,
  subhead:
    "ServiNomic no es una app de nómina. Es el sistema con el que las empresas de servicios coordinan a su equipo, controlan sus servicios y saben dónde crecer.",
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
