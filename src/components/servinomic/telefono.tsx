"use client";

import { INDICATIVOS, indicativoPorIso } from "@/lib/indicativos";

/**
 * WhatsApp en dos piezas: el indicativo se elige, el número se escribe.
 *
 * Antes era un solo campo libre con el ejemplo «+57 300 000 0000» de marcador
 * de posición, y ahí el prefijo se escribe mal de todas las maneras posibles:
 * sin el `+`, con `0057`, con el `0` de larga distancia nacional delante, o
 * directamente sin indicativo porque «es obvio que soy de aquí». Un número así
 * no abre `wa.me` y hay que adivinarlo a mano antes de escribir.
 *
 * Con la lista no hay margen: el prefijo sale de un menú y el campo solo admite
 * dígitos. Y de paso el país deja de ser una pregunta del formulario, porque ya
 * está aquí.
 *
 * Es un `<select>` nativo y no una lista pintada: con treinta y siete países en
 * un móvil, el selector del sistema es más rápido que cualquier cosa que
 * hagamos, se puede escribir para saltar, y ya lo sabe usar todo el mundo.
 *
 * Colombia viene puesta por defecto. El sesgo por defecto es real y aquí juega
 * a favor: la mayoría no tiene que tocar nada, y quien no es de Colombia lo
 * cambia en un toque.
 *
 * 16px de letra en los dos: por debajo, iOS hace zoom al enfocar y descoloca la
 * página entera.
 */
export function CampoTelefono({
  iso,
  numero,
  onIso,
  onNumero,
}: {
  iso: string;
  numero: string;
  onIso: (iso: string) => void;
  onNumero: (numero: string) => void;
}) {
  const actual = indicativoPorIso(iso);

  return (
    <div>
      <label htmlFor="whatsapp-numero" className="mb-1.5 block text-[13.5px] font-semibold">
        WhatsApp
        <span className="ml-1 text-[var(--verde)]" aria-hidden="true">
          *
        </span>
        <span className="sr-only"> (obligatorio)</span>
      </label>

      <div className="flex gap-2">
        <div className="relative">
          <select
            aria-label="Indicativo del país"
            value={iso}
            onChange={(e) => onIso(e.target.value)}
            className="h-14 w-[118px] cursor-pointer appearance-none rounded-2xl border-[1.5px] border-[#D8DCD4] bg-white pl-4 pr-8 text-[16px] outline-none transition-colors focus:border-[var(--verde)] focus:ring-2 focus:ring-[var(--verde)]/25"
          >
            {INDICATIVOS.map((i) => (
              <option key={i.iso} value={i.iso}>
                {i.codigo} {i.pais}
              </option>
            ))}
          </select>
          {/* El select nativo, recortado a 118px, enseñaría «+57 Colom…»: el
              nombre del país no cabe y se corta a media palabra. Encima va una
              capa opaca que lo tapa ENTERO y escribe solo el prefijo, que es lo
              único que hay que confirmar de un vistazo; el país se lee al
              desplegar.

              `inset-[2px]` y no `inset-0` para dejar ver el borde de abajo, que
              es el que se pone verde al enfocar. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-[2px] flex items-center rounded-[14px] bg-white pl-[14px] text-[16px]"
          >
            {actual?.codigo ?? "+57"}
          </span>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-3 z-10 flex items-center text-[#77847C]"
          >
            <svg viewBox="0 0 12 8" className="h-2.5 w-3" fill="none">
              <path
                d="M1 1.5 6 6.5 11 1.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>

        <input
          id="whatsapp-numero"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          required
          placeholder="300 000 0000"
          value={numero}
          aria-describedby="whatsapp-ayuda"
          // Solo dígitos y espacios. Se filtra al escribir en vez de avisar
          // después: un error que no se puede cometer no necesita mensaje.
          onChange={(e) => onNumero(e.target.value.replace(/[^\d\s]/g, ""))}
          className="h-14 min-w-0 flex-1 rounded-2xl border-[1.5px] border-[#D8DCD4] bg-white px-4 text-[16px] outline-none transition-colors placeholder:text-[#8C948D] focus:border-[var(--verde)] focus:ring-2 focus:ring-[var(--verde)]/25"
        />
      </div>

      <p id="whatsapp-ayuda" className="mt-1.5 text-[12.5px] text-[#77847C]">
        Te escribimos por ahí. Nunca llamamos sin avisar y no compartimos tu
        número.
      </p>
    </div>
  );
}
