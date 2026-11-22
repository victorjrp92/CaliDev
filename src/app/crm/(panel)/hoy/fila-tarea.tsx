import { cuando } from "@/lib/crm/formato";
import type { Tarea } from "@/lib/crm/tareas";
import { AccionesTarea } from "./acciones-tarea";

export function FilaTarea({ t, yo, ahora }: { t: Tarea; yo: number; ahora: Date }) {
  const c = cuando(t.vence_at, ahora);
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="font-semibold">{t.titulo}</span>
        <span className="flex flex-wrap items-center gap-2 text-[13px] text-[#46554D]">
          <span className="chip">{t.area}</span>
          {t.vence_at && <span className={c.vencido ? "font-semibold text-[#B42318]" : ""}>{c.vencido ? "vencida " : "vence "}{c.texto}</span>}
          <span>{t.asignada ? `de ${t.asignada}` : "sin asignar"}</span>
        </span>
      </div>
      <AccionesTarea id={t.id} mia={t.asignada_a === yo} />
    </div>
  );
}
