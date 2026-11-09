/**
 * El formulario de arranque de ServiNomic: lo que un cliente nuevo nos cuenta
 * para dejarle la app configurada. Un solo esquema manda sobre todo: las
 * pantallas, la validación (en el navegador y en el servidor) y el avance.
 * Otros productos tienen su propio esquema (ver `plantillas.ts`).
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
  | "telefono"
  | "documento"
  | "numero"
  | "pesos"
  | "porcentaje"
  | "fecha"
  | "opcion"
  | "opciones"
  /** Archivos que se suben tal cual (plantillas en Word o PDF). */
  | "archivos"
  /** Documentos de ejemplo que se tapan en el navegador antes de subir. */
  | "muestras";

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
  /** Archivos y muestras: cuántos hacen falta como mínimo (por defecto 1 si es requerido). */
  minimo?: number;
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
  item?: {
    singular: string;
    plural: string;
    minimo: number;
    tituloDe: string;
    /** Para la concordancia del contador («2 personas listas» / «2 trámites listos»). */
    femenino?: boolean;
    /**
     * Lista que se arma eligiendo: arriba se marcan de una vez todas las
     * opciones de `campo` (un elemento por opción) y debajo se completa cada
     * una. Sin botón «Agregar». `alElegir`: valores con que nace cada elemento,
     * por opción (por ejemplo, sus documentos ya marcados).
     */
    elegir?: { campo: string; etiqueta: string; ayuda?: string; alElegir?: Readonly<Record<string, Valores>> };
  };
  /** Listas que no tiene sentido llenar desde un Excel. */
  sinExcel?: boolean;
};

const SI_NO = ["Sí", "No"] as const;
const SI_NO_NOSE = ["Sí", "No", "No sé"] as const;
const FUENTES = ["Instagram", "Facebook", "WhatsApp", "Referidos", "Google", "Volantes", "Otro"] as const;
const CIUDADES = ["Cali", "Bogotá", "Medellín", "Barranquilla", "Cartagena", "Bucaramanga", "Pereira", "Otra"] as const;

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
      { id: "correo", etiqueta: "Tu correo", tipo: "correo", requerido: true, ayuda: "Con este entras a la app. La clave la puedes cambiar cuando quieras." },
      { id: "celular", etiqueta: "Tu celular", tipo: "celular", requerido: true },
      { id: "ciudades", etiqueta: "¿En qué ciudades prestas servicios?", tipo: "opciones", requerido: true, opciones: CIUDADES, ayuda: "Marca todas. Con esto la app separa tu equipo y tus servicios por ciudad." },
      { id: "ciudadOtra", etiqueta: "¿Cuál otra?", tipo: "texto", requerido: true, visibleSi: { campo: "ciudades", valores: ["Otra"] }, ejemplo: "Palmira" },
      { id: "fuentes", etiqueta: "¿Cómo te conocen tus clientes?", tipo: "opciones", requerido: true, opciones: FUENTES, ayuda: "Marca todas las que apliquen." },
      { id: "quienMas", etiqueta: "¿Quién más va a entrar a la app?", tipo: "opciones", requerido: true, opciones: ["Solo yo", "Una coordinadora o supervisora", "Mi socio o socia", "Mi contador", "Otra persona"], ayuda: "Sus correos los pedimos en la entrega." },
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
      {
        id: "quitaTiempo",
        etiqueta: "¿Qué es lo que más tiempo te quita hoy?",
        tipo: "opciones",
        requerido: true,
        opciones: ["Calcular lo que le pago a cada persona", "Agendar y cuadrar horarios", "Cobrar a los clientes", "La seguridad social", "Controlar los insumos", "Saber cuánto gana el negocio", "Otro"],
        ayuda: "Por ahí empezamos la capacitación.",
      },
      {
        id: "inventario",
        etiqueta: "¿Qué quieres controlar en el inventario?",
        tipo: "opciones",
        requerido: true,
        opciones: [
          "Insumos: lo que se gasta en el servicio (cloro, jabón, bolsas…)",
          "Herramientas: lo que se presta y se devuelve (escobas, traperos…)",
          "Activos: equipos que se deprecian (aspiradoras, hidrolavadoras…)",
          "Productos que le vendo al cliente",
          "Nada por ahora",
        ],
        ayuda: "Marca todas las que apliquen. El detalle lo cargamos juntos en la entrega.",
      },
    ],
  },
  {
    id: "pago",
    titulo: "Cómo le pagas a tu equipo",
    intro: "Con esto la app liquida exactamente como lo haces hoy.",
    logro: "La liquidación ya tiene sus reglas. Vas muy bien.",
    tipo: "campos",
    campos: [
      { id: "contrato", etiqueta: "¿Qué contrato tiene tu equipo?", tipo: "opcion", requerido: true, opciones: ["Prestación de servicios", "Contrato laboral", "No sé"], ayuda: "Si les pagas por servicio u hora, sin contrato de trabajo, es prestación de servicios." },
      { id: "jornada", etiqueta: "¿Qué jornada tienen?", tipo: "opcion", requerido: true, opciones: ["Tiempo completo", "Tiempo parcial"], visibleSi: { campo: "contrato", valores: ["Contrato laboral"] } },
      { id: "modalidad", etiqueta: "¿Cómo calculas lo que le pagas a cada persona?", tipo: "opcion", requerido: true, opciones: ["Un porcentaje de lo que paga el cliente", "Por hora trabajada", "Por servicio", "Salario fijo", "Mixto"] },
      { id: "detalleModalidad", etiqueta: "Cuéntanos cómo lo calculas", tipo: "area", visibleSi: { campo: "modalidad", valores: ["Por servicio", "Mixto"] }, ejemplo: "Servicio de 4 horas: $60.000 para ella; si pasa de 4 horas, $15.000 por hora extra" },
      { id: "frecuencia", etiqueta: "¿Cada cuánto pagas?", tipo: "opcion", requerido: true, opciones: ["Semanal", "Quincenal", "Mensual"] },
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
      { id: "valor", etiqueta: "Valor que cobras al cliente, sin IVA", tipo: "pesos", requerido: true, ayuda: "Por hora o por servicio, según lo de arriba, y de una persona si van varias. Si cobras IVA, la app lo suma.", alias: ["valor por hora", "precio", "valor"] },
      { id: "porcentaje", etiqueta: "% que queda para el negocio", tipo: "porcentaje", requerido: true, ayuda: "El resto es para la persona que hace el servicio.", alias: ["% de la empresa", "porcentaje", "% empresa"] },
      { id: "insumos", etiqueta: "¿Incluye insumos?", tipo: "opcion", requerido: true, opciones: SI_NO, alias: ["insumos incluidos"] },
      { id: "minPersonas", etiqueta: "¿Cuántas personas van como mínimo?", tipo: "opcion", opciones: ["1", "2", "3", "4"], alias: ["mínimo de personas", "personas"] },
      { id: "minHoras", etiqueta: "Horas mínimas que vendes", tipo: "numero", ejemplo: "4", alias: ["mínimo de horas", "horas mínimas"] },
      { id: "notas", etiqueta: "Notas", tipo: "texto" },
    ],
  },
  {
    id: "equipo",
    titulo: "Tu equipo",
    intro: "Las personas que hacen los servicios. Con su cédula la app les liquida la nómina.",
    logro: "Tu equipo ya está adentro. Ya casi terminas.",
    tipo: "lista",
    item: { singular: "persona", plural: "personas", minimo: 1, tituloDe: "nombre", femenino: true },
    campos: [
      { id: "nombre", etiqueta: "Nombre completo", tipo: "texto", requerido: true, alias: ["nombre completo"] },
      { id: "documento", etiqueta: "Cédula", tipo: "documento", requerido: true, alias: ["cédula", "cedula", "documento"] },
      { id: "celular", etiqueta: "Celular", tipo: "celular", requerido: true },
      { id: "correo", etiqueta: "Correo", tipo: "correo" },
      { id: "ciudadPersona", etiqueta: "Ciudad donde trabaja", tipo: "opcion", opciones: CIUDADES, ayuda: "Solo si trabajas en más de una ciudad.", alias: ["ciudad"] },
      { id: "ingreso", etiqueta: "Fecha de ingreso", tipo: "fecha", alias: ["fecha de ingreso"] },
      { id: "exentoPension", etiqueta: "¿Está exenta de pensión?", tipo: "opcion", opciones: SI_NO, ayuda: "Por ejemplo, porque ya está pensionada.", alias: ["exento pensión", "exento pension", "exento pensión (s/n)"] },
      { id: "exentoCaja", etiqueta: "¿Está exenta de caja de compensación?", tipo: "opcion", opciones: SI_NO, alias: ["exento caja", "exento caja (s/n)"] },
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
      { id: "fuente", etiqueta: "¿Cómo te conoció?", tipo: "opcion", opciones: FUENTES, alias: ["cómo nos conoció", "como nos conocio", "fuente"] },
      { id: "direccion", etiqueta: "Dirección", tipo: "texto", requerido: true },
      { id: "vivienda", etiqueta: "Tipo de lugar", tipo: "opcion", opciones: ["Casa", "Apartamento", "Oficina o local"], alias: ["casa o apartamento", "tipo"] },
      { id: "conjunto", etiqueta: "Conjunto o edificio", tipo: "texto", visibleSi: { campo: "vivienda", valores: ["Apartamento"] }, alias: ["conjunto o unidad", "unidad"] },
      { id: "apto", etiqueta: "Número de apartamento", tipo: "texto", visibleSi: { campo: "vivienda", valores: ["Apartamento"] }, alias: ["apto", "apto / casa #"] },
      { id: "barrio", etiqueta: "Barrio o zona", tipo: "texto", alias: ["barrio"] },
      { id: "ciudad", etiqueta: "Ciudad", tipo: "texto", ayuda: "Solo si trabajas en más de una ciudad." },
      { id: "correo", etiqueta: "Correo", tipo: "correo" },
      { id: "notas", etiqueta: "Notas", tipo: "texto", ejemplo: "Tiene mascota; la llave está en portería" },
    ],
  },
  {
    id: "impuestos",
    titulo: "Impuestos y obligaciones",
    intro: "Para que la app aparte lo que te toca pagar. Si no sabes algo, marca «No sé» y lo vemos con tu contador.",
    logro: "¡Último paso superado! Revisa y envíanos todo.",
    tipo: "campos",
    campos: [
      { id: "seguridadSocial", etiqueta: "¿Pagas seguridad social de tu equipo?", tipo: "opcion", requerido: true, opciones: ["Sí, de todas las personas", "Sí, de algunas", "No"] },
      { id: "baseSS", etiqueta: "¿Sobre qué valor la liquidas?", tipo: "opcion", requerido: true, opciones: ["Salario mínimo", "Lo que gana cada persona", "Un porcentaje de lo que gana", "No sé"], visibleSi: { campo: "seguridadSocial", valores: ["Sí, de todas las personas", "Sí, de algunas"] } },
      { id: "iva", etiqueta: "¿Eres responsable de IVA?", tipo: "opcion", requerido: true, opciones: SI_NO_NOSE, ayuda: "Si cobras IVA en tus facturas, eres responsable." },
      { id: "ica", etiqueta: "¿Pagas ICA (industria y comercio)?", tipo: "opcion", requerido: true, opciones: SI_NO_NOSE },
      { id: "contador", etiqueta: "¿Tienes contador?", tipo: "opcion", requerido: true, opciones: SI_NO },
      { id: "contadorNombre", etiqueta: "Nombre de tu contador", tipo: "texto", visibleSi: { campo: "contador", valores: ["Sí"] } },
      { id: "contadorCorreo", etiqueta: "Correo de tu contador", tipo: "correo", requerido: true, visibleSi: { campo: "contador", valores: ["Sí"] }, ayuda: "Le pediremos la información financiera de los meses anteriores." },
      { id: "contadorCelular", etiqueta: "Celular de tu contador", tipo: "celular", visibleSi: { campo: "contador", valores: ["Sí"] } },
    ],
  },
];

export type Valores = Record<string, string | string[]>;
export type Respuestas = Record<string, Valores | Valores[]>;

/**
 * Preguntas que ServiNomic quitó al simplificar el arranque (nov 2026): la app
 * no las usa o se ven en la entrega. Lo que un cliente ya respondió sigue a la
 * vista en el panel con este nombre.
 */
export const ANTERIORES_SERVINOMIC: Readonly<Record<string, string>> = {
  "negocio.ciudad": "Ciudad donde trabajas",
  "negocio.zonas": "Zonas o barrios que atiendes",
  "negocio.otrosUsuarios": "¿Quién más va a usar la app?",
  "operacion.personas": "¿Cuántas personas trabajan contigo?",
  "operacion.serviciosSemana": "¿Cuántos servicios haces a la semana?",
  "operacion.dolor": "¿Qué es lo que más tiempo te quita hoy?",
  "operacion.meta": "¿Qué cambió en tu semana si todo funciona?",
  "pago.dia": "¿Qué día pagas?",
  "equipo.direccion": "Dirección",
  "equipo.cargo": "Cargo",
  "impuestos.comoSS": "¿Cómo pagas la seguridad social?",
  "impuestos.regimen": "¿En qué régimen estás?",
  "impuestos.municipioIca": "¿En qué municipio pagas ICA?",
  "impuestos.retencion": "¿Retención en la fuente?",
  "impuestos.factura": "¿Emites factura electrónica?",
  "impuestos.otros": "¿Otro impuesto o aporte?",
};
