import { pedir } from "../lib/api.ts";
import { type Args, bandera, fecha, soloBanderas } from "../lib/args.ts";
import { type Resultado, dia, fechaHora, hora, recortar, tabla, titulo, zonaLocal } from "../lib/salida.ts";

export const AYUDA = "calidev hoy [--dia AAAA-MM-DD]      Citas, tareas, vencidas, aprobaciones y embudo del día";

type Cita = { id: number; tipo: string; nombre: string; inicio: string; etapa: string | null; tiene_brief: boolean };
type Tarea = { id: number; titulo: string; area: string; asignada: string | null; vence_at: string | null };
type Oportunidad = { id: number; titulo: string; persona: string | null; etapa: string; proximo_paso: string | null; proximo_paso_at: string | null };
type Aprobacion = { id: number; tipo: string; solicitante: string | null; vista_previa: string };
type Embudo = {
  conversaciones: number; calificados: number; diagnosticos_agendados: number; diagnosticos_hechos: number;
  propuestas: number; cierres_mes: number; tasa_cierre: number | null;
  meta: { cierresNecesariosMes: number; diagnosticos_semana_necesarios: number | null };
};
type Hoy = {
  dia: string; citas: Cita[] | null; citas_sin_hora: number | null; tareas: Tarea[] | null;
  oportunidades_vencidas: Oportunidad[] | null; aprobaciones: { total: number; primeras: Aprobacion[] } | null; embudo: Embudo | null;
};

export async function hoy(a: Args): Promise<Resultado> {
  soloBanderas(a, ["dia"]);
  const d = bandera(a, "dia");
  const { cuerpo: h } = await pedir<Hoy>("/hoy", { consulta: { dia: d ? fecha(d, "dia") : undefined } });
  const partes = [`Hoy ${dia(h.dia)} (día de agenda en Colombia; horas en ${zonaLocal()})`];

  if (h.citas) {
    partes.push(titulo(`Citas (${h.citas.length})`));
    partes.push(tabla(["ID", "HORA", "TIPO", "NOMBRE", "ETAPA", "BRIEF"],
      h.citas.map((c) => [c.id, hora(c.inicio), c.tipo, c.nombre, c.etapa, c.tiene_brief ? "sí" : "falta"])));
    if (h.citas_sin_hora) partes.push(`${h.citas_sin_hora} invitaciones sin reservar (calidev cita listar).`);
  }
  if (h.tareas) {
    partes.push(titulo(`Tareas abiertas que vencen hasta hoy (${h.tareas.length})`));
    partes.push(tabla(["ID", "VENCE", "ÁREA", "ASIGNADA", "TAREA"], h.tareas.map((t) => [t.id, fechaHora(t.vence_at), t.area, t.asignada ?? "nadie", t.titulo])));
  }
  if (h.oportunidades_vencidas) {
    partes.push(titulo(`Oportunidades con el próximo paso vencido (${h.oportunidades_vencidas.length})`));
    partes.push(tabla(["ID", "ETAPA", "PERSONA", "PASO", "DEBÍA"],
      h.oportunidades_vencidas.map((o) => [o.id, o.etapa, o.persona ?? o.titulo, o.proximo_paso, fechaHora(o.proximo_paso_at)])));
  }
  if (h.aprobaciones) {
    partes.push(titulo(`Aprobaciones pendientes (${h.aprobaciones.total})`));
    partes.push(tabla(["ID", "TIPO", "PIDE", "VISTA PREVIA"], h.aprobaciones.primeras.map((p) => [p.id, p.tipo, p.solicitante, recortar(p.vista_previa, 60)])));
  }
  if (h.embudo) {
    const e = h.embudo;
    partes.push(titulo("Embudo de la semana"));
    partes.push([
      `Conversaciones ${e.conversaciones} · calificados ${e.calificados} · diagnósticos agendados ${e.diagnosticos_agendados} · hechos ${e.diagnosticos_hechos} · propuestas ${e.propuestas}`,
      `Cierres del mes ${e.cierres_mes} de ${e.meta.cierresNecesariosMes} necesarios` +
        (e.tasa_cierre === null ? "" : ` · tasa de cierre ${Math.round(e.tasa_cierre * 100)} %`) +
        (e.meta.diagnosticos_semana_necesarios === null ? "" : ` · hacen falta ${Math.ceil(e.meta.diagnosticos_semana_necesarios)} diagnósticos por semana`),
    ].join("\n"));
  }
  return { datos: h, texto: partes.join("\n") };
}
