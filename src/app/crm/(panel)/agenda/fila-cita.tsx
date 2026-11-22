import Link from "next/link";
import type { CitaAgenda } from "@/lib/crm/agenda";
import { type Etapa, NOMBRE_ETAPA } from "@/lib/crm/etapas";
import { hora } from "@/lib/crm/formato";

export const NOMBRE_TIPO_CITA = { primera: "1.ª cita", segunda: "2.ª cita", sesion: "Sesión" } as const;

/** Una cita: hora, persona, tipo y etapa, y si ya tiene brief (el agente lo escribe 24 h antes). */
export function FilaCita({ c }: { c: CitaAgenda }) {
  const destino = c.oportunidad_id ? `/crm/ventas/${c.oportunidad_id}` : c.persona_id ? `/crm/contactos/${c.persona_id}` : null;
  const contexto = [NOMBRE_TIPO_CITA[c.tipo], c.etapa ? `etapa ${NOMBRE_ETAPA[c.etapa as Etapa] ?? c.etapa}` : null, c.correo].filter(Boolean).join(" · ");
  const cuerpo = (
    <>
      <span className="hora">{hora(c.inicio)}</span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="fuerte truncate">{c.nombre}</span>
        <span className="nota truncate">{contexto}</span>
      </span>
      {c.tipo !== "sesion" && (c.tiene_brief ? <span className="pill pill-ok">Brief listo</span> : <span className="pill pill-aviso">Sin brief</span>)}
    </>
  );
  return destino ? <Link href={destino} className="fila">{cuerpo}</Link> : <div className="fila">{cuerpo}</div>;
}
