import { sql } from "@/lib/db";
import { type Correo, enviarCorreo, envolver, escapar } from "@/lib/delegar/correos/enviar";
import { ErrorCrm } from "../actor";
import { registrarEjecutor, solicitar } from "../aprobaciones";
import { type Cobro, cobroPorId, listarCobros } from "../cobros";
import { fecha, plata } from "../formato";
import { actorDeAgente } from "./identidad";

/**
 * Agente de cobros (spec §9): detecta la mora y propone recordatorios. Nunca
 * crea un cobro (su rol no tiene cobros:crear) ni manda nada por su cuenta:
 * cada recordatorio entra a Aprobaciones como `recordar_cobro` con el correo
 * exacto, y sale solo cuando una persona lo aprueba (y lo puede corregir).
 *
 * Un cobro con un recordatorio pendiente, o con uno de hace menos de 7 días,
 * no recibe otro: la corrida diaria no llena Aprobaciones de repetidos.
 */
const DIAS_ENTRE_RECORDATORIOS = 7;

let enviador: (c: Correo) => Promise<boolean> = enviarCorreo;
/** Las pruebas cambian el envío para no llamar a Resend. */
export function usarEnviadorCobros(fn: ((c: Correo) => Promise<boolean>) | null) {
  enviador = fn ?? enviarCorreo;
}

export type ResultadoCobros = { en_mora: number; propuestos: number; ya_avisados: number; sin_correo: number };

const esCorreo = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function redactar(c: Cobro): { asunto: string; texto: string } {
  const que = c.descripcion?.trim() || c.concepto;
  const texto = [
    `Hola${c.persona ? ` ${c.persona.split(" ")[0]}` : ""}:`,
    "",
    `Te escribimos de Calidev por el pago de «${que}» de ${c.empresa}, por ${plata(c.valor, c.moneda)}, que venció el ${fecha(c.vence_at)}.`,
    c.enlace_pago ? `Puedes pagarlo aquí: ${c.enlace_pago}` : "Si ya lo pagaste, respóndenos con el comprobante y lo marcamos.",
    "",
    "Si hay algo que revisar en el cobro, responde a este correo y lo vemos.",
    "",
    "Gracias,",
    "Equipo Calidev",
  ].join("\n");
  return { asunto: `Recordatorio de pago: ${que}`, texto };
}

async function yaAvisado(cobroId: number, ahora: Date): Promise<boolean> {
  const desde = new Date(ahora.getTime() - DIAS_ENTRE_RECORDATORIOS * 86400e3).toISOString();
  const r = await sql<{ n: number }>`
    SELECT COUNT(*)::int AS n FROM crm_aprobaciones
    WHERE tipo = 'recordar_cobro' AND entidad = 'cobro' AND entidad_id = ${String(cobroId)}
      AND (estado = 'pendiente' OR created_at >= ${desde})`;
  return (r.rows[0]?.n ?? 0) > 0;
}

export async function proponerRecordatorios(ahora = new Date()): Promise<ResultadoCobros> {
  const agente = await actorDeAgente("cobros");
  const mora = await listarCobros(agente, { mora: true, limite: 500 }, ahora);
  const r: ResultadoCobros = { en_mora: mora.length, propuestos: 0, ya_avisados: 0, sin_correo: 0 };
  for (const c of mora) {
    if (!c.correo || !esCorreo(c.correo)) {
      r.sin_correo++;
      continue;
    }
    if (await yaAvisado(c.id, ahora)) {
      r.ya_avisados++;
      continue;
    }
    const { asunto, texto } = redactar(c);
    await solicitar(agente, {
      tipo: "recordar_cobro",
      payload: { cobro_id: c.id, correo: c.correo, asunto, texto },
      vistaPrevia: `Para: ${c.correo}\nAsunto: ${asunto}\n\n${texto}`,
      entidad: "cobro",
      entidadId: c.id,
    });
    r.propuestos++;
  }
  return r;
}

/** Al aprobar: si el cobro ya se pagó o se anuló mientras esperaba, no se manda. */
registrarEjecutor("recordar_cobro", async (payload) => {
  const id = Number(payload.cobro_id);
  if (!Number.isInteger(id)) throw new ErrorCrm(400, "campo_invalido", "cobro_id inválido.", "cobro_id");
  const c = await cobroPorId(null, id);
  if (c.estado !== "pendiente") throw new ErrorCrm(409, "cobro_cerrado", `El cobro ${id} ya está ${c.estado}; no se mandó el recordatorio.`);
  const para = typeof payload.correo === "string" ? payload.correo.trim() : "";
  const asunto = typeof payload.asunto === "string" ? payload.asunto.trim() : "";
  const texto = typeof payload.texto === "string" ? payload.texto.trim() : "";
  if (!esCorreo(para)) throw new ErrorCrm(400, "campo_invalido", "El correo del recordatorio no es válido.", "correo");
  if (!asunto || !texto) throw new ErrorCrm(400, "campo_requerido", "El recordatorio necesita asunto y texto.", "texto");
  const html = envolver(texto.split("\n").map((l) => (l ? `<p style="margin:0 0 4px">${escapar(l)}</p>` : "<br>")).join(""));
  if (!(await enviador({ para, asunto, texto, html }))) throw new ErrorCrm(502, "correo_fallo", "Resend no aceptó el correo; vuelve a intentarlo más tarde.");
  return { enviado_a: para, cobro_id: id };
});
