"use client";

import { INDICATIVOS, indicativoPorIso } from "@/lib/indicativos";

/**
 * WhatsApp en dos piezas: el indicativo se elige de una lista (Colombia por
 * defecto) y el número se escribe. El país sale del indicativo.
 *
 * Al pegar se aceptan espacios, guiones, paréntesis y hasta el indicativo
 * delante: la limpieza la hace lib/delegar/telefono.ts al validar, así que
 * aquí no se borra nada de lo que la persona escribe.
 *
 * El `<select>` nativo va tapado por una capa que muestra solo el prefijo: a
 * 118 px el nombre del país se cortaría a media palabra.
 */
export function CampoWhatsapp({
  iso,
  numero,
  error,
  onIso,
  onNumero,
}: {
  iso: string;
  numero: string;
  error?: string;
  onIso: (iso: string) => void;
  onNumero: (numero: string) => void;
}) {
  const actual = indicativoPorIso(iso);
  const describe = ["d-numero-ayuda", error ? "d-numero-error" : null].filter(Boolean).join(" ");

  return (
    <div>
      <label htmlFor="d-numero" className="mb-1.5 block text-[15px] font-semibold">
        WhatsApp
        <span className="ml-1 text-[var(--verde)]" aria-hidden="true">*</span>
        <span className="sr-only"> (obligatorio)</span>
      </label>
      <div className="flex gap-2">
        <div className="relative">
          <select
            aria-label="Indicativo del país"
            value={iso}
            onChange={(e) => onIso(e.target.value)}
            className="h-14 w-[118px] cursor-pointer appearance-none rounded-2xl border-[1.5px] border-[#D8DCD4] bg-white pl-4 pr-8 text-[16px] outline-none focus:border-[var(--verde)] focus:ring-2 focus:ring-[var(--verde)]/25"
          >
            {INDICATIVOS.map((i) => (
              <option key={i.iso} value={i.iso}>
                {i.codigo} {i.pais}
              </option>
            ))}
          </select>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-[2px] flex items-center rounded-[14px] bg-white pl-[14px] text-[16px]"
          >
            {actual?.codigo ?? "+57"}
          </span>
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 z-10 flex items-center text-[#46554D]">
            <svg viewBox="0 0 12 8" className="h-2.5 w-3" fill="none">
              <path d="M1 1.5 6 6.5 11 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
        <input
          id="d-numero"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="300 000 0000"
          value={numero}
          aria-invalid={error ? true : undefined}
          aria-describedby={describe}
          onChange={(e) => onNumero(e.target.value.slice(0, 24))}
          className={`h-14 min-w-0 flex-1 rounded-2xl border-[1.5px] bg-white px-4 text-[16px] outline-none placeholder:text-[#7A847D] focus:border-[var(--verde)] focus:ring-2 focus:ring-[var(--verde)]/25 ${
            error ? "border-[#B42318]" : "border-[#D8DCD4]"
          }`}
        />
      </div>
      <p id="d-numero-ayuda" className="mt-1.5 text-[14px] leading-snug text-[#46554D]">
        Usaremos este número para contactarte sobre tu solicitud. Si hace falta una llamada, primero
        la acordamos.
      </p>
      {error && (
        <p id="d-numero-error" className="mt-1.5 text-[14.5px] font-medium text-[#B42318]">
          {error}
        </p>
      )}
    </div>
  );
}
