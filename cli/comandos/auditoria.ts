import { pedir } from "../lib/api.ts";
import { type Args, bandera, id, soloBanderas } from "../lib/args.ts";
import { errorUso } from "../lib/errores.ts";
import { type Resultado, fechaHora, tabla } from "../lib/salida.ts";

export const AYUDA = "calidev auditoria [--entidad oportunidad --id 42] [--limite N]   Quién hizo qué y cuándo";

type Fila = { id: string; usuario: string | null; origen: string; accion: string; entidad: string; entidad_id: string | null; at: string };

export async function auditoria(a: Args): Promise<Resultado> {
  soloBanderas(a, ["entidad", "id", "limite"]);
  const entidad = bandera(a, "entidad");
  const entidadId = bandera(a, "id");
  if (entidadId && !entidad) throw errorUso("--id va con --entidad.", "id");
  const limite = bandera(a, "limite");
  const { cuerpo } = await pedir<{ auditoria: Fila[] }>("/auditoria", { consulta: { entidad, id: entidadId, limite: limite ? id(limite, "limite") : undefined } });
  return {
    datos: cuerpo,
    texto: tabla(["CUÁNDO", "QUIÉN", "POR", "ACCIÓN", "SOBRE"],
      cuerpo.auditoria.map((f) => [fechaHora(f.at), f.usuario ?? "sistema", f.origen, f.accion, `${f.entidad}${f.entidad_id ? ` ${f.entidad_id}` : ""}`])),
  };
}
