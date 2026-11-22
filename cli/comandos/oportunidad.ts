import { pedir } from "../lib/api.ts";
import { type Args, activa, bandera, banderaReq, fecha, id, monto, posReq, soloBanderas } from "../lib/args.ts";
import { errorUso } from "../lib/errores.ts";
import { type Resultado, fechaHora, ficha, pesos, recortar, tabla, titulo } from "../lib/salida.ts";

export const AYUDA = [
  "calidev oportunidad listar [--etapa E] [--abiertas] [--vencidas] [--persona ID]",
  'calidev oportunidad crear --titulo "…" --paso "…" --fecha AAAA-MM-DD [--persona ID] [--etapa E] [--arranque N --mensual N]',
  "calidev oportunidad ver <id>",
  'calidev oportunidad mover <id> <etapa> [--paso "…" --fecha AAAA-MM-DD] [--motivo "…"]',
  'calidev oportunidad proximo-paso <id> "<qué>" --fecha AAAA-MM-DD',
  "  etapas: lead calificado diagnostico_agendado diagnostico_hecho propuesta negociacion ganado perdido pausa",
].join("\n");

type Oportunidad = {
  id: number; titulo: string; persona_id: number | null; persona: string | null; empresa: string | null; etapa: string;
  valor_arranque: string | null; valor_mensual: string | null; moneda: string; responsable: string | null;
  proximo_paso: string | null; proximo_paso_at: string | null; motivo_perdida: string | null; origen: string | null; updated_at: string;
};
type Paso = { de: string | null; a: string; at: string; usuario: string | null };
type Nota = { id: number; tipo: string; autor: string | null; cuerpo: string; created_at: string };

const resumen = (o: Oportunidad) =>
  `#${o.id} ${o.titulo} → ${o.etapa}` + (o.proximo_paso ? ` · próximo paso: ${o.proximo_paso} (${fechaHora(o.proximo_paso_at)})` : "");

function describir(o: Oportunidad): string {
  return ficha([
    ["Oportunidad", `${o.titulo} (#${o.id})`], ["Etapa", o.etapa], ["Persona", o.persona_id ? `${o.persona ?? ""} (#${o.persona_id})` : null],
    ["Empresa", o.empresa], ["Arranque", pesos(o.valor_arranque, o.moneda)], ["Mensual", pesos(o.valor_mensual, o.moneda)],
    ["Responsable", o.responsable], ["Próximo paso", o.proximo_paso], ["Fecha del paso", fechaHora(o.proximo_paso_at)],
    ["Motivo pérdida", o.motivo_perdida], ["Origen", o.origen], ["Actualizada", fechaHora(o.updated_at)],
  ]);
}

export async function oportunidad(sub: string | undefined, a: Args): Promise<Resultado> {
  const idem = bandera(a, "idempotency-key");

  if (sub === "listar") {
    soloBanderas(a, ["etapa", "abiertas", "vencidas", "persona"]);
    const persona = bandera(a, "persona");
    const { cuerpo } = await pedir<{ oportunidades: Oportunidad[] }>("/oportunidades", {
      consulta: { etapa: bandera(a, "etapa"), abiertas: activa(a, "abiertas"), vencidas: activa(a, "vencidas"), persona_id: persona ? id(persona, "persona") : undefined },
    });
    return {
      datos: cuerpo,
      texto: tabla(["ID", "ETAPA", "TÍTULO", "PERSONA", "PRÓXIMO PASO", "FECHA"],
        cuerpo.oportunidades.map((o) => [o.id, o.etapa, o.titulo, o.persona, o.proximo_paso, fechaHora(o.proximo_paso_at)])),
    };
  }

  if (sub === "crear") {
    soloBanderas(a, ["titulo", "paso", "fecha", "persona", "etapa", "arranque", "mensual", "moneda"]);
    const persona = bandera(a, "persona");
    const arranque = bandera(a, "arranque");
    const mensual = bandera(a, "mensual");
    const f = bandera(a, "fecha");
    const cuerpo = {
      titulo: banderaReq(a, "titulo"),
      persona_id: persona ? id(persona, "persona") : undefined,
      etapa: bandera(a, "etapa"),
      proximo_paso: bandera(a, "paso"),
      proximo_paso_at: f ? fecha(f) : undefined,
      valor_arranque: arranque ? monto(arranque, "arranque") : undefined,
      valor_mensual: mensual ? monto(mensual, "mensual") : undefined,
      moneda: bandera(a, "moneda"),
    };
    const r = await pedir<{ oportunidad: Oportunidad }>("/oportunidades", { cuerpo, idempotencia: idem });
    return { datos: r.cuerpo, texto: `Creada ${resumen(r.cuerpo.oportunidad)}`, pendiente: r.pendiente };
  }

  if (sub === "ver") {
    soloBanderas(a, []);
    const n = id(posReq(a, 0, "id"));
    const { cuerpo } = await pedir<{ oportunidad: Oportunidad; historial: Paso[]; notas: Nota[] | null }>(`/oportunidades/${n}`);
    const partes = [describir(cuerpo.oportunidad), titulo("Historial de etapas"),
      tabla(["CUÁNDO", "DE", "A", "QUIÉN"], cuerpo.historial.map((h) => [fechaHora(h.at), h.de, h.a, h.usuario]))];
    if (cuerpo.notas) {
      partes.push(titulo("Notas"));
      partes.push(tabla(["ID", "CUÁNDO", "TIPO", "AUTOR", "NOTA"], cuerpo.notas.map((x) => [x.id, fechaHora(x.created_at), x.tipo, x.autor, recortar(x.cuerpo, 70)])));
    }
    return { datos: cuerpo, texto: partes.join("\n") };
  }

  if (sub === "mover") {
    soloBanderas(a, ["paso", "fecha", "motivo"]);
    const n = id(posReq(a, 0, "id"));
    const etapa = posReq(a, 1, "etapa");
    const f = bandera(a, "fecha");
    const r = await pedir<{ oportunidad: Oportunidad }>(`/oportunidades/${n}/etapa`, {
      cuerpo: { a: etapa, proximo_paso: bandera(a, "paso"), proximo_paso_at: f ? fecha(f) : undefined, motivo_perdida: bandera(a, "motivo") },
      idempotencia: idem,
    });
    return { datos: r.cuerpo, texto: `Movida ${resumen(r.cuerpo.oportunidad)}`, pendiente: r.pendiente };
  }

  if (sub === "proximo-paso") {
    soloBanderas(a, ["fecha"]);
    const n = id(posReq(a, 0, "id"));
    const paso = posReq(a, 1, "qué");
    const r = await pedir<{ oportunidad: Oportunidad }>(`/oportunidades/${n}`, {
      metodo: "PATCH", cuerpo: { proximo_paso: paso, proximo_paso_at: fecha(banderaReq(a, "fecha")) }, idempotencia: idem,
    });
    return { datos: r.cuerpo, texto: `Listo: ${resumen(r.cuerpo.oportunidad)}`, pendiente: r.pendiente };
  }

  throw errorUso(`oportunidad: usa listar, crear, ver, mover o proximo-paso.\n${AYUDA}`);
}
