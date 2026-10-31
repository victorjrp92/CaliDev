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
        opciones: ["Bizkaia", "Gipuzkoa", "Araba", "Otra provincia"],
        ayuda: "Marca todas las que apliquen.",
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
    intro: "Los 4 o 5 trámites que más llevas. Con esto armamos la lista de documentos de cada expediente y sus plazos.",
    logro: "Tus trámites ya tienen su lista de documentos. Es la parte que más nos sirve.",
    tipo: "lista",
    sinExcel: true,
    item: { singular: "trámite", plural: "trámites", minimo: 1, tituloDe: "tramite" },
    campos: [
      { id: "tramite", etiqueta: "Trámite", tipo: "opcion", requerido: true, opciones: TRAMITES },
      { id: "otroTramite", etiqueta: "¿Cuál?", tipo: "texto", requerido: true, visibleSi: { campo: "tramite", valores: ["Otro"] } },
      { id: "volumen", etiqueta: "¿Cuántos llevas al mes, más o menos?", tipo: "opcion", requerido: true, opciones: ["1 o 2", "De 3 a 5", "De 6 a 10", "Más de 10"] },
      {
        id: "documentos",
        etiqueta: "Documentos que le pides al cliente",
        tipo: "area",
        requerido: true,
        ayuda: "Uno por línea, tal como se los pides. Si tienes la lista en un archivo, súbelo en el paso «Tus plantillas».",
        ejemplo: "Pasaporte completo\nEmpadronamiento de 2 años\nAntecedentes penales apostillados y traducidos",
      },
      { id: "formulario", etiqueta: "Formulario y tasa que usas", tipo: "texto", ejemplo: "EX-10 y tasa 790-052" },
      {
        id: "particular",
        etiqueta: "Lo que te piden en tu oficina aparte de la norma",
        tipo: "area",
        ayuda: "Requisitos de la casa o lo que más te sale en los requerimientos.",
      },
      { id: "honorarios", etiqueta: "Tus honorarios habituales (€)", tipo: "texto", ejemplo: "550 € + IVA" },
    ],
  },
  {
    id: "trabajo",
    titulo: "Cómo trabajas hoy",
    intro: "Para que SeiriLegal se adapte a tu forma de trabajar, no al revés.",
    logro: "Ya entendemos tu día a día. Ya pasaste la mitad.",
    tipo: "campos",
    campos: [
      {
        id: "dondeHoy",
        etiqueta: "¿Dónde llevas hoy los expedientes?",
        tipo: "opciones",
        requerido: true,
        opciones: ["Excel", "Word", "Carpetas en el ordenador", "Papel", "WhatsApp", "Otro programa"],
      },
      { id: "programa", etiqueta: "¿Qué programa?", tipo: "texto", requerido: true, visibleSi: { campo: "dondeHoy", valores: ["Otro programa"] } },
      { id: "mercurio", etiqueta: "¿Presentas por Mercurio?", tipo: "opcion", requerido: true, opciones: ["Sí, siempre", "A veces", "No"] },
      { id: "contencioso", etiqueta: "¿Llevas casos ante los tribunales (contencioso)?", tipo: "opcion", requerido: true, opciones: SI_NO },
      { id: "lexnet", etiqueta: "¿Recibes notificaciones por LexNET?", tipo: "opcion", requerido: true, opciones: SI_NO, visibleSi: { campo: "contencioso", valores: ["Sí"] } },
      { id: "urgentes", etiqueta: "¿Llevas casos urgentes, como expulsiones o internamientos?", tipo: "opcion", requerido: true, opciones: SI_NO, ayuda: "Si es así, sus plazos se cuentan en horas y la app avisa al momento." },
      {
        id: "canales",
        etiqueta: "¿Cómo te mandan los documentos tus clientes?",
        tipo: "opciones",
        requerido: true,
        opciones: ["Correo", "WhatsApp", "En persona", "Otro"],
      },
      { id: "correoDocs", etiqueta: "¿A qué correo te llegan los documentos y los avisos de la Administración?", tipo: "correo", requerido: true },
      {
        id: "idiomas",
        etiqueta: "¿En qué idiomas te escriben tus clientes?",
        tipo: "opciones",
        requerido: true,
        opciones: ["Español", "Inglés", "Francés", "Árabe", "Portugués", "Ucraniano", "Ruso", "Chino", "Urdu", "Otro"],
      },
      { id: "datosCliente", etiqueta: "¿Qué datos le pides a un cliente nuevo?", tipo: "area", requerido: true, ejemplo: "Nombre, NIE o pasaporte, nacionalidad, teléfono, correo, dirección…" },
      { id: "dolor", etiqueta: "¿Qué es lo que más tiempo te quita hoy?", tipo: "area", requerido: true, ejemplo: "Perseguir a los clientes para que me manden los papeles" },
    ],
  },
  {
    id: "plantillas",
    titulo: "Tus plantillas",
    intro: "Los documentos que hoy rellenas a mano. SeiriLegal los rellenará solo con los datos de cada cliente.",
    logro: "Plantillas recibidas. Ya casi terminas.",
    tipo: "campos",
    campos: [
      {
        id: "archivos",
        etiqueta: "Sube tus plantillas",
        tipo: "archivos",
        requerido: true,
        ayuda: "Hoja de encargo, designación de representante, presupuesto, escritos que uses a menudo. Mejor en Word; en PDF también sirve.",
      },
      { id: "faltan", etiqueta: "¿Alguna que no tengas en archivo?", tipo: "area", ejemplo: "La designación de representante la hago a mano en el formulario EX" },
    ],
  },
  {
    id: "muestras",
    titulo: "Documentos de ejemplo",
    intro:
      "Ejemplos de los documentos que te llegan, para preparar la lectura automática. Antes de subir cada uno, tapas los datos de tu cliente con el dedo o el ratón. El original no sale de tu dispositivo: solo se sube la versión tapada.",
    logro: "¡Último gran paso superado! Solo falta agendar la llamada.",
    tipo: "campos",
    campos: [
      {
        id: "documentos",
        etiqueta: "Tus documentos de ejemplo",
        tipo: "muestras",
        requerido: true,
        minimo: 10,
        ayuda: "Al menos 10, de tipos distintos. Si llegas a 20, mejor. Fotos de móvil también: así es como te llegan de verdad.",
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
      { id: "horarios", etiqueta: "Dos o tres horarios que te vengan bien la próxima semana", tipo: "area", requerido: true, ejemplo: "Martes 4 de 10:00 a 12:00\nJueves 6 por la tarde" },
      { id: "medio", etiqueta: "¿Cómo prefieres la llamada?", tipo: "opcion", requerido: true, opciones: ["Videollamada", "Llamada de teléfono", "WhatsApp"] },
      { id: "comentarios", etiqueta: "¿Algo más que debamos saber?", tipo: "area" },
    ],
  },
];
