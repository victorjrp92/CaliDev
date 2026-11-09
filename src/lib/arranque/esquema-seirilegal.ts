import type { Seccion } from "@/lib/arranque/esquema";

/**
 * El formulario de arranque de SeiriLegal: lo que un despacho de extranjería
 * nos cuenta para dejarle la app configurada a su forma de trabajar.
 *
 * Solo se pregunta lo que únicamente el despacho sabe y hace falta para la
 * entrega (Victor, 8 nov 2026: «convertiste el arranque en una tortura»). Lo
 * que se deduce de sus documentos, de la ley o de un valor que luego cambia en
 * la app, no se pregunta. Se quitaron «Familias y cobros» (casi todo), las
 * plantillas, los documentos de ejemplo y la llamada: lo que ya se respondió
 * ahí sigue guardado y el panel lo muestra aparte.
 *
 * Mismas reglas que el de ServiNomic: los ids son estables, y el texto de una
 * opción tampoco se cambia una vez respondida (la respuesta vieja deja de
 * valer y la sección no se completa nunca).
 */
const SI_NO = ["Sí", "No"] as const;

export const TRAMITES = [
  "Arraigo sociolaboral",
  "Arraigo socioformativo",
  "Arraigo social",
  "Arraigo familiar",
  "Arraigo de segunda oportunidad",
  "Circunstancias excepcionales (razones humanitarias, víctimas…)",
  "Reagrupación familiar",
  "Familiar de ciudadano español o de la UE",
  "Nacionalidad por residencia",
  "Renovación de residencia",
  "Modificación de residencia",
  "Regularización 2026: paso a autorización ordinaria",
  "Residencia de larga duración",
  "Estancia por estudios",
  "Residencia no lucrativa",
  "Nómada digital o Unidad de Grandes Empresas",
  "Protección internacional (asilo)",
  "Recurso administrativo",
  "Recurso contencioso",
  "Otro",
] as const;

/**
 * Tipos de documento de ejemplo y qué hay que tapar en cada uno. El formulario
 * ya no pide ejemplos (8 nov 2026), pero el campo «muestras» sigue disponible.
 */
export const TIPOS_MUESTRA: readonly { tipo: string; tapar: string }[] = [
  { tipo: "Pasaporte", tapar: "nombre, número, fechas, foto, firma y las dos líneas de letras de abajo" },
  { tipo: "NIE o TIE", tapar: "nombre, NIE, fechas, foto, firma y dirección" },
  { tipo: "Antecedentes penales", tapar: "nombre, número de documento, fechas de nacimiento y códigos de verificación" },
  { tipo: "Empadronamiento", tapar: "nombres, documentos, fechas de nacimiento y dirección" },
  { tipo: "Nacimiento o matrimonio", tapar: "nombres, documentos, fechas y lugares de nacimiento" },
  { tipo: "Contrato o matrícula", tapar: "nombres, documentos, firmas y dirección" },
  { tipo: "Requerimiento", tapar: "nombre, NIE, número de expediente y dirección" },
  { tipo: "Resolución", tapar: "nombre, NIE, número de expediente y dirección" },
  { tipo: "Citación", tapar: "nombre, NIE, número de expediente y código de la cita" },
  { tipo: "Otro", tapar: "todo dato que identifique a una persona" },
];

/**
 * Documentos habituales de cada trámite, para marcar en vez de escribir
 * (Victor, 2 nov 2026: «la gente no quiere escribir tanto»). Orientativos:
 * la abogada marca los que pide y añade los suyos en «¿Algún documento más?».
 */
const OTRO_DOC = "Otro (escríbelo abajo)";
const BASE = ["Pasaporte completo", "Empadronamiento", "Antecedentes penales del país de origen (apostillados y traducidos)"];
export const DOCUMENTOS_POR_TRAMITE: Record<(typeof TRAMITES)[number], readonly string[]> = {
  "Arraigo sociolaboral": [...BASE, "Contrato de trabajo firmado", "Documentación de la empresa (CIF, alta en la Seguridad Social)", "Formulario EX y tasa 790-052"],
  "Arraigo socioformativo": [...BASE, "Matrícula en la formación", "Formulario EX y tasa 790-052"],
  "Arraigo social": [...BASE, "Informe de inserción social", "Prueba de medios económicos", "Formulario EX y tasa 790-052"],
  "Arraigo familiar": [...BASE, "Certificado de nacimiento o matrimonio (vínculo)", "DNI o TIE del familiar", "Formulario EX y tasa 790-052"],
  "Arraigo de segunda oportunidad": [...BASE, "TIE anterior", "Formulario EX y tasa 790-052"],
  "Circunstancias excepcionales (razones humanitarias, víctimas…)": ["Pasaporte completo", "Empadronamiento", "Documento que acredita la circunstancia (resolución, informe, denuncia…)"],
  "Reagrupación familiar": ["Pasaporte del familiar", "TIE del reagrupante", "Certificado de matrimonio o nacimiento", "Nóminas, contrato o medios económicos", "Informe de vivienda adecuada", "Seguro médico", "Formulario EX-02 y tasa"],
  "Familiar de ciudadano español o de la UE": ["Pasaporte completo", "DNI o certificado UE del familiar", "Certificado de matrimonio, pareja o nacimiento", "Empadronamiento", "Medios económicos o seguro médico", "Formulario EX-19 y tasa"],
  "Nacionalidad por residencia": ["Examen CCSE y DELE (o título de la ESO)", "Pasaporte completo", "TIE en vigor (ambas caras)", "Antecedentes penales apostillados", "Certificado de nacimiento apostillado", "Certificado de matrimonio (si procede)", "Nacimiento de los hijos menores (si procede)", "Pruebas de integración (cursos, trabajo, carnet…)"],
  "Renovación de residencia": ["Pasaporte completo", "TIE (ambas caras)", "Certificado de empadronamiento", "Contrato de trabajo", "Vida laboral", "Formulario EX y tasas"],
  // Los dos siguientes, como en el catálogo de LEGAL ESTATUS: lo propio de cada caso lo concreta la abogada.
  "Modificación de residencia": ["Pasaporte completo", "TIE actual", "Documentación de la nueva situación"],
  // La autorización de la regularización (RD 316/2026) dura un año y no se renueva: pasa a una figura ordinaria.
  "Regularización 2026: paso a autorización ordinaria": ["Pasaporte completo", "TIE de la regularización", "Documentación de la nueva autorización"],
  "Residencia de larga duración": ["Pasaporte completo", "TIE (ambas caras)", "Vida laboral", "Medios económicos", "Seguro médico (si no cotiza)", "Formulario EX-11 y tasa"],
  "Estancia por estudios": ["Pasaporte completo", "Matrícula o carta de admisión", "Seguro médico", "Medios económicos", "Formulario EX-00 y tasa"],
  "Residencia no lucrativa": ["Pasaporte completo", "Medios económicos", "Seguro médico privado", "Antecedentes penales", "Certificado médico", "Formulario EX-01 y tasa"],
  "Nómada digital o Unidad de Grandes Empresas": ["Pasaporte completo", "Contrato o relación con la empresa", "Títulos o experiencia", "Medios económicos", "Seguro médico", "Antecedentes penales", "Tasa"],
  "Protección internacional (asilo)": ["Pasaporte (si lo tiene)", "Relato y pruebas de la persecución", "Empadronamiento", "Resguardo de la manifestación de voluntad"],
  "Recurso administrativo": ["Resolución que se recurre", "Documentos o pruebas nuevas", "Autorización de representación"],
  "Recurso contencioso": ["Resolución denegatoria", "Poder para pleitos", "Expediente administrativo", "Pruebas", "Justicia gratuita (si procede)"],
  Otro: [],
};

const slug = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const CON_DOCUMENTOS = TRAMITES.filter((t) => DOCUMENTOS_POR_TRAMITE[t].length);

/** Una casilla de documentos por trámite: solo aparece la del trámite elegido. */
const CASILLAS_DOCUMENTOS = CON_DOCUMENTOS.map((t) => ({
  id: `docs-${slug(t)}`,
  etiqueta: "¿Qué documentos le pides al cliente?",
  tipo: "opciones" as const,
  opciones: [...DOCUMENTOS_POR_TRAMITE[t], OTRO_DOC],
  ayuda: "Deja marcados solo los que pides. Si falta alguno, escríbelo abajo.",
  visibleSi: { campo: "tramite", valores: [t] },
}));

/**
 * Cada trámite nace con sus documentos habituales ya marcados: la abogada solo
 * quita los que no pide (Victor, 9 nov 2026: elegir uno, llenarlo todo y
 * agregar el siguiente «no es intuitivo»). El formulario y la tasa los prepara
 * el despacho, no los trae el cliente: siguen en la lista, pero sin marcar.
 */
const DOCUMENTOS_YA_MARCADOS = Object.fromEntries(
  CON_DOCUMENTOS.map((t) => [t, { [`docs-${slug(t)}`]: DOCUMENTOS_POR_TRAMITE[t].filter((d) => !d.startsWith("Formulario")) }]),
);

export const SECCIONES_SEIRILEGAL: readonly Seccion[] = [
  {
    id: "despacho",
    titulo: "Tu despacho",
    intro: "Lo básico para crear tu cuenta y saber con quién hablamos.",
    logro: "Tu despacho ya tiene su cuenta en camino. Buen comienzo.",
    tipo: "campos",
    campos: [
      { id: "nombreDespacho", etiqueta: "Nombre del despacho", tipo: "texto", requerido: true, ayuda: "Como quieres que aparezca en la app." },
      { id: "responsable", etiqueta: "Tu nombre completo", tipo: "texto", requerido: true },
      { id: "correo", etiqueta: "Tu correo", tipo: "correo", requerido: true, ayuda: "Con este entras a la app." },
      { id: "telefono", etiqueta: "Tu teléfono", tipo: "telefono", requerido: true, ejemplo: "+34 600 000 000" },
      { id: "municipio", etiqueta: "Municipio del despacho", tipo: "texto", requerido: true, ayuda: "Lo usamos para los festivos locales en el cálculo de plazos.", ejemplo: "Basauri" },
      {
        id: "oficinas",
        etiqueta: "¿En qué oficinas de extranjería presentas?",
        tipo: "opciones",
        requerido: true,
        opciones: ["Bizkaia", "Gipuzkoa", "Araba", "En toda España", "Otra provincia"],
        ayuda: "Marca todas las que apliquen. Si presentas en cualquier provincia, marca «En toda España» y no hace falta escribir ninguna.",
      },
      { id: "otrasOficinas", etiqueta: "¿Cuáles otras?", tipo: "texto", visibleSi: { campo: "oficinas", valores: ["Otra provincia"] }, ejemplo: "Cantabria, Madrid" },
    ],
  },
  {
    id: "usuarios",
    titulo: "Quién usará SeiriLegal",
    intro: "Cada persona entra con su propio usuario. Así queda registrado quién hizo qué en cada expediente.",
    logro: "Tu equipo ya tiene sus accesos. Vas bien.",
    tipo: "lista",
    sinExcel: true,
    item: { singular: "persona", plural: "personas", minimo: 1, tituloDe: "nombre", femenino: true },
    campos: [
      { id: "nombre", etiqueta: "Nombre completo", tipo: "texto", requerido: true },
      { id: "correo", etiqueta: "Correo", tipo: "correo", requerido: true },
      { id: "funcion", etiqueta: "¿Qué hace en el despacho?", tipo: "opcion", requerido: true, opciones: ["Abogada o abogado", "Asistente", "Administración", "Otra"] },
      { id: "economia", etiqueta: "¿Puede ver la parte económica (honorarios, cobros, finanzas)?", tipo: "opcion", requerido: true, opciones: SI_NO },
    ],
  },
  {
    id: "tramites",
    titulo: "Tus trámites",
    intro: "Marca todos los trámites que llevas. Debajo aparece cada uno con sus documentos habituales ya marcados: quita los que no pidas e indica cuántos llevas al mes.",
    logro: "Tus trámites ya tienen su lista de documentos. Es la parte que más nos sirve.",
    tipo: "lista",
    sinExcel: true,
    item: {
      singular: "trámite",
      plural: "trámites",
      minimo: 1,
      tituloDe: "tramite",
      elegir: { campo: "tramite", etiqueta: "¿Qué trámites llevas?", ayuda: "Marca todos los que apliquen.", alElegir: DOCUMENTOS_YA_MARCADOS },
    },
    // «Formulario y tasa» se quitó el 9 nov 2026: los fija la norma para cada trámite.
    campos: [
      { id: "tramite", etiqueta: "Trámite", tipo: "opcion", requerido: true, opciones: TRAMITES },
      { id: "otroTramite", etiqueta: "¿Cuál?", tipo: "texto", requerido: true, visibleSi: { campo: "tramite", valores: ["Otro"] } },
      { id: "volumen", etiqueta: "¿Cuántos llevas al mes, más o menos?", tipo: "opcion", requerido: true, opciones: ["1 o 2", "De 3 a 5", "De 6 a 10", "Más de 10"] },
      ...CASILLAS_DOCUMENTOS,
      { id: "documentos", etiqueta: "¿Algún documento más?", tipo: "area", ayuda: "Solo los que no estén en la lista de arriba, uno por línea.", ejemplo: "Abono de transporte personalizado" },
      { id: "honorarios", etiqueta: "Tus honorarios habituales", tipo: "texto", ejemplo: "230 € con IVA" },
      { id: "particular", etiqueta: "¿Tu oficina pide algo distinto a la norma?", tipo: "area", ayuda: "Si no se te ocurre nada, déjalo en blanco: lo vemos en la entrega." },
    ],
  },
  {
    id: "trabajo",
    titulo: "Cómo trabajas hoy",
    intro: "Solo casillas: menos de un minuto.",
    logro: "Ya entendemos tu día a día. Queda un paso.",
    tipo: "campos",
    campos: [
      {
        id: "dondeHoy",
        etiqueta: "¿Dónde apuntas hoy tus casos?",
        tipo: "opciones",
        requerido: true,
        opciones: ["Excel o Google Sheets", "Google Drive", "Word", "Carpetas en el ordenador", "Papel o libreta", "WhatsApp", "Otro programa"],
      },
      { id: "programa", etiqueta: "¿Qué programa?", tipo: "texto", visibleSi: { campo: "dondeHoy", valores: ["Otro programa"] } },
      // «Sí, siempre» es el texto con que se respondió el 31-oct: no se toca (ver arriba).
      { id: "mercurio", etiqueta: "¿Presentas las solicitudes por internet (plataforma Mercurio)?", tipo: "opcion", requerido: true, opciones: ["Sí, siempre", "A veces", "No, en persona", "No sé qué es"] },
      { id: "contencioso", etiqueta: "¿Llevas recursos ante el juzgado (contencioso)?", tipo: "opcion", requerido: true, opciones: SI_NO },
      { id: "lexnet", etiqueta: "¿Recibes notificaciones por LexNET?", tipo: "opcion", requerido: true, opciones: SI_NO, visibleSi: { campo: "contencioso", valores: ["Sí"] } },
      { id: "urgentes", etiqueta: "¿Llevas casos urgentes, como expulsiones o internamientos (CIE)?", tipo: "opcion", requerido: true, opciones: ["Sí", "A veces", "No"] },
      { id: "canales", etiqueta: "¿Cómo te mandan los documentos tus clientes?", tipo: "opciones", requerido: true, opciones: ["WhatsApp", "Correo", "En persona", "Otro"] },
      {
        id: "idiomas",
        etiqueta: "¿En qué idiomas te escriben tus clientes?",
        tipo: "opciones",
        requerido: true,
        opciones: ["Español", "Inglés", "Francés", "Árabe", "Portugués", "Ucraniano", "Ruso", "Chino", "Urdu", "Otro"],
      },
    ],
  },
  {
    // Lo único que falta para cargar lo que ya lleva: un toque por pregunta. Cobro,
    // familias y contratos no se preguntan: ya los sabemos por su contrato y por
    // los modelos que envió (9 nov 2026). Notificaciones, firma y carpetas, a
    // partir de la investigación sobre despachos de extranjería (Victor, 9 nov).
    id: "cierre",
    titulo: "Para terminar",
    intro: "Cuatro preguntas, un toque cada una. Lo que no tengas claro lo vemos el día de la entrega.",
    logro: "Ya tenemos lo necesario para configurar SeiriLegal.",
    tipo: "campos",
    campos: [
      { id: "abiertos", etiqueta: "¿Cuántos expedientes tienes abiertos ahora, más o menos?", tipo: "opcion", requerido: true, opciones: ["Menos de 30", "Entre 30 y 100", "Más de 100"] },
      {
        id: "traspaso",
        etiqueta: "¿Cómo pasamos esos expedientes a SeiriLegal?",
        tipo: "opcion",
        requerido: true,
        opciones: [
          "Puedo enviar un Excel o una exportación",
          "Están en Google Drive: puedo compartir la carpeta",
          "En papel o en carpetas del ordenador",
          "Mejor los cargamos juntos el día de la entrega",
        ],
      },
      {
        id: "carpetas",
        etiqueta: "¿Cómo están organizadas esas carpetas?",
        tipo: "opcion",
        requerido: true,
        opciones: ["Una por cliente", "Una por familia", "Una por trámite", "Sin un orden fijo"],
        visibleSi: { campo: "traspaso", valores: ["Están en Google Drive: puedo compartir la carpeta"] },
      },
      {
        id: "notificaciones",
        etiqueta: "¿A quién le llegan las notificaciones de extranjería?",
        ayuda: "Las de la sede electrónica o la DEHú.",
        tipo: "opcion",
        requerido: true,
        opciones: ["Al despacho", "Al cliente", "A los dos"],
      },
      {
        id: "firma",
        etiqueta: "¿Cómo firma el cliente la hoja de encargo y la designación de representante?",
        tipo: "opcion",
        requerido: true,
        opciones: ["En papel, y se escanea", "Con firma electrónica", "De las dos formas"],
      },
    ],
  },
];

/**
 * Nombres de lo que se quitó del formulario el 8 nov 2026, para que el panel
 * muestre con su pregunta original lo que ya se había respondido ahí.
 */
export const ANTERIORES_SEIRILEGAL: Readonly<Record<string, string>> = {
  clientesCobros: "Familias y cobros",
  plantillas: "Tus plantillas",
  "plantillas.usaPlantillas": "¿Usas plantillas propias?",
  "plantillas.archivos": "Plantillas subidas",
  "plantillas.faltan": "¿Alguna que hagas a mano?",
  muestras: "Documentos de ejemplo",
  llamada: "La llamada",
  tramites: "Tus trámites",
  "tramites.formulario": "Formulario y tasa",
  trabajo: "Cómo trabajas hoy",
  "trabajo.mismoCorreo": "¿Los avisos de la Administración te llegan a tu correo?",
  "trabajo.correoDocs": "¿A qué correo?",
  "trabajo.datosCliente": "¿Qué datos le pides a un cliente nuevo?",
  "trabajo.dolor": "¿Qué es lo que más tiempo te quita hoy?",
  "trabajo.dolorOtro": "¿Cuál?",
};
