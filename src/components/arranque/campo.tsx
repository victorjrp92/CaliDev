"use client";

import type { Campo as TCampo } from "@/lib/arranque/esquema";
import { CampoArchivos } from "@/components/arranque/campo-archivos";
import { CampoMuestras } from "@/components/arranque/campo-muestras";

/**
 * Un campo del formulario de arranque. Las opciones se eligen tocando, no
 * escribiendo: así no hay errores de tipeo. Los números usan el teclado
 * numérico en el celular y los pesos muestran el valor ya formateado.
 */
const pesos = (s: string) => {
  const n = Number(s.replace(/\D/g, ""));
  return n > 0 ? "$" + n.toLocaleString("es-CO") : "";
};

const TECLADO: Partial<Record<TCampo["tipo"], React.HTMLAttributes<HTMLInputElement>["inputMode"]>> = {
  celular: "tel",
  telefono: "tel",
  documento: "numeric",
  numero: "numeric",
  pesos: "numeric",
  porcentaje: "decimal",
  correo: "email",
};

export function Campo({
  campo: c,
  valor,
  error,
  onCambio,
  idBase,
}: {
  campo: TCampo;
  valor: string | string[] | undefined;
  error: string | null;
  onCambio: (v: string | string[]) => void;
  idBase: string;
}) {
  const id = `${idBase}-${c.id}`;
  const texto = typeof valor === "string" ? valor : "";
  const lista = Array.isArray(valor) ? valor : [];
  const borde = error ? "border-[#D92D20]" : "border-[#D8DCD4] focus:border-[var(--verde)]";
  const entrada = `mt-1.5 block w-full rounded-xl border-[1.5px] bg-white px-3.5 text-[16px] outline-none ${borde}`;

  return (
    <div data-campo={c.id} className="flex flex-col">
      <label htmlFor={c.tipo === "opcion" || c.tipo === "opciones" || c.tipo === "archivos" || c.tipo === "muestras" ? undefined : id} id={`${id}-l`} className="text-[15px] font-semibold leading-snug">
        {c.etiqueta}
        {!c.requerido && <span className="ml-1.5 text-[13px] font-normal text-[#8C948D]">(opcional)</span>}
      </label>
      {c.ayuda && <p className="mt-0.5 text-[13px] text-[#5A6B63]">{c.ayuda}</p>}

      {c.tipo === "archivos" ? (
        <CampoArchivos valor={lista} onCambio={onCambio} />
      ) : c.tipo === "muestras" ? (
        <CampoMuestras valor={lista} minimo={c.minimo ?? 1} onCambio={onCambio} />
      ) : c.tipo === "opcion" || c.tipo === "opciones" ? (
        <div role={c.tipo === "opcion" ? "radiogroup" : "group"} aria-labelledby={`${id}-l`} className="mt-2 flex flex-wrap gap-2">
          {c.opciones?.map((o) => {
            const marcada = c.tipo === "opcion" ? texto === o : lista.includes(o);
            return (
              <button
                key={o}
                type="button"
                role={c.tipo === "opcion" ? "radio" : "checkbox"}
                aria-checked={marcada}
                onClick={() => onCambio(c.tipo === "opcion" ? o : marcada ? lista.filter((x) => x !== o) : [...lista, o])}
                className={`min-h-11 cursor-pointer rounded-xl border-[1.5px] px-3.5 py-2 text-left text-[15px] transition-colors ${
                  marcada ? "border-[var(--verde)] bg-[var(--verde)] font-semibold text-white" : "border-[#D8DCD4] bg-white hover:border-[var(--verde)]"
                }`}
              >
                {c.tipo === "opciones" && <span aria-hidden="true" className="mr-1.5">{marcada ? "✓" : "+"}</span>}
                {o}
              </button>
            );
          })}
        </div>
      ) : c.tipo === "area" ? (
        <textarea id={id} rows={3} maxLength={1000} placeholder={c.ejemplo} value={texto} onChange={(e) => onCambio(e.target.value)} className={`${entrada} py-3`} />
      ) : (
        <input
          id={id}
          type={c.tipo === "fecha" ? "date" : c.tipo === "correo" ? "email" : c.tipo === "celular" || c.tipo === "telefono" ? "tel" : "text"}
          inputMode={TECLADO[c.tipo]}
          autoComplete="off"
          placeholder={c.ejemplo}
          value={texto}
          onChange={(e) => onCambio(e.target.value)}
          className={`${entrada} h-12`}
        />
      )}

      {c.tipo === "pesos" && pesos(texto) && <p className="mono mt-1 text-[13px] text-[var(--verde)]">{pesos(texto)}</p>}
      {c.tipo === "porcentaje" && texto && !error && <p className="mono mt-1 text-[13px] text-[var(--verde)]">{texto.replace("%", "")} % para el negocio</p>}
      {error && (
        <p role="alert" className="mt-1.5 text-[13.5px] font-semibold text-[#B42318]">
          {error}
        </p>
      )}
    </div>
  );
}
