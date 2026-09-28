"use client";

import { useState } from "react";
import { DIAS_ADELANTE, PRIMERA_HORA, ULTIMA_HORA } from "@/lib/citas/horarios";

/**
 * Elegir qué horarios se le ofrecen a una persona: primero el día, después las
 * horas de ese día. Todo en hora de Colombia, que es la de quien recibe la
 * invitación; el resumen de abajo da además la hora de Frankfurt, que es la de
 * Víctor.
 *
 * Una hora que ya reservó otra persona sale bloqueada. Las de hoy que ya
 * pasaron, o empiezan en menos de una hora, no se ofrecen.
 */

const ZONA = "America/Bogota";
const DIA_CHIP = new Intl.DateTimeFormat("es-CO", { weekday: "short", day: "numeric", timeZone: ZONA });
const MES = new Intl.DateTimeFormat("es-CO", { month: "short", timeZone: ZONA });
const HORA = new Intl.DateTimeFormat("es-CO", { hour: "numeric", hour12: true, timeZone: ZONA });
const FRANKFURT = new Intl.DateTimeFormat("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Berlin" });
const HOY_COLOMBIA = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA });

const inicioDe = (id: string) => new Date(`${id}:00:00-05:00`);
const limpiar = (s: string) => s.replace(/\s+/g, " ").replace(/ /g, " ");

function proximosDias(): string[] {
  const hoy = HOY_COLOMBIA.format(new Date());
  const base = new Date(`${hoy}T12:00:00-05:00`);
  return Array.from({ length: DIAS_ADELANTE + 1 }, (_, i) =>
    HOY_COLOMBIA.format(new Date(base.getTime() + i * 24 * 60 * 60 * 1000))
  );
}

export function SelectorHorarios({
  elegidos,
  ocupados,
  onChange,
}: {
  elegidos: string[];
  ocupados: string[];
  onChange: (ids: string[]) => void;
}) {
  // Se calculan una vez al abrir el panel: la lista de días y el «ahora» con el
  // que se bloquean las horas que ya pasaron.
  const [dias] = useState(proximosDias);
  const [ahora] = useState(() => Date.now());
  const [dia, setDia] = useState(dias[1] ?? dias[0]);
  const horas = Array.from({ length: ULTIMA_HORA - PRIMERA_HORA + 1 }, (_, i) => PRIMERA_HORA + i);

  const alternar = (id: string) =>
    onChange(elegidos.includes(id) ? elegidos.filter((x) => x !== id) : [...elegidos, id].sort());

  const porDia = (d: string) => elegidos.filter((id) => id.startsWith(d)).length;
  const fechaDia = (d: string) => new Date(`${d}T12:00:00-05:00`);

  return (
    <div className="sm:col-span-3">
      <p className="text-[13px] font-semibold">
        Horarios que le ofreces <span className="font-normal text-[#46554D]">(1 hora cada uno · hora de Colombia)</span>
      </p>

      <div className="mt-2 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Día">
        {dias.map((d) => {
          const n = porDia(d);
          const activo = d === dia;
          return (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={activo}
              onClick={() => setDia(d)}
              className={`relative flex min-w-[64px] flex-none cursor-pointer flex-col items-center rounded-xl border-[1.5px] px-2 py-1.5 text-[12.5px] leading-tight ${
                activo ? "border-[var(--verde)] bg-[var(--verde)] text-[var(--hueso)]" : "border-[#D8DCD4] bg-white"
              }`}
            >
              <span className="font-semibold capitalize">{limpiar(DIA_CHIP.format(fechaDia(d)))}</span>
              <span className={activo ? "text-[var(--lima)]" : "text-[#46554D]"}>{limpiar(MES.format(fechaDia(d)))}</span>
              {n > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--lima)] px-1 text-[11px] font-bold text-[var(--tinta)]">
                  {n}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8">
        {horas.map((hora) => {
          const id = `${dia}T${String(hora).padStart(2, "0")}`;
          const inicio = inicioDe(id);
          const pasado = inicio.getTime() - ahora <= 60 * 60 * 1000;
          const ocupado = ocupados.includes(id);
          const marcado = elegidos.includes(id);
          const bloqueado = pasado || ocupado;
          return (
            <button
              key={id}
              type="button"
              disabled={bloqueado}
              aria-pressed={marcado}
              onClick={() => alternar(id)}
              title={`${limpiar(FRANKFURT.format(inicio))} en Frankfurt`}
              className={`h-10 rounded-lg border-[1.5px] text-[13px] font-semibold ${
                bloqueado
                  ? "cursor-not-allowed border-[#E6E8E3] bg-[#F1F2EE] text-[#8C948D] line-through"
                  : marcado
                    ? "cursor-pointer border-[var(--verde)] bg-[var(--lima)] text-[var(--tinta)]"
                    : "cursor-pointer border-[#D8DCD4] bg-white hover:border-[var(--verde)]"
              }`}
            >
              {limpiar(HORA.format(inicio))}
            </button>
          );
        })}
      </div>

      {elegidos.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {elegidos.map((id) => {
            const inicio = inicioDe(id);
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => alternar(id)}
                  className="cursor-pointer rounded-full bg-[#E6E8E3] px-2.5 py-1 text-[12.5px] text-[#14201B] hover:bg-[#FDF0EE]"
                  aria-label={`Quitar ${id}`}
                >
                  <span className="capitalize">{limpiar(DIA_CHIP.format(inicio))}</span> · {limpiar(HORA.format(inicio))}
                  <span className="text-[#46554D]"> ({limpiar(FRANKFURT.format(inicio))} Frankfurt)</span> ×
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 text-[13px] text-[#46554D]">Elige un día y marca las horas que quieres ofrecer.</p>
      )}
    </div>
  );
}
