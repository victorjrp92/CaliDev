"use client";

import { valoresDelegar, type PreguntaDelegar } from "@/lib/delegar/preguntas";

/**
 * Una pregunta como grupo de opciones con inputs REALES: radio para una sola
 * respuesta y checkbox para varias.
 *
 * El input va oculto a la vista pero no al teclado ni al lector de pantalla
 * (`sr-only`): se navega con flechas y Tab como cualquier formulario, y la
 * tarjeta grande es su etiqueta, así que tocar cualquier parte la marca.
 *
 * Círculo cuando cabe una respuesta, cuadrado con palomita cuando caben varias:
 * la forma ya lo dice antes de leer la ayuda.
 *
 * El error va junto a la pregunta y el grupo lo anuncia con
 * `aria-describedby`. El `id` del primer input es `${id}-0`: es a donde se
 * lleva el foco cuando esta es la primera pregunta por corregir.
 */
export function GrupoOpciones({
  id,
  pregunta,
  valor,
  error,
  onChange,
}: {
  id: string;
  pregunta: PreguntaDelegar;
  valor: string | undefined;
  error?: string;
  onChange: (valor: string) => void;
}) {
  const elegidos = valoresDelegar(valor);
  const multi = Boolean(pregunta.multi);
  const describe = [pregunta.ayuda ? `${id}-ayuda` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ");

  const cambiar = (opcion: string, marcado: boolean) => {
    if (!multi) return onChange(opcion);
    const siguiente = marcado ? [...elegidos, opcion] : elegidos.filter((v) => v !== opcion);
    // En el orden declarado, no en el de los toques: misma marca, misma cadena.
    onChange(
      pregunta.opciones
        .map((o) => o.value)
        .filter((v) => siguiente.includes(v))
        .join(",")
    );
  };

  return (
    <fieldset className="min-w-0 border-0 p-0" aria-describedby={describe || undefined}>
      <legend className="text-[19px] font-extrabold leading-snug tracking-tight">
        {pregunta.label}
      </legend>
      {pregunta.ayuda && (
        <p id={`${id}-ayuda`} className="mt-1 text-[14.5px] text-[#46554D]">
          {pregunta.ayuda}
        </p>
      )}
      <div className="mt-3.5 flex flex-col gap-2.5">
        {pregunta.opciones.map((opcion, i) => {
          const marcado = elegidos.includes(opcion.value);
          return (
            <label
              key={opcion.value}
              className={`group flex min-h-[54px] cursor-pointer items-center gap-3 rounded-2xl border-[1.5px] px-4 py-3.5 text-[16px] leading-snug transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--verde)]/40 ${
                marcado
                  ? "border-[#0A3D2E] bg-[#E6E8E3]"
                  : error
                    ? "border-[#E3A39B] bg-white"
                    : "border-[#D8DCD4] bg-white"
              }`}
            >
              <input
                id={`${id}-${i}`}
                type={multi ? "checkbox" : "radio"}
                name={id}
                value={opcion.value}
                checked={marcado}
                onChange={(e) => cambiar(opcion.value, e.target.checked)}
                aria-invalid={error ? true : undefined}
                className="sr-only"
              />
              <Marca multi={multi} marcado={marcado} />
              {opcion.label}
            </label>
          );
        })}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-2 text-[14.5px] font-medium text-[#B42318]">
          {error}
        </p>
      )}
    </fieldset>
  );
}

function Marca({ multi, marcado }: { multi: boolean; marcado: boolean }) {
  if (!multi) {
    return (
      <span
        aria-hidden="true"
        className={`h-5 w-5 flex-none rounded-full border-2 ${
          marcado ? "border-[#0A3D2E] bg-[#0A3D2E] shadow-[inset_0_0_0_3px_#fff]" : "border-[#9AA39C]"
        }`}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`grid h-5 w-5 flex-none place-items-center rounded-[6px] border-2 ${
        marcado ? "border-[#0A3D2E] bg-[#0A3D2E]" : "border-[#9AA39C]"
      }`}
    >
      {marcado && (
        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
          <path d="M2.5 6.2 4.8 8.5 9.5 3.8" stroke="#FAFAF7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}
