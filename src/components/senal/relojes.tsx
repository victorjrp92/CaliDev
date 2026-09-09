"use client";

import { useEffect, useState } from "react";

export type Huso = { tz: string; etiqueta: string };

/** Los tres husos donde hay alguien del equipo despierto. */
export const HUSOS: Huso[] = [
  { tz: "America/Bogota", etiqueta: "CALI" },
  { tz: "Europe/Berlin", etiqueta: "FRANKFURT" },
  { tz: "Australia/Sydney", etiqueta: "SÍDNEY" },
];

/**
 * Hora en vivo.
 *
 * Arranca en `null` y solo empieza a contar en el cliente: si el servidor
 * pintara una hora, React marcaría desajuste de hidratación en el primer
 * segundo. El primer valor se pide en el siguiente fotograma y no en el cuerpo
 * del efecto, para no encadenar un render extra antes de pintar.
 */
export function useHoraViva() {
  const [ahora, setAhora] = useState<Date | null>(null);

  useEffect(() => {
    const tic = () => setAhora(new Date());
    const primero = requestAnimationFrame(tic);
    const reloj = setInterval(tic, 1000);
    return () => {
      cancelAnimationFrame(primero);
      clearInterval(reloj);
    };
  }, []);

  return (tz: string) => {
    if (!ahora) return "--:--:--";
    try {
      return new Intl.DateTimeFormat("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: tz,
        hour12: false,
      }).format(ahora);
    } catch {
      return "--:--:--";
    }
  };
}

/**
 * Los tres relojes en una fila o en una columna.
 *
 * El punto de acento va solo en el primero y significa algo: la hora está
 * viva. Se reutiliza en el hero, en el pie, en el cierre y en contacto — es lo
 * que hace que «estamos en tres husos» sea un hecho comprobable y no una frase.
 */
export function Relojes({
  direccion = "columna",
  className = "",
  colorAcento = "var(--lima)",
}: {
  direccion?: "columna" | "fila";
  className?: string;
  colorAcento?: string;
}) {
  const hora = useHoraViva();

  return (
    <ul
      className={`mono flex ${direccion === "columna" ? "flex-col gap-2.5" : "flex-wrap gap-x-7 gap-y-2"} ${className}`}
    >
      {HUSOS.map(({ tz, etiqueta }, i) => (
        <li key={tz} className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 flex-none rounded-full"
            style={{ background: i === 0 ? colorAcento : "transparent" }}
          />
          <span className="font-medium tabular-nums">{hora(tz)}</span>
          <span className="opacity-70">{etiqueta}</span>
        </li>
      ))}
    </ul>
  );
}
