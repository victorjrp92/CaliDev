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
