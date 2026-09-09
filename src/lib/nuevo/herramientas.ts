/**
 * Las herramientas que orbitan en la sección.
 *
 * REGLA: aquí solo entra lo que de verdad usamos. Son logos de terceros en
 * nuestro sitio, y un cliente técnico verifica la lista en dos minutos. Todas
 * las de abajo están comprobadas en este mismo proyecto o en los que están en
 * producción — la comprobación va anotada en cada una.
 *
 * Los anillos van de dentro afuera y de rápido a lento: primero la capa de IA,
 * después con qué se construye, y fuera dónde vive lo construido.
 */
export type Herramienta = {
  id: string;
  nombre: string;
  /** Dónde se usa. No se publica; está para que la lista no se llene de humo. */
  constancia: string;
};

export const ANILLOS: { herramientas: Herramienta[]; duracion: number }[] = [
  {
    duracion: 26,
    herramientas: [
      { id: "claude", nombre: "Claude", constancia: "desarrollo y análisis del día a día" },
      { id: "openai", nombre: "OpenAI", constancia: "Codex, generación de imágenes del sitio" },
      { id: "gemini", nombre: "Gemini", constancia: "capa multi-modelo de Witmi" },
    ],
  },
  {
    duracion: 34,
    herramientas: [
      { id: "nextjs", nombre: "Next.js", constancia: "calidev.dev y los sitios de clientes" },
      { id: "react", nombre: "React", constancia: "ServiNomic, Seiricon y este sitio" },
      { id: "python", nombre: "Python", constancia: "scripts de datos y del pipeline de medios" },
    ],
  },
  {
    duracion: 44,
    herramientas: [
      { id: "vercel", nombre: "Vercel", constancia: "despliegue de los sitios" },
      { id: "firebase", nombre: "Firebase", constancia: "ServiNomic en producción" },
      { id: "whatsapp", nombre: "WhatsApp", constancia: "Witmi, asistente en producción" },
    ],
  },
];

export const TODAS = ANILLOS.flatMap((a) => a.herramientas);
