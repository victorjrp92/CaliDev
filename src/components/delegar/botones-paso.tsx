"use client";

/**
 * El botón principal de cada paso y el «Atrás».
 *
 * El principal nunca está desactivado por respuestas incompletas: al pulsarlo
 * se muestran los errores y el foco va al primero. Un botón gris sin
 * explicación deja a la persona sin saber qué le falta. Solo se desactiva
 * mientras hay una petición en curso, para no crear dos leads.
 *
 * `id` del botón principal: fijo por paso, para el mapa de calor.
 */
export function BotonesPaso({
  id,
  principal,
  enviando = false,
  onPrincipal,
  onAtras,
}: {
  id: string;
  principal: string;
  enviando?: boolean;
  onPrincipal: () => void;
  onAtras?: () => void;
}) {
  return (
    <div className="mt-7 flex flex-col gap-2.5">
      <button
        id={id}
        type="button"
        onClick={onPrincipal}
        disabled={enviando}
        aria-busy={enviando || undefined}
        className="h-14 w-full cursor-pointer rounded-2xl bg-[var(--lima)] text-base font-bold text-[var(--tinta)] shadow-[0_6px_18px_rgba(10,61,46,0.22)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--verde)] disabled:cursor-wait disabled:opacity-60"
      >
        {enviando ? "Guardando…" : principal}
      </button>
      {onAtras && (
        <button
          type="button"
          onClick={onAtras}
          disabled={enviando}
          className="h-12 w-full cursor-pointer rounded-2xl text-[15px] font-semibold text-[var(--verde)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--verde)] disabled:opacity-50"
        >
          Atrás
        </button>
      )}
    </div>
  );
}

