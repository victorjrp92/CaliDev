import { pedir } from "../lib/api.ts";
import { type Args, bandera, posReq, soloBanderas } from "../lib/args.ts";
import { leerStdin } from "../lib/entrada.ts";
import { errorUso } from "../lib/errores.ts";
import { type Resultado, fechaHora, recortar, tabla } from "../lib/salida.ts";

export const AYUDA = [
  'calidev nota agregar <entidad> <id> [--tipo nota|brief|resumen_llamada] ["texto" | < archivo.md]',
  "calidev nota listar <entidad> <id>",
  "  entidades: persona empresa oportunidad cita tarea",
].join("\n");

export type Nota = { id: number; entidad: string; entidad_id: string; tipo: string; autor: string | null; cuerpo: string; created_at: string };

export async function nota(sub: string | undefined, a: Args): Promise<Resultado> {
  if (sub === "agregar") {
    soloBanderas(a, ["tipo"]);
    const entidad = posReq(a, 0, "entidad");
    const entidadId = posReq(a, 1, "id");
    // El cuerpo va como texto tras el id o por stdin (un brief largo en un .md).
    const enLinea = a.pos.slice(2).join(" ").trim();
    const cuerpo = enLinea || (await leerStdin()).trim();
    if (!cuerpo) throw errorUso('La nota está vacía: pásala como texto o por stdin (< brief.md).', "cuerpo");
    const r = await pedir<{ nota: Nota }>("/notas", {
      cuerpo: { entidad, entidad_id: entidadId, tipo: bandera(a, "tipo"), cuerpo },
      idempotencia: bandera(a, "idempotency-key"),
    });
    const n = r.cuerpo.nota;
    return { datos: r.cuerpo, texto: `Nota #${n.id} (${n.tipo}) agregada a ${n.entidad} ${n.entidad_id}.`, pendiente: r.pendiente };
  }

  if (sub === "listar") {
    soloBanderas(a, []);
    const { cuerpo } = await pedir<{ notas: Nota[] }>("/notas", { consulta: { entidad: posReq(a, 0, "entidad"), id: posReq(a, 1, "id") } });
    return {
      datos: cuerpo,
      texto: tabla(["ID", "CUÁNDO", "TIPO", "AUTOR", "NOTA"], cuerpo.notas.map((x) => [x.id, fechaHora(x.created_at), x.tipo, x.autor, recortar(x.cuerpo, 80)])),
    };
  }

  throw errorUso(`nota: usa agregar o listar.\n${AYUDA}`);
}
