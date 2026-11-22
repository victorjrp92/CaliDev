import { pedir } from "../lib/api.ts";
import { type Args, activa, bandera, fecha, id, posReq, soloBanderas } from "../lib/args.ts";
import { ErrorCli, SALIDA, errorUso } from "../lib/errores.ts";
import { type Resultado, diaAgenda, fechaHora, tabla, titulo, zonaLocal } from "../lib/salida.ts";
import type { Nota } from "./nota.ts";

export const AYUDA = [
  "calidev cita listar [--semana | --dia AAAA-MM-DD]   Citas reservadas y las invitaciones sin hora",
  "calidev cita brief <id>                            El brief de preparación de la cita",
].join("\n");

type Cita = { id: number; tipo: string; nombre: string; correo: string; inicio: string; persona_id: number | null; oportunidad_id: number | null; etapa: string | null; tiene_brief: boolean };
type SinHora = { id: number; tipo: string; nombre: string; correo: string; creada: string };

export async function cita(sub: string | undefined, a: Args): Promise<Resultado> {
  if (sub === "listar") {
    soloBanderas(a, ["semana", "dia"]);
    const d = bandera(a, "dia");
    if (d && activa(a, "semana")) throw errorUso("Usa --semana o --dia, no los dos.");
    const { cuerpo } = await pedir<{ desde: string; hasta: string; citas: Cita[]; sin_hora: SinHora[] }>("/citas", {
      consulta: { semana: activa(a, "semana"), dia: d ? fecha(d, "dia") : undefined },
    });
    const partes = [
      (activa(a, "semana")
        ? `Semana del ${diaAgenda(cuerpo.desde)} al ${diaAgenda(new Date(Date.parse(cuerpo.hasta) - 1).toISOString())}`
        : `Citas del ${diaAgenda(cuerpo.desde)}`) + ` (día de agenda en Colombia; horas en ${zonaLocal()})`,
      tabla(["ID", "INICIO", "TIPO", "NOMBRE", "PERSONA", "OPORTUNIDAD", "BRIEF"],
        cuerpo.citas.map((c) => [c.id, fechaHora(c.inicio), c.tipo, c.nombre, c.persona_id, c.oportunidad_id ? `${c.oportunidad_id} ${c.etapa ?? ""}` : null, c.tiene_brief ? "sí" : "falta"])),
    ];
    if (cuerpo.sin_hora.length) {
      partes.push(titulo(`Invitaciones sin reservar (${cuerpo.sin_hora.length})`));
      partes.push(tabla(["ID", "MANDADA", "TIPO", "NOMBRE", "CORREO"], cuerpo.sin_hora.map((s) => [s.id, fechaHora(s.creada), s.tipo, s.nombre, s.correo])));
    }
    return { datos: cuerpo, texto: partes.join("\n") };
  }

  if (sub === "brief") {
    soloBanderas(a, []);
    const n = id(posReq(a, 0, "id"));
    const { cuerpo } = await pedir<{ notas: Nota[] }>("/notas", { consulta: { entidad: "cita", id: n } });
    const briefs = cuerpo.notas.filter((x) => x.tipo === "brief");
    if (!briefs.length) {
      throw new ErrorCli(SALIDA.otro, "sin_brief", `La cita ${n} todavía no tiene brief. Se escribe con: calidev nota agregar cita ${n} --tipo brief < brief.md`);
    }
    // El más reciente manda; los anteriores quedan en `nota listar cita <id>`.
    const ultimo = briefs.reduce((x, y) => (x.created_at >= y.created_at ? x : y));
    return { datos: { brief: ultimo, total: briefs.length }, texto: `Brief de la cita ${n} · ${ultimo.autor ?? "—"} · ${fechaHora(ultimo.created_at)}\n\n${ultimo.cuerpo}` };
  }

  throw errorUso(`cita: usa listar o brief.\n${AYUDA}`);
}
