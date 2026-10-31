"use client";

import { useEffect, useState } from "react";
import { TIPOS_MUESTRA } from "@/lib/arranque/esquema-seirilegal";
import { abrirDocumento, aplanar, type Caja, type Pagina } from "@/lib/arranque/paginas-documento";
import { LienzoCensura } from "@/components/arranque/lienzo-censura";

/**
 * Tapar un documento antes de subirlo, en dos pasos:
 * 1. Tapar: elegir el tipo de documento y cubrir los datos página por página.
 * 2. Vista previa: las imágenes exactas que se van a subir, y una casilla de
 *    «revisé que no se lee nada» sin la cual no se sube.
 */
type Listo = { tipo: string; paginas: Blob[] };

export function CensurarDocumento({ archivo, onListo, onCancelar }: { archivo: File; onListo: (r: Listo) => Promise<void>; onCancelar: () => void }) {
  const [paginas, setPaginas] = useState<Pagina[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cajas, setCajas] = useState<Caja[][]>([]);
  const [actual, setActual] = useState(0);
  const [tipo, setTipo] = useState("");
  const [previa, setPrevia] = useState<{ blobs: Blob[]; urls: string[] } | null>(null);
  const [revisado, setRevisado] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  useEffect(() => {
    let vivo = true;
    abrirDocumento(archivo)
      .then((p) => {
        if (!vivo) return;
        setPaginas(p);
        setCajas(p.map(() => []));
      })
      .catch(() => vivo && setError("No pudimos abrir este archivo. Prueba con una foto (JPG o PNG) o un PDF."));
    return () => {
      vivo = false;
    };
  }, [archivo]);

  useEffect(() => () => previa?.urls.forEach((u) => URL.revokeObjectURL(u)), [previa]);

  const guia = TIPOS_MUESTRA.find((t) => t.tipo === tipo);
  const total = cajas.reduce((n, c) => n + c.length, 0);

  async function verPrevia() {
    if (!paginas) return;
    const blobs = await Promise.all(paginas.map((p, i) => aplanar(p, cajas[i])));
    setRevisado(false);
    setPrevia({ blobs, urls: blobs.map((b) => URL.createObjectURL(b)) });
  }

  async function subir() {
    if (!previa) return;
    setSubiendo(true);
    setError(null);
    try {
      await onListo({ tipo, paginas: previa.blobs });
    } catch {
      setError("No pudimos subirlo. Revisa tu conexión e inténtalo otra vez.");
      setSubiendo(false);
    }
  }

  const boton = "min-h-12 cursor-pointer rounded-xl px-5 text-[15.5px] font-bold disabled:cursor-not-allowed disabled:opacity-45";
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="censura-titulo" className="fixed inset-0 z-50 overflow-y-auto bg-[var(--hueso)]">
      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 pb-10 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="mono text-[13px] text-[var(--verde)]">{previa ? "Paso 2 de 2 · Vista previa" : "Paso 1 de 2 · Tapar"}</p>
            <h2 id="censura-titulo" className="mt-1 text-[24px] font-extrabold leading-tight tracking-tight">
              {previa ? "Así se va a subir" : "Tapa los datos de tu cliente"}
            </h2>
          </div>
          <button type="button" onClick={onCancelar} disabled={subiendo} className="cursor-pointer text-[14.5px] text-[#5A6B63] underline underline-offset-2">
            Cancelar
          </button>
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-[#FDECEA] px-4 py-3 text-[14.5px] font-semibold text-[#B42318]">
            {error}
          </p>
        )}
        {!paginas && !error && <p className="py-16 text-center text-[15px] text-[#5A6B63]">Abriendo el documento…</p>}

        {paginas && !previa && (
          <>
            <div className="flex flex-col">
              <span id="tipo-l" className="text-[15px] font-semibold">¿Qué documento es?</span>
              <div role="radiogroup" aria-labelledby="tipo-l" className="mt-2 flex flex-wrap gap-2">
                {TIPOS_MUESTRA.map((t) => (
                  <button
                    key={t.tipo}
                    type="button"
                    role="radio"
                    aria-checked={tipo === t.tipo}
                    onClick={() => setTipo(t.tipo)}
                    className={`min-h-10 cursor-pointer rounded-xl border-[1.5px] px-3 py-1.5 text-[14px] ${
                      tipo === t.tipo ? "border-[var(--verde)] bg-[var(--verde)] font-semibold text-white" : "border-[#D8DCD4] bg-white"
                    }`}
                  >
                    {t.tipo}
                  </button>
                ))}
              </div>
            </div>

            <p className="rounded-xl bg-[#FDF3D8] px-4 py-3 text-[14.5px] leading-snug text-[#3D2E00]">
              <b>Arrastra el dedo o el ratón</b> sobre cada dato para taparlo.
              {guia ? ` En un documento así, tapa: ${guia.tapar}.` : " Elige el tipo de documento y te decimos qué tapar."}
            </p>

            {tipo === "Pasaporte" && (
              <button
                type="button"
                onClick={() => setCajas((cs) => cs.map((c, i) => (i === actual ? [...c, { x: 0, y: 0.8, w: 1, h: 0.2 }] : c)))}
                className="self-start cursor-pointer text-[14px] font-semibold text-[var(--verde)] underline underline-offset-2"
              >
                Tapar de una vez las dos líneas de abajo
              </button>
            )}

            <LienzoCensura pagina={paginas[actual]} cajas={cajas[actual] ?? []} onCambio={(c) => setCajas((cs) => cs.map((x, i) => (i === actual ? c : x)))} />

            <div className="flex flex-wrap items-center justify-between gap-3 text-[14px]">
              <span className="mono text-[#5A6B63]">
                {paginas.length > 1 ? `Página ${actual + 1} de ${paginas.length} · ` : ""}
                {cajas[actual]?.length ?? 0} {cajas[actual]?.length === 1 ? "dato tapado" : "datos tapados"}
              </span>
              <span className="flex gap-3">
                {(cajas[actual]?.length ?? 0) > 0 && (
                  <button type="button" onClick={() => setCajas((cs) => cs.map((c, i) => (i === actual ? c.slice(0, -1) : c)))} className="cursor-pointer text-[#5A6B63] underline underline-offset-2">
                    Deshacer
                  </button>
                )}
                {paginas.length > 1 && (
                  <>
                    <button type="button" disabled={actual === 0} onClick={() => setActual(actual - 1)} className="cursor-pointer font-semibold text-[var(--verde)] disabled:opacity-35">
                      ← Anterior
                    </button>
                    <button type="button" disabled={actual === paginas.length - 1} onClick={() => setActual(actual + 1)} className="cursor-pointer font-semibold text-[var(--verde)] disabled:opacity-35">
                      Siguiente →
                    </button>
                  </>
                )}
              </span>
            </div>

            <button type="button" onClick={verPrevia} disabled={!tipo} className={`${boton} bg-[var(--verde)] text-white`}>
              {tipo ? "Ver cómo queda" : "Elige qué documento es"}
            </button>
          </>
        )}

        {previa && (
          <>
            {total === 0 && (
              <p role="alert" className="rounded-xl bg-[#FDECEA] px-4 py-3 text-[14.5px] font-semibold text-[#B42318]">
                No tapaste nada. Si el documento tiene datos de tu cliente, vuelve y tápalos.
              </p>
            )}
            <p className="text-[15px] leading-relaxed text-[#2C3A33]">
              Esto es exactamente lo que nos llega{previa.urls.length > 1 ? ` (${previa.urls.length} páginas)` : ""}. El original se queda en tu dispositivo.
            </p>
            <div className="flex flex-col gap-3">
              {previa.urls.map((u, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={u} src={u} alt={`Vista previa, página ${i + 1}`} className="mx-auto max-h-[70vh] w-auto max-w-full rounded-lg border border-[#D8DCD4] bg-white" />
              ))}
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border-[1.5px] border-[#D8DCD4] bg-white p-4 text-[15px] leading-snug">
              <input type="checkbox" checked={revisado} onChange={(e) => setRevisado(e.target.checked)} className="mt-0.5 h-5 w-5 flex-none accent-[var(--verde)]" />
              <span>Lo revisé: no se lee el nombre, los números ni la foto de mi cliente.</span>
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={subir} disabled={!revisado || subiendo} className={`${boton} bg-[var(--verde)] text-white`}>
                {subiendo ? "Subiendo…" : "Subir este documento"}
              </button>
              <button type="button" onClick={() => setPrevia(null)} disabled={subiendo} className={`${boton} border-[1.5px] border-[#D8DCD4] bg-white text-[var(--tinta)]`}>
                Volver a tapar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
