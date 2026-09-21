"use client";

import { useState } from "react";

/**
 * El formulario que rellenan Deisy, Nadia y Laura.
 *
 * Tres personas haciéndonos un favor, no un buzón público: por eso pide lo
 * mínimo y por eso la nota es lo primero y lo más grande. Si alguien se va
 * después de tocar las estrellas, ya tenemos lo único que de verdad hacía falta.
 *
 * La frase y la empresa son opcionales de verdad — se dice en la etiqueta, no
 * con un asterisco que hay que ir a buscar.
 *
 * El permiso arranca SIN marcar. Publicar el nombre de una clienta junto a una
 * nota se pregunta; una casilla premarcada convierte un sí en un descuido.
 */
const NOTAS = [1, 2, 3, 4, 5];

const campo =
  "h-14 w-full rounded-2xl border-[1.5px] border-[#D8DCD4] bg-white px-4 text-[16px] outline-none transition-colors placeholder:text-[#8C948D] focus:border-[var(--verde)] focus:ring-2 focus:ring-[var(--verde)]/25";

export function FormularioOpinion() {
  const [nota, setNota] = useState<number | null>(null);
  const [nombre, setNombre] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [frase, setFrase] = useState("");
  const [permiso, setPermiso] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  async function enviar() {
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch("/api/opinion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, empresa, nota, frase, permiso }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "No pudimos guardarlo");
      }
      setListo(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos guardarlo");
    } finally {
      setEnviando(false);
    }
  }

  if (listo) {
    return (
      <div className="rounded-3xl border border-[#D8DCD4] bg-white p-7 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#E6E8E3] text-3xl text-[var(--verde)]">
          ✓
        </span>
        <h2 className="mt-5 text-2xl font-extrabold tracking-tight">
          Gracias{nombre.trim() ? `, ${nombre.trim().split(" ")[0]}` : ""}.
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-[#46554D]">
          Ya está guardada. Significa mucho más de lo que parece: es lo que hace
          que otra dueña de negocio se anime a dar el paso.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-[#D8DCD4] bg-white p-4 shadow-[0_4px_20px_rgba(21,33,28,0.06)] sm:p-7">
      <fieldset className="border-0 p-0">
        <legend className="text-lg font-extrabold leading-snug tracking-tight">
          ¿Qué nota nos pones?
        </legend>
        <div className="mt-4 flex justify-center gap-1.5 sm:gap-2.5">
          {NOTAS.map((n) => {
            const activa = nota !== null && n <= nota;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setNota(n)}
                aria-label={`${n} de 5`}
                aria-pressed={nota === n}
                /* `flex-1` y no un tamaño fijo: cinco botones de 56px miden
                   280 y en un Galaxy S9+ solo hay 278 de sitio — se salían 25px
                   y el móvil respondía encogiendo la página entera. Repartiendo
                   el ancho no pueden desbordar a ninguna anchura, y con el
                   relleno reducido abajo el lado más estrecho da 44,8px, que
                   sigue por encima del mínimo tocable. */
                className="grid aspect-square max-w-16 flex-1 basis-0 place-items-center rounded-2xl transition-colors hover:bg-[#F1F3EF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--verde)]"
              >
                <svg viewBox="0 0 20 20" className="h-[58%] w-[58%]" aria-hidden="true">
                  <path
                    fill={activa ? "var(--verde)" : "#DFE3DC"}
                    d="M10 1.6l2.5 5.4 5.9.7-4.4 4 1.2 5.8L10 14.6 4.8 17.5 6 11.7 1.6 7.7l5.9-.7z"
                  />
                </svg>
              </button>
            );
          })}
        </div>
        <p aria-live="polite" className="mt-2 text-center text-[13px] text-[#77847C]">
          {nota === null ? "Toca las estrellas" : `${nota} de 5`}
        </p>
      </fieldset>

      <div className="mt-7 flex flex-col gap-4">
        <div>
          <label htmlFor="op-nombre" className="mb-1.5 block text-[13.5px] font-semibold">
            Tu nombre
            <span className="ml-1 text-[var(--verde)]" aria-hidden="true">*</span>
          </label>
          <input
            id="op-nombre"
            className={campo}
            autoComplete="name"
            placeholder="Deisy Moncayo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="op-empresa" className="mb-1.5 block text-[13.5px] font-semibold">
            Tu empresa <span className="font-normal text-[#77847C]">— opcional</span>
          </label>
          <input
            id="op-empresa"
            className={campo}
            autoComplete="organization"
            placeholder="LimpiaExpress Cali"
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="op-frase" className="mb-1.5 block text-[13.5px] font-semibold">
            ¿Quieres añadir algo?{" "}
            <span className="font-normal text-[#77847C]">— opcional</span>
          </label>
          <textarea
            id="op-frase"
            className={`${campo} h-auto min-h-28 resize-none py-3.5`}
            placeholder="Lo que le dirías a alguien que está dudando."
            value={frase}
            onChange={(e) => setFrase(e.target.value)}
          />
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#D8DCD4] p-4">
          <input
            type="checkbox"
            checked={permiso}
            onChange={(e) => setPermiso(e.target.checked)}
            className="mt-0.5 h-5 w-5 flex-none accent-[var(--verde)]"
          />
          <span className="text-[14px] leading-relaxed text-[#46554D]">
            Pueden publicar mi nota y mi nombre en calidev.dev.{" "}
            <span className="text-[#77847C]">
              Si no lo marcas, tu nota cuenta igual y tu nombre no sale.
            </span>
          </span>
        </label>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-[#B42318]">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={nota === null || nombre.trim().length < 2 || enviando}
        onClick={enviar}
        className="mt-6 h-14 w-full cursor-pointer rounded-2xl bg-[var(--lima)] text-base font-bold text-[var(--tinta)] shadow-[0_6px_18px_rgba(10,61,46,0.22)] transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--verde)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
      >
        {enviando ? "Enviando…" : "Enviar"}
      </button>
    </div>
  );
}
