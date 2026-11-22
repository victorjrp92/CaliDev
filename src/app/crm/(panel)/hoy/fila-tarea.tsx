import { cuando } from "@/lib/crm/formato";
import type { Tarea } from "@/lib/crm/tareas";
import { AccionesTarea } from "./acciones-tarea";

export function FilaTarea({ t, yo, ahora }: { t: Tarea; yo: number; ahora: Date }) {
  const c = cuando(t.vence_at, ahora);
  return (
    <div className="fila !items-start">
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="fuerte">{t.titulo}</span>
        <span className="nota">
          {t.area}
          {t.vence_at && <> · <span className={c.vencido ? "font-semibold text-[var(--peligro)]" : ""}>{c.vencido ? "vencida " : "vence "}{c.texto}</span></>}
          {" · "}{t.asignada ? (t.asignada_a === yo ? "tuya" : `de ${t.asignada}`) : "sin asignar"}
        </span>
      </span>
      <AccionesTarea id={t.id} mia={t.asignada_a === yo} />
    </div>
  );
}
