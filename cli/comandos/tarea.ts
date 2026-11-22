import { pedir } from "../lib/api.ts";
import { type Args, activa, bandera, fecha, id, posReq, soloBanderas } from "../lib/args.ts";
import { errorUso } from "../lib/errores.ts";
import { type Resultado, fechaHora, tabla } from "../lib/salida.ts";

export const AYUDA = [
  "calidev tarea listar [--mia] [--area ventas] [--estado abierta|hecha|cancelada]",
  'calidev tarea crear "<título>" [--area A] [--entidad E --id X] [--asignar USUARIO_ID] [--vence AAAA-MM-DD]',
  "calidev tarea tomar <id>                    Me la asigno",
  "calidev tarea cerrar <id> [--cancelar]      Hecha (o cancelada)",
].join("\n");

type Tarea = { id: number; titulo: string; area: string; entidad: string | null; entidad_id: string | null; asignada: string | null; vence_at: string | null; estado: string };

const linea = (t: Tarea) => `#${t.id} ${t.titulo} · ${t.estado}` + (t.asignada ? ` · ${t.asignada}` : "");

export async function tarea(sub: string | undefined, a: Args): Promise<Resultado> {
  const idem = bandera(a, "idempotency-key");

  if (sub === "listar") {
    soloBanderas(a, ["mia", "area", "estado"]);
    const { cuerpo } = await pedir<{ tareas: Tarea[] }>("/tareas", { consulta: { mia: activa(a, "mia"), area: bandera(a, "area"), estado: bandera(a, "estado") } });
    return {
      datos: cuerpo,
      texto: tabla(["ID", "VENCE", "ÁREA", "ESTADO", "ASIGNADA", "SOBRE", "TAREA"],
        cuerpo.tareas.map((t) => [t.id, fechaHora(t.vence_at), t.area, t.estado, t.asignada ?? "nadie", t.entidad ? `${t.entidad} ${t.entidad_id}` : null, t.titulo])),
    };
  }

  if (sub === "crear") {
    soloBanderas(a, ["area", "entidad", "id", "asignar", "vence"]);
    const tituloTarea = a.pos.join(" ").trim();
    if (!tituloTarea) throw errorUso("Falta el título de la tarea.", "titulo");
    const asignar = bandera(a, "asignar");
    const vence = bandera(a, "vence");
    const r = await pedir<{ tarea: Tarea }>("/tareas", {
      cuerpo: {
        titulo: tituloTarea, area: bandera(a, "area"), entidad: bandera(a, "entidad"), entidad_id: bandera(a, "id"),
        asignada_a: asignar ? id(asignar, "asignar") : undefined, vence_at: vence ? fecha(vence, "vence") : undefined,
      },
      idempotencia: idem,
    });
    return { datos: r.cuerpo, texto: `Creada ${linea(r.cuerpo.tarea)}`, pendiente: r.pendiente };
  }

  if (sub === "tomar" || sub === "cerrar") {
    soloBanderas(a, sub === "cerrar" ? ["cancelar"] : []);
    const n = id(posReq(a, 0, "id"));
    const accion = sub === "tomar" ? "tomar" : activa(a, "cancelar") ? "cancelada" : "hecha";
    const r = await pedir<{ tarea: Tarea }>(`/tareas/${n}`, { metodo: "PATCH", cuerpo: { accion }, idempotencia: idem });
    return { datos: r.cuerpo, texto: linea(r.cuerpo.tarea), pendiente: r.pendiente };
  }

  throw errorUso(`tarea: usa listar, crear, tomar o cerrar.\n${AYUDA}`);
}
