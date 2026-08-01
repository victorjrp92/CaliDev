"use client";

import type { Question } from "@/lib/leads";

/**
 * Una pregunta del filtro como lista de opciones tocables.
 *
 * Botones grandes en vez de <select>: casi todo el tráfico llega desde
 * Instagram en móvil, y un tap sobre un área amplia convierte bastante mejor
 * que desplegar una lista nativa. Cada fila supera los 48px de alto.
 */
export function OptionGroup({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string | undefined;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="text-xl font-extrabold leading-snug tracking-tight">
        {question.label}
      </legend>
      {question.help && (
        <p className="mt-1.5 text-sm text-[#87938C]">{question.help}</p>
      )}

      <div className="mt-4 flex flex-col gap-2.5">
        {question.options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={selected}
              className={`flex min-h-[52px] w-full cursor-pointer items-center gap-3 rounded-2xl border-[1.5px] px-4 py-3.5 text-left text-[15px] transition-colors ${
                selected
                  ? "border-[#0E7A5F] bg-[#E6F4EF]"
                  : "border-[#E7E1D7] bg-white"
              }`}
            >
              <span
                className={`h-5 w-5 flex-shrink-0 rounded-full border-2 ${
                  selected
                    ? "border-[#0E7A5F] bg-[#0E7A5F] shadow-[inset_0_0_0_3px_#fff]"
                    : "border-[#CFC7BB]"
                }`}
              />
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
