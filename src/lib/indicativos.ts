/**
 * Indicativos telefónicos, y con ellos el país.
 *
 * Antes se preguntaba el país como una pregunta más del filtro y el WhatsApp se
 * escribía entero a mano, indicativo incluido. Eso costaba dos veces: una
 * pregunta que la persona ya iba a responder al dar su número, y un campo libre
 * donde el prefijo se escribe mal —sin `+`, con ceros delante, con el `0` de
 * larga distancia nacional— y el número llega inservible.
 *
 * Ahora el indicativo se elige de una lista y el número solo admite dígitos. El
 * país sale del indicativo, así que la pregunta desaparece del formulario sin
 * perder el dato.
 *
 * `zona` es lo que de verdad usa la puntuación: el motor de nómina tiene
 * cableado el régimen colombiano, así que lo que importa no es el país exacto
 * sino si es Colombia, si es Latinoamérica —donde la operación se parece— o si
 * es otro sitio. El nombre del país se guarda igual para preparar la llamada.
 *
 * Varios países comparten el `+1`, de modo que la clave de cada entrada es el
 * código ISO y nunca el prefijo.
 */

export type Zona = "co" | "latam" | "otro";

export type Indicativo = {
  /** Código ISO de dos letras. Es la clave: `+1` lo comparten cuatro países. */
  iso: string;
  pais: string;
  /** Prefijo con el `+` incluido, tal cual se antepone al número. */
  codigo: string;
  zona: Zona;
};

/**
 * Colombia va primera y suelta, no por orden alfabético: es el valor por
 * defecto y la inmensa mayoría de quien llega. El resto va alfabético dentro de
 * su grupo para que se encuentre a ojo.
 */
export const INDICATIVOS: Indicativo[] = [
  { iso: "CO", pais: "Colombia", codigo: "+57", zona: "co" },

  { iso: "AR", pais: "Argentina", codigo: "+54", zona: "latam" },
  { iso: "BO", pais: "Bolivia", codigo: "+591", zona: "latam" },
  { iso: "BR", pais: "Brasil", codigo: "+55", zona: "latam" },
  { iso: "CL", pais: "Chile", codigo: "+56", zona: "latam" },
  { iso: "CR", pais: "Costa Rica", codigo: "+506", zona: "latam" },
  { iso: "CU", pais: "Cuba", codigo: "+53", zona: "latam" },
  { iso: "EC", pais: "Ecuador", codigo: "+593", zona: "latam" },
  { iso: "SV", pais: "El Salvador", codigo: "+503", zona: "latam" },
  { iso: "GT", pais: "Guatemala", codigo: "+502", zona: "latam" },
  { iso: "HN", pais: "Honduras", codigo: "+504", zona: "latam" },
  { iso: "MX", pais: "México", codigo: "+52", zona: "latam" },
  { iso: "NI", pais: "Nicaragua", codigo: "+505", zona: "latam" },
  { iso: "PA", pais: "Panamá", codigo: "+507", zona: "latam" },
  { iso: "PY", pais: "Paraguay", codigo: "+595", zona: "latam" },
  { iso: "PE", pais: "Perú", codigo: "+51", zona: "latam" },
  { iso: "PR", pais: "Puerto Rico", codigo: "+1", zona: "latam" },
  { iso: "DO", pais: "República Dominicana", codigo: "+1", zona: "latam" },
  { iso: "UY", pais: "Uruguay", codigo: "+598", zona: "latam" },
  { iso: "VE", pais: "Venezuela", codigo: "+58", zona: "latam" },

  { iso: "DE", pais: "Alemania", codigo: "+49", zona: "otro" },
  { iso: "AU", pais: "Australia", codigo: "+61", zona: "otro" },
  { iso: "AT", pais: "Austria", codigo: "+43", zona: "otro" },
  { iso: "BE", pais: "Bélgica", codigo: "+32", zona: "otro" },
  { iso: "CA", pais: "Canadá", codigo: "+1", zona: "otro" },
  { iso: "DK", pais: "Dinamarca", codigo: "+45", zona: "otro" },
  { iso: "ES", pais: "España", codigo: "+34", zona: "otro" },
  { iso: "US", pais: "Estados Unidos", codigo: "+1", zona: "otro" },
  { iso: "FR", pais: "Francia", codigo: "+33", zona: "otro" },
  { iso: "IE", pais: "Irlanda", codigo: "+353", zona: "otro" },
  { iso: "IT", pais: "Italia", codigo: "+39", zona: "otro" },
  { iso: "NO", pais: "Noruega", codigo: "+47", zona: "otro" },
  { iso: "NL", pais: "Países Bajos", codigo: "+31", zona: "otro" },
  { iso: "PT", pais: "Portugal", codigo: "+351", zona: "otro" },
  { iso: "GB", pais: "Reino Unido", codigo: "+44", zona: "otro" },
  { iso: "SE", pais: "Suecia", codigo: "+46", zona: "otro" },
  { iso: "CH", pais: "Suiza", codigo: "+41", zona: "otro" },
];

export const ISO_POR_DEFECTO = "CO";

export function indicativoPorIso(iso: string): Indicativo | undefined {
  return INDICATIVOS.find((i) => i.iso === iso);
}

/**
 * El número completo, listo para guardar y para abrir WhatsApp.
 *
 * Se limpia todo lo que no sea dígito y se le quita el cero de larga distancia
 * nacional que mucha gente antepone por costumbre: con él delante, el enlace
 * `wa.me` no abre ninguna conversación.
 */
export function numeroCompleto(iso: string, numero: string): string {
  const ind = indicativoPorIso(iso);
  const digitos = numero.replace(/\D/g, "").replace(/^0+/, "");
  if (!ind || !digitos) return "";
  return `${ind.codigo} ${digitos}`;
}
