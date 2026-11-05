"use client";

import { useRef, useState } from "react";
import { CitaConfirmada } from "@/components/citas/cita-confirmada";

export type EstadoHorario = "libre" | "ocupado" | "pasado";
export type GrupoHorarios = {
  dia: string;
  horarios: { id: string; hora: string; descripcion: string; estado: EstadoHorario }[];
};
type Reserva = { id: string; descripcion: string; google: string };

/**
 * Elegir y confirmar la hora.
 *
 * Elegir solo marca; reservar exige pulsar «Confirmar». Los horarios ocupados o
 * pasados se ven pero no se pueden tocar, para que la persona entienda por qué
 * no están en vez de pensar que faltan.
 *
 * Si otra persona toma la hora mientras esta decide, el servidor responde
 * `ocupado`: ese botón pasa a ocupado y se le pide elegir otra.
 */
export function ElegirHorario({
  token,
  grupos: gruposIniciales,
  inicial,
  reservado,
  nombreCita,
  siguiente,
}: {
  token: string;
  grupos: GrupoHorarios[];
  inicial: string | null;
  reservado: Reserva | null;
  /** Cómo se llama esta cita en los botones: «videollamada» o «Sesión 1 de 3». */
  nombreCita: string;
  /** La siguiente sesión sin hora, si la hay. */
  siguiente: { rotulo: string; enlace: string } | null;
}) {
  const [grupos, setGrupos] = useState(gruposIniciales);
  const libre = (id: string | null) =>
    grupos.some((g) => g.horarios.some((h) => h.id === id && h.estado === "libre"));
  const [elegido, setElegido] = useState<string | null>(libre(inicial) ? inicial : null);
  const [reserva, setReserva] = useState<Reserva | null>(reservado);
  const [cambiando, setCambiando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enCurso = useRef(false);

  const descripcion = grupos.flatMap((g) => g.horarios).find((h) => h.id === elegido)?.descripcion;

  async function confirmar() {
    if (!elegido || enCurso.current) return;
    enCurso.current = true;
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch("/api/citas/reservar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, horario: elegido }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        if (json.ocupado) {
          setGrupos((gs) =>
            gs.map((g) => ({
              ...g,
              horarios: g.horarios.map((h) => (h.id === elegido ? { ...h, estado: "ocupado" } : h)),
            }))
          );
          setElegido(null);
        }
        setError(json.error || "No pudimos guardar tu reserva. Inténtalo de nuevo.");
        return;
      }
      setReserva({ id: elegido, descripcion: json.descripcion, google: json.google });
      setCambiando(false);
    } catch {
      setError("No pudimos guardar tu reserva. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      enCurso.current = false;
      setEnviando(false);
    }
  }

  if (reserva && !cambiando) {
    return <CitaConfirmada token={token} reserva={reserva} nombreCita={nombreCita} siguiente={siguiente} onCambiar={() => setCambiando(true)} />;
  }

  return (
    <section className="mt-8">
      <p className="mono text-[#46554D]">Hora de Colombia</p>
      <div className="mt-4 flex flex-col gap-6">
        {grupos.map((g) => (
          <fieldset key={g.dia} className="border-0 p-0">
            <legend className="text-[17px] font-bold">{g.dia}</legend>
            <div className="mt-2.5 grid grid-cols-3 gap-2.5">
              {g.horarios.map((h) => {
                const marcado = elegido === h.id;
                const bloqueado = h.estado !== "libre";
                return (
                  <button
                    key={h.id}
                    type="button"
                    disabled={bloqueado}
                    aria-pressed={marcado}
                    onClick={() => {
                      setElegido(h.id);
                      setError(null);
                    }}
                    className={`flex h-14 flex-col items-center justify-center rounded-2xl border-[1.5px] text-[15px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--verde)] ${
                      bloqueado
                        ? "cursor-not-allowed border-[#E6E8E3] bg-[#F1F2EE] text-[#8C948D] line-through"
                        : marcado
                          ? "border-[var(--verde)] bg-[var(--verde)] text-[var(--hueso)]"
                          : "cursor-pointer border-[#D8DCD4] bg-white hover:border-[var(--verde)]"
                    }`}
                  >
                    {h.hora}
                    {h.estado === "ocupado" && <span className="text-[11px] font-normal no-underline">ocupado</span>}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-2xl border border-[#F1C4BE] bg-[#FDF0EE] px-4 py-3 text-[15px] font-medium text-[#B42318]">
          {error}
        </p>
      )}

      <div className="sticky bottom-0 -mx-5 mt-8 border-t border-[#D8DCD4] bg-[#FAFAF7]/95 px-5 pb-[calc(14px+env(safe-area-inset-bottom))] pt-3.5 backdrop-blur-md">
        <p className="min-h-[1.5em] text-[14.5px] text-[#2C3A33]">
          {descripcion ? <strong>{descripcion}</strong> : "Elige un horario."}
        </p>
        <button
          type="button"
          onClick={confirmar}
          disabled={!elegido || enviando}
          className="mt-2.5 h-14 w-full cursor-pointer rounded-2xl bg-[var(--lima)] text-base font-bold text-[var(--tinta)] shadow-[0_6px_18px_rgba(10,61,46,0.22)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--verde)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enviando ? "Confirmando…" : cambiando ? "Confirmar el cambio" : `Confirmar ${nombreCita === "videollamada" ? nombreCita : nombreCita.toLowerCase()}`}
        </button>
        {cambiando && (
          <button
            type="button"
            onClick={() => setCambiando(false)}
            className="mt-1.5 h-11 w-full cursor-pointer text-[15px] font-semibold text-[var(--verde)]"
          >
            Mantener mi hora actual
          </button>
        )}
      </div>
    </section>
  );
}
