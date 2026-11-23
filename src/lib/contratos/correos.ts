import { CORREO_VICTOR, envolver, escapar, type Correo } from "@/lib/delegar/correos/enviar";
import type { Contrato, Firmante } from "@/lib/contratos/datos";

/**
 * Los correos de la firma de contratos: el código de verificación, la
 * constancia para quien acaba de firmar, el aviso a Víctor y, cuando firman
 * todos, el aviso de contrato completo a cada firmante.
 */

const SITIO = "https://calidev.dev";
const ENLACE = 'style="color:#0A3D2E;font-weight:700"';

export function enlaceFirmante(f: Firmante): string {
  return `${SITIO}/contratos/${f.token}`;
}

/** Fecha y hora de Colombia, con la zona escrita: la constancia la cita tal cual. */
export function fechaColombia(fecha: string | Date): string {
  const texto = new Intl.DateTimeFormat("es-CO", {
    dateStyle: "long",
    timeStyle: "medium",
    timeZone: "America/Bogota",
  }).format(new Date(fecha));
  return `${texto} (hora de Colombia)`;
}

export function correoCodigo(correo: string, codigo: string, contrato: Contrato): Correo {
  return {
    para: correo,
    asunto: `${codigo} es tu código para firmar el contrato`,
    texto: `Tu código para firmar «${contrato.titulo}» es ${codigo}. Vale por 15 minutos.\n\nSi no estás firmando un contrato con CaliDev, ignora este correo.`,
    html: envolver(
      `<p>Tu código para firmar <b>${escapar(contrato.titulo)}</b> es:</p>
       <p style="font-family:ui-monospace,Menlo,monospace;font-size:32px;font-weight:800;letter-spacing:.2em;margin:16px 0">${codigo}</p>
       <p>Vale por 15 minutos.</p>
       <p style="color:#5A6B63;font-size:14px">Si no estás firmando un contrato con CaliDev, ignora este correo.</p>`
    ),
  };
}

export function correoConstancia(f: Firmante, contrato: Contrato): Correo {
  const enlace = enlaceFirmante(f);
  return {
    para: f.correo!,
    asunto: `Firmaste: ${contrato.titulo}`,
    texto: `Hola ${f.nombre}. Tu firma quedó registrada el ${fechaColombia(f.firmado_at!)}.\n\nAquí puedes ver el contrato y la constancia de firma cuando quieras, y descargarlos en PDF: ${enlace}\n\nCaliDev`,
    html: envolver(
      `<p>Hola ${escapar(f.nombre ?? "")}.</p>
       <p>Tu firma de <b>${escapar(contrato.titulo)}</b> quedó registrada el ${escapar(fechaColombia(f.firmado_at!))}.</p>
       <p>Aquí puedes ver el contrato con la constancia de firma cuando quieras, y descargarlo en PDF:<br><a href="${enlace}" ${ENLACE}>${enlace}</a></p>
       <p>CaliDev</p>`
    ),
  };
}

export function correoAvisoFirma(f: Firmante, contrato: Contrato, faltan: Firmante[]): Correo {
  const enlace = enlaceFirmante(f);
  const pendiente = faltan.length
    ? `Falta la firma de: ${faltan.map((x) => x.etiqueta).join(", ")}.`
    : "Ya firmaron todas las partes.";
  return {
    para: CORREO_VICTOR,
    asunto: `Contrato firmado por ${f.nombre} · ${contrato.titulo}`,
    texto: `${f.nombre} (${f.tipo_documento} ${f.documento}, ${f.correo}) firmó «${contrato.titulo}» el ${fechaColombia(f.firmado_at!)}.\n${pendiente}\n\n${enlace}`,
    html: envolver(
      `<p><b>${escapar(f.nombre ?? "")}</b> (${escapar(`${f.tipo_documento} ${f.documento}`)}, ${escapar(f.correo ?? "")}) firmó <b>${escapar(contrato.titulo)}</b> el ${escapar(fechaColombia(f.firmado_at!))}.</p>
       <p>${escapar(pendiente)}</p>
       <p><a href="${enlace}" ${ENLACE}>Ver el contrato y la constancia</a></p>`
    ),
  };
}

export function correoCompleto(f: Firmante, contrato: Contrato): Correo {
  const enlace = enlaceFirmante(f);
  return {
    para: f.correo!,
    asunto: `Contrato firmado por todas las partes: ${contrato.titulo}`,
    texto: `Hola ${f.nombre}. «${contrato.titulo}» ya está firmado por todas las partes.\n\nEl contrato completo, con la constancia de cada firma, está aquí y lo puedes descargar en PDF: ${enlace}\n\nCaliDev`,
    html: envolver(
      `<p>Hola ${escapar(f.nombre ?? "")}.</p>
       <p><b>${escapar(contrato.titulo)}</b> ya está firmado por todas las partes.</p>
       <p>El contrato completo, con la constancia de cada firma, está aquí y lo puedes descargar en PDF:<br><a href="${enlace}" ${ENLACE}>${enlace}</a></p>
       <p>CaliDev</p>`
    ),
  };
}

/**
 * El enlace de firma para una persona. Lo manda el CRM (directo si lo pide un
 * humano con `contrato:enviar`, o al aprobarse si lo pidió un agente). El
 * código de verificación no va aquí: lo pide la persona al firmar.
 */
export function correoEnlace(f: Firmante, contrato: Contrato, para: string, nombre: string | null, nota?: string | null): Correo {
  const enlace = enlaceFirmante(f);
  const hola = nombre?.trim() ? `Hola ${nombre.trim()}.` : "Hola.";
  // `nota`: para qué es el contrato, en palabras simples (Victor, 23 nov 2026).
  const n = nota?.trim() ?? "";
  return {
    para,
    asunto: `Para firmar: ${contrato.titulo}`,
    texto: `${hola}\n\n${n ? `${n}\n\n` : ""}Aquí está el contrato «${contrato.titulo}» para que lo leas y lo firmes: ${enlace}\n\nAl firmar te pedimos tus datos y un código que te llega a este correo. Es tu enlace personal: no lo reenvíes.\n\nCaliDev`,
    html: envolver(
      `<p>${escapar(hola)}</p>
       ${n ? parrafos(n) : ""}
       <p>Aquí está <b>${escapar(contrato.titulo)}</b> para que lo leas y lo firmes:</p>
       <p><a href="${enlace}" ${ENLACE}>Leer y firmar el contrato</a></p>
       <p>Al firmar te pedimos tus datos y un código que te llega a este correo. Es tu enlace personal: no lo reenvíes.</p>
       <p>CaliDev</p>`
    ),
  };
}

/**
 * Un correo propio del contrato para quien firma cuando ya firmaron todos
 * (Victor, 23 nov 2026: al firmar el paso a producción de SeiriLegal le llega
 * a la clienta la guía para subir sus documentos). Va en `datos.alFirmar`
 * como `{ asunto, texto }`; el texto separa párrafos con una línea en blanco
 * y sus enlaces se vuelven clicables. Sin `alFirmar`, nada.
 */
export function correoAlFirmar(f: Firmante, contrato: Contrato): Correo | null {
  if (!f.correo || !contrato.datos) return null;
  let a: unknown;
  try {
    a = (JSON.parse(contrato.datos) as { alFirmar?: unknown })?.alFirmar;
  } catch {
    return null;
  }
  const { asunto, texto } = (a ?? {}) as { asunto?: unknown; texto?: unknown };
  if (typeof asunto !== "string" || typeof texto !== "string" || !asunto.trim() || !texto.trim()) return null;
  return {
    para: f.correo,
    asunto: asunto.trim(),
    texto: texto.trim(),
    html: envolver(parrafos(texto.trim())),
  };
}

/** Texto plano a párrafos HTML: línea en blanco separa párrafos y los enlaces https se vuelven clicables. */
function parrafos(texto: string): string {
  const parrafo = (p: string) =>
    `<p>${escapar(p)
      .replace(/https:\/\/[^\s<]+[^\s<.,;:)]/g, (u) => `<a href="${u}" ${ENLACE}>${u}</a>`)
      .replace(/\n/g, "<br>")}</p>`;
  return texto.split(/\n\s*\n/).map(parrafo).join("\n");
}
