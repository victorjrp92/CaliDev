"use client";

/**
 * Campo de texto con etiqueta visible, ayuda y error junto al campo.
 *
 * 16 px de letra: por debajo, iOS hace zoom al enfocar y descoloca la página.
 * Lo opcional se dice en la etiqueta; lo obligatorio lleva asterisco y texto
 * para lector de pantalla.
 */
export function CampoTexto({
  id,
  etiqueta,
  opcional = false,
  ayuda,
  error,
  ...props
}: {
  id: string;
  etiqueta: string;
  opcional?: boolean;
  ayuda?: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const describe = [ayuda ? `${id}-ayuda` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[15px] font-semibold">
        {etiqueta}
        {opcional ? (
          <span className="font-normal text-[#46554D]"> (opcional)</span>
        ) : (
          <>
            <span className="ml-1 text-[var(--verde)]" aria-hidden="true">*</span>
            <span className="sr-only"> (obligatorio)</span>
          </>
        )}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describe || undefined}
        className={`h-14 w-full rounded-2xl border-[1.5px] bg-white px-4 text-[16px] outline-none transition-colors placeholder:text-[#7A847D] focus:border-[var(--verde)] focus:ring-2 focus:ring-[var(--verde)]/25 ${
          error ? "border-[#B42318]" : "border-[#D8DCD4]"
        }`}
        {...props}
      />
      {ayuda && (
        <p id={`${id}-ayuda`} className="mt-1.5 text-[14px] leading-snug text-[#46554D]">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-[14.5px] font-medium text-[#B42318]">
          {error}
        </p>
      )}
    </div>
  );
}
