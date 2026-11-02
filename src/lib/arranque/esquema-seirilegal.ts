import type { Seccion } from "@/lib/arranque/esquema";

/**
 * El formulario de arranque de SeiriLegal: lo que un despacho de extranjería
 * nos cuenta para dejarle la app configurada a su forma de trabajar.
 *
 * Los documentos de ejemplo NO llegan como son: la abogada tapa los datos de
 * sus clientes en su propio navegador y solo se sube la versión tapada.
 * Sirven para conocer qué documentos llegan, en qué formato y con qué calidad;
 * la prueba de lectura con datos reales se hace después, dentro de SeiriLegal.
 *
 * Mismas reglas que el de ServiNomic: los ids son estables.
 */
const SI_NO = ["Sí", "No"] as const;

export const TRAMITES = [
  "Arraigo sociolaboral",
  "Arraigo socioformativo",
  "Arraigo social",
  "Arraigo familiar",
  "Arraigo de segunda oportunidad",
  "Reagrupación familiar",
  "Familiar de ciudadano español o de la UE",
  "Nacionalidad por residencia",
  "Renovación de residencia",
  "Residencia de larga duración",
  "Estancia por estudios",
  "Residencia no lucrativa",
  "Nómada digital o Unidad de Grandes Empresas",
  "Protección internacional (asilo)",
  "Recurso administrativo",
  "Recurso contencioso",
  "Otro",
] as const;

/** Tipos de documento que pedimos de ejemplo, y qué hay que tapar en cada uno. */
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
  "Reagrupación familiar": ["Pasaporte del familiar", "TIE del reagrupante", "Certificado de matrimonio o nacimiento", "Nóminas, contrato o medios económicos", "Informe de vivienda adecuada", "Seguro médico", "Formulario EX-02 y tasa"],
  "Familiar de ciudadano español o de la UE": ["Pasaporte completo", "DNI o certificado UE del familiar", "Certificado de matrimonio, pareja o nacimiento", "Empadronamiento", "Medios económicos o seguro médico", "Formulario EX-19 y tasa"],
  "Nacionalidad por residencia": ["Examen CCSE y DELE (o título de la ESO)", "Pasaporte completo", "TIE en vigor (ambas caras)", "Antecedentes penales apostillados", "Certificado de nacimiento apostillado", "Certificado de matrimonio (si procede)", "Nacimiento de los hijos menores (si procede)", "Pruebas de integración (cursos, trabajo, carnet…)"],
  "Renovación de residencia": ["Pasaporte completo", "TIE (ambas caras)", "Certificado de empadronamiento", "Contrato de trabajo", "Vida laboral", "Formulario EX y tasas"],
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

/** Una casilla de documentos por trámite: solo aparece la del trámite elegido. */
const CASILLAS_DOCUMENTOS = TRAMITES.filter((t) => DOCUMENTOS_POR_TRAMITE[t].length).map((t) => ({
  id: `docs-${slug(t)}`,
  etiqueta: "¿Qué documentos le pides al cliente?",
  tipo: "opciones" as const,
  opciones: [...DOCUMENTOS_POR_TRAMITE[t], OTRO_DOC],
  ayuda: "Marca los que pides. Si falta alguno, escríbelo abajo.",
  visibleSi: { campo: "tramite", valores: [t] },
}));

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
      { id: "otrasOficinas", etiqueta: "¿Cuáles otras?", tipo: "texto", requerido: true, visibleSi: { campo: "oficinas", valores: ["Otra provincia"] }, ejemplo: "Cantabria, Madrid" },
    ],
  },
  {
    id: "usuarios",
    titulo: "Quién usará SeiriLegal",
    intro: "Cada persona entra con su propio usuario. Así queda registrado quién hizo qué en cada expediente.",
    logro: "Tu equipo ya tiene sus accesos. Vas bien.",
    tipo: "lista",
    sinExcel: true,
    item: { singular: "persona", plural: "personas", minimo: 1, tituloDe: "nombre" },
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
    intro: "Los trámites que más llevas (con 3 o 4 basta). Por cada uno, marca los documentos que pides: así armamos la lista de cada expediente.",
    logro: "Tus trámites ya tienen su lista de documentos. Es la parte que más nos sirve.",
    tipo: "lista",
    sinExcel: true,
    item: { singular: "trámite", plural: "trámites", minimo: 1, tituloDe: "tramite" },
    campos: [
      { id: "tramite", etiqueta: "Trámite", tipo: "opcion", requerido: true, opciones: TRAMITES },
      { id: "otroTramite", etiqueta: "¿Cuál?", tipo: "texto", requerido: true, visibleSi: { campo: "tramite", valores: ["Otro"] } },
      { id: "volumen", etiqueta: "¿Cuántos llevas al mes, más o menos?", tipo: "opcion", requerido: true, opciones: ["1 o 2", "De 3 a 5", "De 6 a 10", "Más de 10"] },
      ...CASILLAS_DOCUMENTOS,
      { id: "documentos", etiqueta: "¿Algún documento más?", tipo: "area", ayuda: "Solo los que no estén en la lista de arriba, uno por línea.", ejemplo: "Abono de transporte personalizado" },
      { id: "honorarios", etiqueta: "Tus honorarios habituales", tipo: "texto", ejemplo: "230 € con IVA" },
      { id: "particular", etiqueta: "¿Tu oficina pide algo distinto a la norma?", tipo: "area", ayuda: "Si no se te ocurre nada, déjalo en blanco: lo vemos en la llamada." },
      { id: "formulario", etiqueta: "Formulario y tasa", tipo: "texto", ejemplo: "EX-10 y tasa 790-052" },
    ],
  },
  {
    id: "trabajo",
    titulo: "Cómo trabajas hoy",
    intro: "Marca lo que corresponda. Son casi todo casillas: unos 2 minutos.",
    logro: "Ya entendemos tu día a día. Ya pasaste la mitad.",
    tipo: "campos",
    campos: [
      {
        id: "dondeHoy",
        etiqueta: "¿Dónde apuntas hoy tus casos?",
        tipo: "opciones",
        requerido: true,
        opciones: ["Excel o Google Sheets", "Word", "Carpetas en el ordenador", "Papel o libreta", "WhatsApp", "Otro programa"],
      },
      { id: "programa", etiqueta: "¿Qué programa?", tipo: "texto", requerido: true, visibleSi: { campo: "dondeHoy", valores: ["Otro programa"] } },
      { id: "mercurio", etiqueta: "¿Presentas las solicitudes por internet (plataforma Mercurio)?", tipo: "opcion", requerido: true, opciones: ["Sí, casi siempre", "A veces", "No, en persona", "No sé qué es"] },
      { id: "contencioso", etiqueta: "¿Llevas recursos ante el juzgado (contencioso)?", tipo: "opcion", requerido: true, opciones: SI_NO },
      { id: "lexnet", etiqueta: "¿Recibes notificaciones por LexNET?", tipo: "opcion", requerido: true, opciones: SI_NO, visibleSi: { campo: "contencioso", valores: ["Sí"] } },
      { id: "urgentes", etiqueta: "¿Llevas casos urgentes, como expulsiones o internamientos (CIE)?", tipo: "opcion", requerido: true, opciones: ["Sí", "A veces", "No"] },
      { id: "canales", etiqueta: "¿Cómo te mandan los documentos tus clientes?", tipo: "opciones", requerido: true, opciones: ["WhatsApp", "Correo", "En persona", "Otro"] },
      { id: "mismoCorreo", etiqueta: "¿Los documentos y los avisos de la Administración te llegan a tu correo de arriba?", tipo: "opcion", requerido: true, opciones: ["Sí, al mismo", "No, a otro correo"] },
      { id: "correoDocs", etiqueta: "¿A qué correo?", tipo: "correo", requerido: true, visibleSi: { campo: "mismoCorreo", valores: ["No, a otro correo"] } },
      {
        id: "idiomas",
        etiqueta: "¿En qué idiomas te escriben tus clientes?",
        tipo: "opciones",
        requerido: true,
        opciones: ["Español", "Inglés", "Francés", "Árabe", "Portugués", "Ucraniano", "Ruso", "Chino", "Urdu", "Otro"],
      },
      {
        id: "datosCliente",
        etiqueta: "¿Qué datos le pides a un cliente nuevo?",
        tipo: "opciones",
        requerido: true,
        opciones: ["Nombre y apellidos", "NIE o pasaporte", "Nacionalidad", "Fecha de nacimiento", "Teléfono", "Correo", "Dirección", "Estado civil", "Profesión", "Nombre de los padres"],
      },
      {
        id: "dolor",
        etiqueta: "¿Qué es lo que más tiempo te quita hoy?",
        tipo: "opciones",
        requerido: true,
        opciones: [
          "Pedir y perseguir los papeles a los clientes",
          "Controlar plazos y fechas",
          "Rellenar formularios y tasas",
          "Cobrar las cuotas",
          "Contestar mensajes de WhatsApp",
          "Buscar los papeles de un cliente",
          "Llevar las cuentas y el IVA",
          "Otra cosa",
        ],
        ayuda: "Marca todas las que apliquen.",
      },
      { id: "dolorOtro", etiqueta: "¿Cuál?", tipo: "texto", requerido: true, visibleSi: { campo: "dolor", valores: ["Otra cosa"] } },
    ],
  },
  {
    id: "clientesCobros",
    titulo: "Familias y cobros",
    intro: "Cómo son tus casos y cómo te pagan. Todo con casillas: 1 minuto.",
    logro: "Ya sabemos cómo organizar tus casos y tus cobros.",
    tipo: "campos",
    campos: [
      { id: "familias", etiqueta: "¿Llevas casos de familias enteras (varios miembros a la vez)?", tipo: "opcion", requerido: true, opciones: ["Sí, a menudo", "A veces", "No"] },
      {
        id: "cobroFamilia",
        etiqueta: "¿Cómo le cobras a una familia?",
        tipo: "opcion",
        requerido: true,
        opciones: ["Un precio por toda la familia", "Un precio por cada persona", "Un precio base y un extra por cada miembro", "Depende del caso"],
        visibleSi: { campo: "familias", valores: ["Sí, a menudo", "A veces"] },
      },
      {
        id: "presentacionFamilia",
        etiqueta: "¿Presentas a todos los miembros a la vez?",
        tipo: "opcion",
        requerido: true,
        opciones: ["Sí, a todos a la vez", "No, por partes (primero uno y luego los demás)", "Depende del caso"],
        visibleSi: { campo: "familias", valores: ["Sí, a menudo", "A veces"] },
      },
      {
        id: "contactoFamilia",
        etiqueta: "¿Con quién hablas en una familia?",
        tipo: "opcion",
        requerido: true,
        opciones: ["Con una sola persona, que es la que paga", "Con una persona, pero paga otra", "Con cada miembro por separado"],
        visibleSi: { campo: "familias", valores: ["Sí, a menudo", "A veces"] },
      },
      { id: "empresas", etiqueta: "¿Te llegan empresas que tramitan a varios trabajadores?", tipo: "opcion", requerido: true, opciones: ["Sí", "A veces", "No"] },
      { id: "cuotas", etiqueta: "¿Tus clientes te pagan en cuotas?", tipo: "opcion", requerido: true, opciones: ["Sí, casi siempre", "A veces", "No, todo de una vez"] },
      { id: "mediosPago", etiqueta: "¿Cómo te pagan?", tipo: "opciones", requerido: true, opciones: ["Transferencia", "Bizum", "Efectivo", "Tarjeta"] },
      { id: "tasasAparte", etiqueta: "Las tasas, traducciones y apostillas…", tipo: "opcion", requerido: true, opciones: ["Las paga el cliente aparte", "Van incluidas en mi precio", "Depende del caso"] },
      { id: "quienIva", etiqueta: "¿Quién te hace hoy el IVA y el IRPF de cada trimestre?", tipo: "opcion", requerido: true, opciones: ["Una gestoría o asesor", "Yo misma", "Todavía nadie"] },
      { id: "local", etiqueta: "¿Tu despacho está en un local alquilado?", tipo: "opcion", requerido: true, opciones: ["Sí", "No"] },
      { id: "empleados", etiqueta: "¿Tienes personas contratadas en nómina?", tipo: "opcion", requerido: true, opciones: ["Sí", "No"] },
    ],
  },
  {
    id: "plantillas",
    titulo: "Tus plantillas",
    intro: "Los documentos que hoy rellenas a mano (hoja de encargo, presupuesto, designación de representante…). SeiriLegal los rellenará solo con los datos de cada cliente.",
    logro: "Plantillas listas. Ya casi terminas.",
    tipo: "campos",
    campos: [
      { id: "usaPlantillas", etiqueta: "¿Usas plantillas propias?", tipo: "opcion", requerido: true, opciones: ["Sí, las subo ahora", "Sí, pero las mando después", "No uso plantillas"] },
      { id: "archivos", etiqueta: "Sube tus plantillas", tipo: "archivos", requerido: true, visibleSi: { campo: "usaPlantillas", valores: ["Sí, las subo ahora"] }, ayuda: "Mejor en Word; en PDF también sirve." },
      { id: "faltan", etiqueta: "¿Alguna que hagas a mano?", tipo: "area", ejemplo: "La designación de representante la hago a mano en el formulario EX" },
    ],
  },
  {
    id: "muestras",
    titulo: "Documentos de ejemplo",
    intro:
      "Ejemplos de documentos que te llegan, para preparar la lectura automática. Antes de subir cada uno, tapas los datos de tu cliente con el dedo o el ratón: el original no sale de tu dispositivo.",
    logro: "¡Último gran paso superado! Solo falta agendar la llamada.",
    tipo: "campos",
    campos: [
      { id: "subirEjemplos", etiqueta: "¿Puedes subir algunos ahora?", tipo: "opcion", requerido: true, opciones: ["Sí, ahora", "Mejor los vemos en la llamada"] },
      {
        id: "documentos",
        etiqueta: "Tus documentos de ejemplo",
        tipo: "muestras",
        requerido: true,
        minimo: 3,
        visibleSi: { campo: "subirEjemplos", valores: ["Sí, ahora"] },
        ayuda: "Con 3 basta; si subes más, mejor. Fotos de móvil también sirven: así es como te llegan de verdad.",
      },
      { id: "notasMuestras", etiqueta: "¿Algún documento que te llegue a menudo y no esté en la lista?", tipo: "area" },
    ],
  },
  {
    id: "llamada",
    titulo: "La llamada",
    intro: "30 minutos para revisar contigo cómo calcula SeiriLegal los plazos: días hábiles, festivos y requerimientos. Es lo que no puede fallar.",
    logro: "¡Lo tienes todo! Revisa y envíanoslo.",
    tipo: "campos",
    campos: [
      { id: "dias", etiqueta: "¿Qué días te vienen bien?", tipo: "opciones", requerido: true, opciones: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"] },
      { id: "franja", etiqueta: "¿A qué hora?", tipo: "opciones", requerido: true, opciones: ["Mañana (9 a 13 h)", "Mediodía (13 a 16 h)", "Tarde (16 a 19 h)"] },
      { id: "medio", etiqueta: "¿Cómo prefieres la llamada?", tipo: "opcion", requerido: true, opciones: ["Videollamada", "Llamada de teléfono", "WhatsApp"] },
      { id: "horarios", etiqueta: "¿Alguna preferencia concreta?", tipo: "area", ejemplo: "Mejor el martes a las 10:00" },
      { id: "comentarios", etiqueta: "¿Algo más que debamos saber?", tipo: "area" },
    ],
  },
];
