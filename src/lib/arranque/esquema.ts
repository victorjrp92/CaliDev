/**
 * El formulario de arranque de ServiNomic: lo que un cliente nuevo nos cuenta
 * para dejarle la app configurada. Un solo esquema manda sobre todo: las
 * pantallas, la validación (en el navegador y en el servidor) y el avance.
 *
 * Cada sección es de campos sueltos o una lista (equipo, servicios, clientes),
 * y las listas aceptan también un Excel. Los datos de pago (Wompi, cuentas) NO
 * van aquí: se piden al instalar. Los financieros del pasado los da el
 * contador aparte.
 *
 * Los ids de campo son estables: se guardan en la base. Cambiar una etiqueta
 * es libre; cambiar un id deja huérfanas las respuestas viejas.
 */

export type TipoCampo =
  | "texto"
  | "area"
  | "correo"
  | "celular"
  | "documento"
  | "numero"
  | "pesos"
  | "porcentaje"
  | "fecha"
  | "opcion"
  | "opciones";

export type Campo = {
  id: string;
  etiqueta: string;
  tipo: TipoCampo;
  requerido?: boolean;
  opciones?: readonly string[];
  ayuda?: string;
  ejemplo?: string;
  /** Solo se muestra (y solo se exige) si otro campo tiene uno de estos valores. */
  visibleSi?: { campo: string; valores: readonly string[] };
  /** Otros títulos de columna con que puede llegar en un Excel. */
  alias?: readonly string[];
};

export type Seccion = {
  id: string;
  titulo: string;
  /** Lo que se le dice al entrar: por qué lo pedimos. */
  intro: string;
  /** Lo que se le dice al completarla. */
  logro: string;
  tipo: "campos" | "lista";
  campos: readonly Campo[];
  /** Solo listas. */
  item?: { singular: string; plural: string; minimo: number; tituloDe: string };
};

const SI_NO = ["Sí", "No"] as const;
const SI_NO_NOSE = ["Sí", "No", "No sé"] as const;
const FUENTES = ["Instagram", "Facebook", "WhatsApp", "Referidos", "Google", "Volantes", "Otro"] as const;

export const SECCIONES: readonly Seccion[] = [
  {
    id: "negocio",
    titulo: "Tu negocio",
    intro: "Lo básico para crear tu cuenta y saber con quién hablamos.",
    logro: "Ya sabemos quién eres. Tu cuenta empieza a tomar forma.",
    tipo: "campos",
    campos: [
      { id: "nombreNegocio", etiqueta: "Nombre del negocio", tipo: "texto", requerido: true, ayuda: "Como quieres que aparezca en la app." },
      { id: "responsable", etiqueta: "Tu nombre completo", tipo: "texto", requerido: true },
      { id: "correo", etiqueta: "Tu correo", tipo: "correo", requerido: true, ayuda: "Con este entras a la app." },
      { id: "celular", etiqueta: "Tu celular", tipo: "celular", requerido: true },
      { id: "ciudad", etiqueta: "Ciudad donde trabajas", tipo: "texto", requerido: true, ejemplo: "Cali" },
      { id: "zonas", etiqueta: "Zonas o barrios que atiendes", tipo: "area", ejemplo: "Sur de Cali: Ciudad Jardín, Pance, El Ingenio" },
      { id: "fuentes", etiqueta: "¿Cómo te conocen tus clientes?", tipo: "opciones", requerido: true, opciones: FUENTES, ayuda: "Marca todas las que apliquen." },
      { id: "otrosUsuarios", etiqueta: "¿Quién más va a usar la app?", tipo: "area", ayuda: "Nombre y qué hace. Déjalo vacío si solo eres tú.", ejemplo: "Laura Gómez, coordinadora" },
    ],
  },
  {
    id: "operacion",
    titulo: "Cómo trabajas hoy",
    intro: "Para configurar la app a tu manera de trabajar, no al revés.",
    logro: "Ahora entendemos tu día a día. Eso es lo que más nos sirve.",
    tipo: "campos",
    campos: [
      { id: "agenda", etiqueta: "¿Dónde agendas hoy los servicios?", tipo: "opciones", requerido: true, opciones: ["WhatsApp", "Cuaderno", "Excel", "Google Calendar", "Otra app", "Otro"] },
      { id: "personas", etiqueta: "¿Cuántas personas trabajan contigo?", tipo: "numero", requerido: true },
      { id: "serviciosSemana", etiqueta: "¿Cuántos servicios haces a la semana, más o menos?", tipo: "numero", requerido: true },
      { id: "dolor", etiqueta: "¿Qué es lo que más tiempo te quita hoy?", tipo: "area", requerido: true, ejemplo: "Calcular cuánto le pago a cada una el sábado" },
      { id: "meta", etiqueta: "Si el 30 de noviembre todo funciona, ¿qué cambió en tu semana?", tipo: "area", requerido: true },
    ],
  },
  {
    id: "pago",
    titulo: "Cómo le pagas a tu equipo",
    intro: "Con esto la app liquida exactamente como lo haces hoy.",
    logro: "La liquidación ya tiene sus reglas. Vas muy bien.",
    tipo: "campos",
    campos: [
      { id: "modalidad", etiqueta: "¿Cómo calculas lo que le pagas a cada persona?", tipo: "opcion", requerido: true, opciones: ["Por hora trabajada", "Por servicio", "Salario fijo", "Mixto"] },
      { id: "detalleModalidad", etiqueta: "Cuéntanos cómo lo calculas", tipo: "area", requerido: true, visibleSi: { campo: "modalidad", valores: ["Por servicio", "Mixto"] }, ejemplo: "Servicio de 4 horas: $60.000 para ella; si pasa de 4 horas, $15.000 por hora extra" },
      { id: "frecuencia", etiqueta: "¿Cada cuánto pagas?", tipo: "opcion", requerido: true, opciones: ["Semanal", "Quincenal", "Mensual"] },
      { id: "dia", etiqueta: "¿Qué día pagas?", tipo: "opcion", requerido: true, opciones: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo", "Varía"] },
      { id: "medio", etiqueta: "¿Cómo pagas?", tipo: "opciones", requerido: true, opciones: ["Transferencia bancaria", "Nequi", "Daviplata", "Efectivo", "Otro"] },
    ],
  },
  {
    id: "servicios",
    titulo: "Tus servicios",
    intro: "Lo que vendes, cuánto cobras y qué parte queda para el negocio.",
    logro: "Tu catálogo está listo. Con esto la app ya sabe cobrar.",
    tipo: "lista",
    item: { singular: "servicio", plural: "servicios", minimo: 1, tituloDe: "nombre" },
    campos: [
      { id: "nombre", etiqueta: "Nombre del servicio", tipo: "texto", requerido: true, ejemplo: "Limpieza general", alias: ["tipo de servicio", "servicio"] },
      { id: "cobro", etiqueta: "¿Cómo lo cobras?", tipo: "opcion", requerido: true, opciones: ["Por hora", "Por servicio"], alias: ["modalidad"] },
      { id: "valor", etiqueta: "Valor que cobras al cliente", tipo: "pesos", requerido: true, ayuda: "Por hora o por servicio, según lo de arriba.", alias: ["valor por hora", "precio", "valor"] },
      { id: "porcentaje", etiqueta: "% que queda para el negocio", tipo: "porcentaje", requerido: true, ayuda: "El resto es para la persona que hace el servicio.", alias: ["% de la empresa", "porcentaje", "% empresa"] },
      { id: "insumos", etiqueta: "¿Incluye insumos?", tipo: "opcion", requerido: true, opciones: SI_NO, alias: ["insumos incluidos"] },
      { id: "notas", etiqueta: "Notas", tipo: "texto" },
    ],
  },
  {
    id: "equipo",
    titulo: "Tu equipo",
    intro: "Las personas que hacen los servicios. Con su cédula la app les liquida la nómina.",
    logro: "Tu equipo ya está adentro. Ya casi terminas.",
    tipo: "lista",
    item: { singular: "persona", plural: "personas", minimo: 1, tituloDe: "nombre" },
    campos: [
      { id: "nombre", etiqueta: "Nombre completo", tipo: "texto", requerido: true, alias: ["nombre completo"] },
      { id: "documento", etiqueta: "Cédula", tipo: "documento", requerido: true, alias: ["cédula", "cedula", "documento"] },
      { id: "celular", etiqueta: "Celular", tipo: "celular", requerido: true },
      { id: "correo", etiqueta: "Correo", tipo: "correo" },
      { id: "direccion", etiqueta: "Dirección", tipo: "texto" },
      { id: "ingreso", etiqueta: "Fecha de ingreso", tipo: "fecha", alias: ["fecha de ingreso"] },
      { id: "cargo", etiqueta: "Cargo", tipo: "texto", alias: ["nivel", "nivel o cargo"] },
      { id: "exentoPension", etiqueta: "¿Está exenta de pensión?", tipo: "opcion", requerido: true, opciones: SI_NO, ayuda: "Por ejemplo, porque ya está pensionada.", alias: ["exento pensión", "exento pension", "exento pensión (s/n)"] },
      { id: "exentoCaja", etiqueta: "¿Está exenta de caja de compensación?", tipo: "opcion", requerido: true, opciones: SI_NO, alias: ["exento caja", "exento caja (s/n)"] },
    ],
  },
  {
    id: "clientes",
    titulo: "Tus clientes",
    intro: "Para que agendar sea un clic: quién es, dónde queda y cómo llegó.",
    logro: "Tus clientes ya están en su lugar. Solo falta un paso.",
    tipo: "lista",
    item: { singular: "cliente", plural: "clientes", minimo: 1, tituloDe: "nombre" },
    campos: [
      { id: "nombre", etiqueta: "Nombre", tipo: "texto", requerido: true },
      { id: "celular", etiqueta: "Celular", tipo: "celular", requerido: true },
      { id: "fuente", etiqueta: "¿Cómo te conoció?", tipo: "opcion", requerido: true, opciones: FUENTES, alias: ["cómo nos conoció", "como nos conocio", "fuente"] },
      { id: "direccion", etiqueta: "Dirección", tipo: "texto", requerido: true },
      { id: "vivienda", etiqueta: "Tipo de lugar", tipo: "opcion", requerido: true, opciones: ["Casa", "Apartamento", "Oficina o local"], alias: ["casa o apartamento", "tipo"] },
      { id: "conjunto", etiqueta: "Conjunto o edificio", tipo: "texto", requerido: true, visibleSi: { campo: "vivienda", valores: ["Apartamento"] }, alias: ["conjunto o unidad", "unidad"] },
      { id: "apto", etiqueta: "Número de apartamento", tipo: "texto", requerido: true, visibleSi: { campo: "vivienda", valores: ["Apartamento"] }, alias: ["apto", "apto / casa #"] },
      { id: "barrio", etiqueta: "Barrio o zona", tipo: "texto", alias: ["barrio"] },
      { id: "ciudad", etiqueta: "Ciudad", tipo: "texto", requerido: true },
      { id: "correo", etiqueta: "Correo", tipo: "correo" },
      { id: "notas", etiqueta: "Notas", tipo: "texto", ejemplo: "Tiene mascota; la llave está en portería" },
    ],
  },
  {
    id: "impuestos",
    titulo: "Impuestos y obligaciones",
    intro: "Para que la app tenga en cuenta lo que pagas. Si no sabes algo, marca «No sé» y lo vemos con tu contador.",
    logro: "¡Último paso superado! Revisa y envíanos todo.",
    tipo: "campos",
    campos: [
      { id: "seguridadSocial", etiqueta: "¿Pagas seguridad social de tu equipo?", tipo: "opcion", requerido: true, opciones: ["Sí, de todas las personas", "Sí, de algunas", "No"] },
      { id: "comoSS", etiqueta: "¿Cómo la pagas?", tipo: "opcion", requerido: true, opciones: ["Planilla PILA por un operador (Aportes en Línea, SOI, Mi Planilla…)", "La paga mi contador", "Otra forma"], visibleSi: { campo: "seguridadSocial", valores: ["Sí, de todas las personas", "Sí, de algunas"] } },
      { id: "baseSS", etiqueta: "¿Sobre qué valor la liquidas?", tipo: "opcion", requerido: true, opciones: ["Salario mínimo", "Lo que gana cada persona", "Un porcentaje de lo que gana", "No sé"], visibleSi: { campo: "seguridadSocial", valores: ["Sí, de todas las personas", "Sí, de algunas"] } },
      { id: "iva", etiqueta: "¿Eres responsable de IVA?", tipo: "opcion", requerido: true, opciones: SI_NO_NOSE, ayuda: "Si cobras IVA en tus facturas, eres responsable." },
      { id: "regimen", etiqueta: "¿En qué régimen estás?", tipo: "opcion", requerido: true, opciones: ["Régimen Simple de Tributación (SIMPLE)", "Régimen ordinario", "No tengo RUT", "No sé"] },
      { id: "ica", etiqueta: "¿Pagas ICA (industria y comercio)?", tipo: "opcion", requerido: true, opciones: SI_NO_NOSE },
      { id: "municipioIca", etiqueta: "¿En qué municipio pagas ICA?", tipo: "texto", requerido: true, visibleSi: { campo: "ica", valores: ["Sí"] }, ejemplo: "Cali" },
      { id: "retencion", etiqueta: "¿Te practican retención en la fuente o la practicas tú?", tipo: "opcion", requerido: true, opciones: SI_NO_NOSE },
      { id: "factura", etiqueta: "¿Emites factura electrónica?", tipo: "opcion", requerido: true, opciones: SI_NO_NOSE },
      { id: "otros", etiqueta: "¿Pagas algún otro impuesto o aporte?", tipo: "area", ejemplo: "Predial del local, avisos y tableros…" },
      { id: "contador", etiqueta: "¿Tienes contador?", tipo: "opcion", requerido: true, opciones: SI_NO },
      { id: "contadorNombre", etiqueta: "Nombre de tu contador", tipo: "texto", requerido: true, visibleSi: { campo: "contador", valores: ["Sí"] } },
      { id: "contadorCorreo", etiqueta: "Correo de tu contador", tipo: "correo", requerido: true, visibleSi: { campo: "contador", valores: ["Sí"] }, ayuda: "Le pediremos la información financiera de los meses anteriores." },
      { id: "contadorCelular", etiqueta: "Celular de tu contador", tipo: "celular", visibleSi: { campo: "contador", valores: ["Sí"] } },
    ],
  },
];

export type Valores = Record<string, string | string[]>;
export type Respuestas = Record<string, Valores | Valores[]>;
