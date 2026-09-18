"use client";

import { valoresDe, type Question } from "@/lib/leads";

/**
 * Una pregunta del filtro como lista de opciones tocables.
 *
 * Botones grandes en vez de <select>: casi todo el tráfico llega desde
 * Instagram en móvil, y un tap sobre un área amplia convierte bastante mejor
 * que desplegar una lista nativa. Cada fila supera los 48px de alto.
 *
 * Dos formas según la pregunta, y la diferencia se ve antes de leer nada:
 * círculo cuando solo cabe una respuesta, cuadrado con palomita cuando caben
 * varias. Es la convención que todo el mundo trae aprendida de cualquier otro
 * formulario; explicarla con un texto sería suplir con palabras lo que la forma
 * ya dice.
 *
 * Una opción `exclusiva` —"todo funciona bien como está"— desmarca al resto al
 * elegirla, y se desmarca sola si después se marca cualquier otra. Sin eso se
 * podría enviar "uso libretas" y "todo funciona bien" a la vez, que es una
 * contradicción que luego hay que resolver a mano leyendo la fila.
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
  const seleccionados = valoresDe(value);
  const multi = Boolean(question.multi);

  const alternar = (opcion: Question["options"][number]) => {
    if (!multi) return onChange(opcion.value);

    const yaEsta = seleccionados.includes(opcion.value);
    if (opcion.exclusiva) return onChange(yaEsta ? "" : opcion.value);

    const exclusivas = question.options
      .filter((o) => o.exclusiva)
      .map((o) => o.value);

    const siguiente = yaEsta
      ? seleccionados.filter((v) => v !== opcion.value)
      : [...seleccionados.filter((v) => !exclusivas.includes(v)), opcion.value];

    // Se guardan en el orden en que están declaradas y no en el que la persona
    // los tocó: así dos leads con las mismas marcas producen la misma cadena y
    // el panel se puede agrupar por ella.
    const ordenados = question.options
      .map((o) => o.value)
      .filter((v) => siguiente.includes(v));

    onChange(ordenados.join(","));
  };

  return (
    <fieldset className="border-0 p-0">
      <legend className="text-xl font-extrabold leading-snug tracking-tight">
        {question.label}
      </legend>
      {question.help && (
        <p className="mt-1.5 text-sm text-[#77847C]">{question.help}</p>
      )}

      <div
        className="mt-4 flex flex-col gap-2.5"
        role={multi ? "group" : undefined}
      >
        {question.options.map((option) => {
          const selected = seleccionados.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => alternar(option)}
              aria-pressed={selected}
              className={`flex min-h-[52px] w-full cursor-pointer items-center gap-3 rounded-2xl border-[1.5px] px-4 py-3.5 text-left text-[15px] transition-colors ${
                selected
                  ? "border-[#0A3D2E] bg-[#E6E8E3]"
                  : "border-[#D8DCD4] bg-white"
              }`}
            >
              <Marca multi={multi} selected={selected} />
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * El indicador de la izquierda. Redondo para una sola respuesta, cuadrado con
 * palomita para varias.
 *
 * La palomita es un SVG y no el carácter «✓»: ese se pinta distinto en cada
 * sistema y en algunos Android sale con su propio color, que rompe el verde.
 */
function Marca({ multi, selected }: { multi: boolean; selected: boolean }) {
  if (!multi) {
    return (
      <span
        aria-hidden="true"
        className={`h-5 w-5 flex-shrink-0 rounded-full border-2 ${
          selected
            ? "border-[#0A3D2E] bg-[#0A3D2E] shadow-[inset_0_0_0_3px_#fff]"
            : "border-[#C6CCC3]"
        }`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`grid h-5 w-5 flex-shrink-0 place-items-center rounded-[6px] border-2 ${
        selected ? "border-[#0A3D2E] bg-[#0A3D2E]" : "border-[#C6CCC3]"
      }`}
    >
      {selected && (
        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
          <path
            d="M2.5 6.2 4.8 8.5 9.5 3.8"
            stroke="#FAFAF7"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}
