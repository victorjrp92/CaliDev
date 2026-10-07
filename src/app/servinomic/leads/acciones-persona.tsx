"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InvitarCita } from "./invitar-cita";

/**
 * Lo que se puede hacer desde una ficha: invitarla a la cita que le toca (con
 * nombre y correo ya puestos), marcar la etapa que solo Víctor conoce y
 * escribir una nota. Todo se guarda al momento.
 */
type Etapa = "propuesta" | "ganado" | "perdido" | "pausa";

const BOTONES: { etapa: Etapa; texto: string }[] = [
  { etapa: "propuesta", texto: "Propuesta enviada" },
  { etapa: "ganado", texto: "Ganado" },
  { etapa: "perdido", texto: "Perdido" },
  { etapa: "pausa", texto: "En pausa" },
];

export function AccionesPersona({
  clave,
  nombre,
  correo,
  invitarA,
  etapaActual,
  notaInicial,
  ocupados,
}: {
  clave: string;
  nombre: string;
  correo: string | null;
  /** Qué cita le toca: `null` si ya no le toca ninguna. */
  invitarA: "primera" | "segunda" | null;
  etapaActual: Etapa | null;
  notaInicial: string;
  ocupados: string[];
}) {
  const router = useRouter();
  const [invitando, setInvitando] = useState(false);
  const [nota, setNota] = useState(notaInicial);
  const [guardado, setGuardado] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function enviar(datos: Record<string, unknown>, aviso: string) {
    setOcupado(true);
    const res = await fetch("/servinomic/leads/seguimiento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clave, ...datos }),
    }).catch(() => null);
    setOcupado(false);
    setGuardado(res?.ok ? aviso : "No se pudo guardar.");
    if (res?.ok) router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {invitarA && correo && !invitando && (
          <button
            type="button"
            onClick={() => setInvitando(true)}
            className="h-9 cursor-pointer rounded-lg bg-[var(--lima)] px-3.5 text-[13px] font-bold text-[var(--tinta)]"
          >
            {invitarA === "primera" ? "Invitar a la 1.ª videollamada" : "Invitar a la 2.ª cita"}
          </button>
        )}
        {BOTONES.map((b) => {
          const activa = etapaActual === b.etapa;
          return (
            <button
              key={b.etapa}
              type="button"
              disabled={ocupado}
              aria-pressed={activa}
              onClick={() => enviar({ etapa: activa ? null : b.etapa }, activa ? "Etapa quitada." : `Marcado: ${b.texto}.`)}
              className={`h-9 cursor-pointer rounded-lg border px-3 text-[13px] font-semibold disabled:opacity-60 ${
                activa
                  ? "border-[var(--verde)] bg-[var(--verde)] text-[var(--hueso)]"
                  : "border-[#D8DCD4] bg-white text-[#2C3A33] hover:border-[var(--verde)]"
              }`}
            >
              {b.texto}
            </button>
          );
        })}
      </div>

      {invitando && invitarA && (
        <div className="rounded-xl border border-[#D8DCD4] bg-[#FAFAF7] p-3">
          <InvitarCita tipo={invitarA} ocupados={ocupados} nombreInicial={nombre} correoInicial={correo ?? ""} />
          <button type="button" onClick={() => setInvitando(false)} className="mt-2 h-8 cursor-pointer text-[13px] text-[#46554D]">
            Cerrar
          </button>
        </div>
      )}

      <label className="text-[13px] font-semibold">
        Nota
        <textarea
          className="mt-1 min-h-[60px] w-full rounded-lg border-[1.5px] border-[#D8DCD4] bg-white px-3 py-2 text-[14.5px] font-normal outline-none focus:border-[var(--verde)]"
          value={nota}
          maxLength={2000}
          onChange={(e) => setNota(e.target.value)}
          onBlur={() => nota !== notaInicial && enviar({ nota }, "Nota guardada.")}
          placeholder="Qué dijo, qué objeción puso, qué quedó pendiente…"
        />
      </label>
      {guardado && <p role="status" className="text-[12.5px] text-[#46554D]">{guardado}</p>}
    </div>
  );
}
