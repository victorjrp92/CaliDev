"use client";

import { useState } from "react";

export type DiaLibre = { dia: string; horarios: { id: string; hora: string; descripcion: string }[] };

/**
 * Elegir hora y dejar los datos en una sola pantalla. El correo es
 * obligatorio porque ahí llega el enlace de la videollamada y la invitación de
 * calendario; el WhatsApp es para avisarle si algo cambia.
 */
export function AgendaPublica({ dias, codigo }: { dias: DiaLibre[]; codigo: string }) {
  const [elegido, setElegido] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [negocio, setNegocio] = useState("");
  const [sitio, setSitio] = useState("");
  const [estado, setEstado] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState<{ descripcion: string; google: string } | null>(null);

  async function confirmar() {
    if (!elegido) return setEstado("Elige un horario.");
    if (nombre.trim().length < 2) return setEstado("Escribe tu nombre.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) return setEstado("Revisa tu correo.");
    setEnviando(true);
    setEstado(null);
    const res = await fetch("/api/citas/agendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ horario: elegido, nombre, correo, whatsapp, negocio, codigo, sitio }),
    }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    setEnviando(false);
    if (res?.ok) setListo({ descripcion: json.descripcion, google: json.google });
    else {
      setEstado(json.error ?? "Sin conexión. Intenta de nuevo.");
      if (json.ocupado) setElegido(null);
    }
  }

  if (listo) {
    return (
      <div className="mt-8 rounded-2xl border border-[var(--verde)] bg-[#F1F8F4] p-5">
        <p className="text-[20px] font-extrabold">Listo, nos vemos.</p>
        <p className="mt-2 text-[16px] leading-relaxed">{listo.descripcion}</p>
        <p className="mt-2 text-[15px] text-[#46554D]">Te enviamos a tu correo el enlace de Google Meet y la invitación para tu calendario.</p>
        <a href={listo.google} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block rounded-xl bg-[var(--verde)] px-5 py-3 text-[15px] font-bold text-white">
          Agregar a Google Calendar
        </a>
      </div>
    );
  }

  const campo = "mt-1 block h-12 w-full rounded-xl border-[1.5px] border-[#D8DCD4] bg-white px-3.5 text-[16px] outline-none focus:border-[var(--verde)]";

  return (
    <div className="mt-8">
      {dias.length === 0 ? (
        <p className="text-[15px] text-[#46554D]">No quedan horarios libres en las próximas dos semanas. Escríbenos por Instagram y te buscamos uno.</p>
      ) : (
        <div className="flex flex-col gap-5">
          {dias.map((d) => (
            <div key={d.dia}>
              <p className="text-[15px] font-bold">{d.dia}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {d.horarios.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    aria-pressed={elegido === h.id}
                    aria-label={h.descripcion}
                    onClick={() => setElegido(h.id)}
                    className={`h-11 cursor-pointer rounded-xl border-[1.5px] px-4 text-[15px] font-semibold ${
                      elegido === h.id ? "border-[var(--verde)] bg-[var(--verde)] text-white" : "border-[#D8DCD4] bg-white text-[var(--tinta)]"
                    }`}
                  >
                    {h.hora}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className="text-[13px] text-[#46554D]">Horas de Colombia.</p>
        </div>
      )}

      {dias.length > 0 && (
        <div className="mt-8 grid gap-4">
          <label className="block text-[14px] font-semibold">
            Nombre
            <input className={campo} autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </label>
          <label className="block text-[14px] font-semibold">
            Correo <span className="font-normal text-[#8C948D]">(ahí te llega el enlace de la videollamada)</span>
            <input className={campo} type="email" autoComplete="email" value={correo} onChange={(e) => setCorreo(e.target.value)} />
          </label>
          <label className="block text-[14px] font-semibold">
            WhatsApp <span className="font-normal text-[#8C948D]">(opcional)</span>
            <input className={campo} type="tel" autoComplete="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
          </label>
          <label className="block text-[14px] font-semibold">
            Tu negocio <span className="font-normal text-[#8C948D]">(opcional)</span>
            <input className={campo} autoComplete="organization" value={negocio} onChange={(e) => setNegocio(e.target.value)} />
          </label>
          <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={sitio} onChange={(e) => setSitio(e.target.value)} />
          <button
            type="button"
            onClick={confirmar}
            disabled={enviando}
            className="h-13 cursor-pointer rounded-xl bg-[var(--lima)] px-6 py-3.5 text-[16px] font-extrabold text-[var(--tinta)] disabled:opacity-60"
          >
            {enviando ? "Agendando…" : "Confirmar mi videollamada"}
          </button>
          {estado && (
            <p role="alert" className="text-[15px] font-semibold text-[#B42318]">
              {estado}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
