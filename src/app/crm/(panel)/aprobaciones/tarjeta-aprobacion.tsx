import Link from "next/link";
import type { Aprobacion } from "@/lib/crm/aprobaciones";
import { fechaHora } from "@/lib/crm/formato";
import { DecidirAprobacion } from "./decidir-aprobacion";

const TONO: Record<string, string | undefined> = { pendiente: "lima", ejecutada: "verde", aprobada: "verde", rechazada: "alerta", fallida: "alerta" };
const ENLACE: Record<string, string> = { persona: "/crm/contactos/", oportunidad: "/crm/ventas/" };

/** Una solicitud: qué se va a hacer, quién la pidió y, si sigue pendiente y puedo, los botones. */
export function TarjetaAprobacion({ a, decidir }: { a: Aprobacion; decidir: boolean }) {
  const enlace = a.entidad && a.entidad_id && ENLACE[a.entidad] ? `${ENLACE[a.entidad]}${a.entidad_id}` : null;
  return (
    <article id={`a${a.id}`} className={`bloque flex scroll-mt-28 flex-col gap-4 px-4 py-4 ${a.estado === "pendiente" ? "border-l-4 border-l-[var(--lima)]" : ""}`}>
      <header className="flex flex-wrap items-center gap-2">
        <span className="mono font-semibold">{a.tipo.replaceAll("_", " ")}</span>
        <span className="chip" data-tono={TONO[a.estado]}>{a.estado}</span>
        <span className="text-[13px] text-[#5F6B64]">#{a.id} · pidió {a.solicitante ?? "—"} · {fechaHora(a.created_at)}</span>
        {enlace && <Link href={enlace} className="ml-auto text-[13px] font-medium text-[var(--verde)] underline-offset-4 hover:underline">Ver {a.entidad}</Link>}
      </header>
      <p className="whitespace-pre-wrap break-words rounded-xl bg-[var(--niebla)] px-4 py-3 text-[15px] leading-relaxed">{a.vista_previa}</p>
      {a.estado === "pendiente" && decidir && <DecidirAprobacion id={a.id} payload={a.payload} />}
      {a.estado !== "pendiente" && (
        <p className="text-[13.5px] text-[#46554D]">
          {a.decidido ? `Decidió ${a.decidido}` : "Decidida"} · {fechaHora(a.decidido_at)}{a.motivo ? ` · «${a.motivo}»` : ""}
        </p>
      )}
      {a.estado === "fallida" && a.resultado != null && (
        <pre className="mono !normal-case !tracking-normal overflow-x-auto rounded-xl bg-[#FDE7E4] px-3 py-2 text-[12.5px] text-[#8A1C12]">{JSON.stringify(a.resultado, null, 2)}</pre>
      )}
    </article>
  );
}
