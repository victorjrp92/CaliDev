import Link from "next/link";
import type { CitaAgenda } from "@/lib/crm/agenda";
import { hora } from "@/lib/crm/formato";
import { EtiquetaEtapa } from "../etiqueta-etapa";

export const NOMBRE_TIPO_CITA = { primera: "1.ª cita", segunda: "2.ª cita", sesion: "Sesión" } as const;

/** Una cita: hora, persona, tipo y si ya tiene brief (el agente lo escribe 24 h antes). */
export function FilaCita({ c }: { c: CitaAgenda }) {
  const destino = c.oportunidad_id ? `/crm/ventas/${c.oportunidad_id}` : c.persona_id ? `/crm/contactos/${c.persona_id}` : null;
  const cuerpo = (
    <>
      <span className="cifra w-[4.6rem] shrink-0 pt-0.5 text-[14px] font-semibold">{hora(c.inicio)}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{c.nombre}</span>
          <span className="chip">{NOMBRE_TIPO_CITA[c.tipo]}</span>
          <EtiquetaEtapa etapa={c.etapa} />
          {c.tipo !== "sesion" && (c.tiene_brief ? <span className="chip" data-tono="lima">Brief listo</span> : <span className="chip" data-tono="alerta">Sin brief</span>)}
        </span>
        <span className="truncate text-[13.5px] text-[#46554D]">{c.correo}</span>
      </span>
    </>
  );
  return destino ? (
    <Link href={destino} className="flex gap-3 px-4 py-3 hover:bg-[var(--hueso)]">{cuerpo}</Link>
  ) : (
    <div className="flex gap-3 px-4 py-3">{cuerpo}</div>
  );
}
