"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PadFirma } from "@/components/contratos/pad-firma";
import { TIPOS_DOCUMENTO } from "@/lib/contratos/validar";

/**
 * Datos, firma y código. Primero se llena todo y se dibuja la firma; el botón
 * envía un código al correo escrito. Con el código en la mano, «Firmar el
 * contrato» registra la firma. Así el correo queda verificado y nadie firma
 * con un correo ajeno.
 */
export function FormularioFirma({ token, etiqueta, empresaSugerida }: { token: string; etiqueta: string; empresaSugerida: string }) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState<string>(TIPOS_DOCUMENTO[0]);
  const [documento, setDocumento] = useState("");
  const [correo, setCorreo] = useState("");
  const [celular, setCelular] = useState("");
  const [empresa, setEmpresa] = useState(empresaSugerida);
  const [firma, setFirma] = useState<string | null>(null);
  const [acepto, setAcepto] = useState(false);
  const [codigoEnviado, setCodigoEnviado] = useState<string | null>(null);
  const [codigo, setCodigo] = useState("");
  const [estado, setEstado] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function faltante(): string | null {
    if (nombre.trim().length < 5 || !nombre.trim().includes(" ")) return "Escribe tu nombre completo.";
    if (documento.trim().length < 4) return "Escribe tu número de documento.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) return "Revisa tu correo.";
    if (!firma) return "Dibuja tu firma en el recuadro.";
    if (!acepto) return "Marca la casilla de aceptación.";
    return null;
  }

  async function pedirCodigo() {
    const falta = faltante();
    if (falta) return setEstado(falta);
    setEnviando(true);
    setEstado(null);
    const res = await fetch("/api/contratos/codigo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, correo }),
    }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    setEnviando(false);
    if (res?.ok) {
      setCodigoEnviado(correo.trim().toLowerCase());
      setEstado(null);
    } else setEstado(json.error ?? "Sin conexión. Intenta de nuevo.");
  }

  async function firmarContrato() {
    const falta = faltante();
    if (falta) return setEstado(falta);
    if (!/^\d{6}$/.test(codigo)) return setEstado("Escribe el código de 6 dígitos.");
    setEnviando(true);
    setEstado(null);
    const res = await fetch("/api/contratos/firmar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, nombre, tipoDocumento, documento, correo, celular, empresa, firma, acepto, codigo }),
    }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    setEnviando(false);
    if (res?.ok) {
      router.refresh();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else setEstado(json.error ?? "Sin conexión. Intenta de nuevo.");
  }

  const campo =
    "mt-1 block h-12 w-full rounded-xl border-[1.5px] border-[#D8DCD4] bg-white px-3.5 text-[16px] outline-none focus:border-[var(--verde)]";
  const etiquetaCampo = "block text-[14px] font-semibold";
  const correoCambio = codigoEnviado !== null && codigoEnviado !== correo.trim().toLowerCase();

  return (
    <section id="firmar" className="no-imprimir mt-10 rounded-3xl border border-[#D8DCD4] bg-white p-5 sm:p-7">
      <p className="mono text-[var(--verde)]">Firma de {etiqueta.toLowerCase()}</p>
      <h2 className="mt-2 text-[26px] font-extrabold leading-tight tracking-tight">Tus datos y tu firma</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-[#46554D]">
        Quedan en la constancia de firma al final del contrato. Te enviaremos un código a tu correo para confirmar que eres tú.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className={`${etiquetaCampo} sm:col-span-2`}>
          Nombre completo
          <input className={campo} autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </label>
        <label className={etiquetaCampo}>
          Tipo de documento
          <select className={campo} value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value)}>
            {TIPOS_DOCUMENTO.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className={etiquetaCampo}>
          Número de documento
          <input className={campo} inputMode="numeric" value={documento} onChange={(e) => setDocumento(e.target.value)} />
        </label>
        <label className={etiquetaCampo}>
          Correo
          <input className={campo} type="email" autoComplete="email" value={correo} onChange={(e) => setCorreo(e.target.value)} />
        </label>
        <label className={etiquetaCampo}>
          Celular <span className="font-normal text-[#8C948D]">(opcional)</span>
          <input className={campo} type="tel" autoComplete="tel" value={celular} onChange={(e) => setCelular(e.target.value)} />
        </label>
        <label className={`${etiquetaCampo} sm:col-span-2`}>
          Negocio o empresa <span className="font-normal text-[#8C948D]">(opcional)</span>
          <input className={campo} autoComplete="organization" value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
        </label>
      </div>

      <div className="mt-6">
        <p className={etiquetaCampo}>Tu firma</p>
        <div className="mt-2">
          <PadFirma onCambio={setFirma} />
        </div>
      </div>

      <label className="mt-6 flex cursor-pointer items-start gap-3 text-[15px] leading-snug">
        <input type="checkbox" className="mt-0.5 h-5 w-5 flex-none accent-[var(--verde)]" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} />
        <span>
          Leí el contrato completo y lo acepto. Entiendo que esta firma electrónica tiene la misma validez que mi firma a mano.
        </span>
      </label>

      {!codigoEnviado || correoCambio ? (
        <button
          type="button"
          onClick={pedirCodigo}
          disabled={enviando}
          className="mt-6 h-13 w-full cursor-pointer rounded-xl bg-[var(--verde)] px-5 py-3.5 text-[16px] font-bold text-white disabled:opacity-60 sm:w-auto"
        >
          {enviando ? "Enviando…" : correoCambio ? "Enviar el código a este correo" : "Enviar código a mi correo"}
        </button>
      ) : (
        <div className="mt-6 rounded-2xl bg-[#F4F6F2] p-4">
          <label className={etiquetaCampo}>
            Código que llegó a {codigoEnviado}
            <input
              className={`${campo} mono max-w-[200px] text-center text-[22px] tracking-[.3em]`}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
            />
          </label>
          <p className="mt-2 text-[13px] text-[#46554D]">Si no lo ves, revisa la carpeta de spam o promociones.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={firmarContrato}
              disabled={enviando}
              className="cursor-pointer rounded-xl bg-[var(--lima)] px-6 py-3.5 text-[16px] font-extrabold text-[var(--tinta)] disabled:opacity-60"
            >
              {enviando ? "Firmando…" : "Firmar el contrato"}
            </button>
            <button type="button" onClick={pedirCodigo} disabled={enviando} className="cursor-pointer text-[14px] font-semibold text-[var(--verde)] underline underline-offset-2">
              Enviar otro código
            </button>
          </div>
        </div>
      )}

      {estado && (
        <p role="alert" className="mt-4 text-[15px] font-semibold text-[#B42318]">
          {estado}
        </p>
      )}
    </section>
  );
}
