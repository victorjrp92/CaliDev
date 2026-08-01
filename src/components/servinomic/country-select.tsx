"use client";

/**
 * Selector que aparece cuando la visitante elige un país distinto de Colombia.
 *
 * Saber cuál es cambia la conversación: el producto listo está hecho para las
 * reglas colombianas, así que fuera de Colombia el camino es un sistema a
 * medida. Preguntarlo aquí evita descubrirlo en la llamada.
 */
export function CountrySelect({
  countries,
  value,
  onChange,
}: {
  countries: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="mt-3 block">
      <span className="text-sm font-semibold text-[#4A5A53]">
        ¿Cuál país?
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 h-14 w-full cursor-pointer rounded-2xl border-[1.5px] border-[#E7E1D7] bg-white px-4 text-[15px] outline-none transition-colors focus:border-[#0E7A5F]"
      >
        <option value="">Selecciona tu país</option>
        {countries.map((country) => (
          <option key={country} value={country}>
            {country}
          </option>
        ))}
        <option value="Otro">Otro</option>
      </select>
    </label>
  );
}
