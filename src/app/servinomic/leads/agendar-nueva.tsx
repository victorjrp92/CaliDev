"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Agendar a alguien que todavía no está en la lista con una hora ya acordada
 * (por WhatsApp, en una llamada): nombre, correo, tipo, día y hora. Crea la
 * cita ya reservada y le envía la confirmación con el enlace de Meet y la
 * invitación de calendario; a Víctor le llega el aviso.
 */
const HORAS = Array.from({ length: 15 }, (_, i) => 6 + i);
const etiquetaHora = (h: number) => `${h > 12 ? h - 12 : h}:00 ${h < 12 ? "a. m." : h === 12 ? "m." : "p. m."}`;
const FRANKFURT = new Intl.DateTimeFormat("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Berlin" });

export function AgendarNueva({ ocupados }: { ocupados: string[] }) {
  const router = useRouter();
  const [tipo, setTipo] = useState<"primera" | "segunda">("primera");
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [dia, setDia] = useState("");
  const [hora, setHora] = useState(9);
  const [mensaje, setMensaje] = useState("");
  const [estado, setEstado] = useState<{ ok: boolean; texto: string } | null>(null);
  const [enviando, setEnviando] = useState(false);

  const horario = dia ? `${dia}T${String(hora).padStart(2, "0")}` : "";
  const enFrankfurt = horario ? FRANKFURT.format(new Date(`${horario}:00:00-05:00`)) : null;
  const ocupado = Boolean(horario) && ocupados.includes(horario);

  async function agendar(e: React.FormEvent) {
    e.preventDefault();
    if (!horario) return setEstado({ ok: false, texto: "Elige el día." });
    setEnviando(true);
    setEstado(null);
    const res = await fetch("/servinomic/leads/agendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, correo, tipo, horario, mensaje }),
    }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    setEnviando(false);
    if (res?.ok) {
      setEstado({ ok: true, texto: `Agendada. ${correo} recibió la confirmación con el enlace de Meet.` });
      setNombre("");
      setCorreo("");
      setMensaje("");
      router.refresh();
    } else setEstado({ ok: false, texto: json.error ?? "Sin conexión. Inténtalo de nuevo." });
  }

  const campo = "mt-1 h-12 w-full rounded-xl border-[1.5px] border-[#D8DCD4] bg-white px-3.5 text-[16px] outline-none focus:border-[var(--verde)] focus:ring-2 focus:ring-[var(--verde)]/25";

  return (
    <form onSubmit={agendar} className="grid gap-3 sm:grid-cols-2">
      <div className="flex flex-wrap gap-2 sm:col-span-2" role="radiogroup" aria-label="Tipo de cita">
        {(["primera", "segunda"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={tipo === t}
            onClick={() => setTipo(t)}
            className={`h-10 cursor-pointer rounded-full border-[1.5px] px-4 text-[13.5px] font-semibold ${
              tipo === t ? "border-[var(--verde)] bg-[var(--verde)] text-[var(--hueso)]" : "border-[#D8DCD4] bg-white"
            }`}
          >
            {t === "primera" ? "1.ª videollamada · 1 hora" : "2.ª cita: propuesta · 30 min"}
          </button>
        ))}
      </div>
      <label className="text-[13px] font-semibold">
        Nombre
        <input className={campo} value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={2} placeholder="Diego Rojas" />
      </label>
      <label className="text-[13px] font-semibold">
        Correo
        <input className={campo} type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required placeholder="diego@correo.com" />
      </label>
      <label className="text-[13px] font-semibold">
        Día
        <input className={campo} type="date" value={dia} onChange={(e) => setDia(e.target.value)} required />
      </label>
      <label className="text-[13px] font-semibold">
        Hora (Colombia)
        <select className={campo} value={hora} onChange={(e) => setHora(Number(e.target.value))}>
          {HORAS.map((h) => (
            <option key={h} value={h}>
              {etiquetaHora(h)}
            </option>
          ))}
        </select>
      </label>
      {horario && (
        <p className={`text-[13px] sm:col-span-2 ${ocupado ? "font-semibold text-[#B42318]" : "text-[#46554D]"}`}>
          {ocupado ? "Esa hora ya la tiene otra cita." : `En Frankfurt: ${enFrankfurt}.`}
        </p>
      )}
      <label className="text-[13px] font-semibold sm:col-span-2">
        Mensaje <span className="font-normal text-[#46554D]">(opcional · va arriba de la confirmación)</span>
        <textarea
          className="mt-1 min-h-[70px] w-full rounded-xl border-[1.5px] border-[#D8DCD4] bg-white px-3.5 py-2.5 text-[15px] outline-none focus:border-[var(--verde)] focus:ring-2 focus:ring-[var(--verde)]/25"
          maxLength={800}
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          placeholder="Como hablamos por WhatsApp, te confirmo nuestra videollamada."
        />
      </label>
      <button type="submit" disabled={enviando || ocupado} className="h-12 cursor-pointer rounded-xl bg-[var(--lima)] px-5 text-[15px] font-bold text-[var(--tinta)] disabled:opacity-60 sm:col-span-2 sm:justify-self-start">
        {enviando ? "Agendando…" : "Agendar y enviar confirmación"}
      </button>
      {estado && (
        <p role="status" className={`text-[14px] sm:col-span-2 ${estado.ok ? "text-[var(--verde)]" : "text-[#B42318]"}`}>
          {estado.texto}
        </p>
      )}
    </form>
  );
}
