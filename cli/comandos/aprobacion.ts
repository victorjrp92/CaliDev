import { pedir } from "../lib/api.ts";
import { type Args, bandera, banderaReq, id, posReq, soloBanderas } from "../lib/args.ts";
import { jsonDeStdin } from "../lib/entrada.ts";
import { errorUso } from "../lib/errores.ts";
import { type Resultado, fechaHora, ficha, recortar, tabla } from "../lib/salida.ts";

export const AYUDA = [
  "calidev aprobacion listar [--estado pendiente|aprobada|rechazada|ejecutada|fallida|todas]",
  "calidev aprobacion ver <id>",
  "calidev aprobacion aprobar <id> [< payload-corregido.json]   Solo humanos",
  'calidev aprobacion rechazar <id> --motivo "…"                Solo humanos',
  'calidev aprobacion pedir --tipo T --vista-previa "…" [--entidad E --id X] < payload.json   Sale con 4: queda pendiente',
].join("\n");

type Aprobacion = {
  id: number; tipo: string; solicitante: string | null; estado: string; vista_previa: string; payload: unknown;
  entidad: string | null; entidad_id: string | null; decidido: string | null; decidido_at: string | null; motivo: string | null;
  resultado: unknown; created_at: string;
};

function describir(p: Aprobacion): string {
  return [
    ficha([
      ["Aprobación", `#${p.id} · ${p.tipo}`], ["Estado", p.estado], ["Pide", p.solicitante], ["Cuándo", fechaHora(p.created_at)],
      ["Sobre", p.entidad ? `${p.entidad} ${p.entidad_id}` : null], ["Decidió", p.decidido ? `${p.decidido} · ${fechaHora(p.decidido_at)}` : null],
      ["Motivo", p.motivo],
    ]),
    "",
    "Vista previa:",
    p.vista_previa,
    "",
    "Payload:",
    JSON.stringify(p.payload, null, 2),
    ...(p.resultado === null || p.resultado === undefined ? [] : ["", "Resultado:", JSON.stringify(p.resultado, null, 2)]),
  ].join("\n");
}

export async function aprobacion(sub: string | undefined, a: Args): Promise<Resultado> {
  const idem = bandera(a, "idempotency-key");

  if (sub === "listar") {
    soloBanderas(a, ["estado"]);
    const { cuerpo } = await pedir<{ aprobaciones: Aprobacion[] }>("/aprobaciones", { consulta: { estado: bandera(a, "estado") } });
    return {
      datos: cuerpo,
      texto: tabla(["ID", "CUÁNDO", "ESTADO", "TIPO", "PIDE", "VISTA PREVIA"],
        cuerpo.aprobaciones.map((p) => [p.id, fechaHora(p.created_at), p.estado, p.tipo, p.solicitante, recortar(p.vista_previa, 60)])),
    };
  }

  if (sub === "ver") {
    soloBanderas(a, []);
    const { cuerpo } = await pedir<{ aprobacion: Aprobacion }>(`/aprobaciones/${id(posReq(a, 0, "id"))}`);
    return { datos: cuerpo, texto: describir(cuerpo.aprobacion) };
  }

  if (sub === "aprobar" || sub === "rechazar") {
    soloBanderas(a, sub === "rechazar" ? ["motivo"] : []);
    const n = id(posReq(a, 0, "id"));
    const payload = sub === "aprobar" ? await jsonDeStdin("payload") : undefined;
    if (payload !== undefined && (typeof payload !== "object" || payload === null || Array.isArray(payload))) {
      throw errorUso("El payload corregido debe ser un objeto JSON.", "payload");
    }
    const r = await pedir<{ aprobacion: Aprobacion }>(`/aprobaciones/${n}/decision`, {
      cuerpo: { decision: sub, motivo: sub === "rechazar" ? banderaReq(a, "motivo") : undefined, payload },
      idempotencia: idem,
    });
    const p = r.cuerpo.aprobacion;
    return { datos: r.cuerpo, texto: `Aprobación #${p.id}: ${p.estado}.` + (p.estado === "fallida" ? ` Falló al ejecutarse: ${JSON.stringify(p.resultado)}` : "") };
  }

  if (sub === "pedir") {
    soloBanderas(a, ["tipo", "vista-previa", "entidad", "id"]);
    const payload = await jsonDeStdin("payload", {});
    const r = await pedir<{ aprobacion_id: number }>("/aprobaciones", {
      cuerpo: { tipo: banderaReq(a, "tipo"), vista_previa: banderaReq(a, "vista-previa"), payload, entidad: bandera(a, "entidad"), entidad_id: bandera(a, "id") },
      idempotencia: idem,
    });
    return { datos: r.cuerpo, texto: `Quedó pendiente de aprobación: #${r.cuerpo.aprobacion_id}. La decide Victor o Karen en calidev.dev/crm/aprobaciones.`, pendiente: r.pendiente };
  }

  throw errorUso(`aprobacion: usa listar, ver, aprobar, rechazar o pedir.\n${AYUDA}`);
}
