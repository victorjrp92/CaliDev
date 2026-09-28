"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SelectorHorarios } from "./selector-horarios";

/**
 * Formulario del panel: nombre, correo, los horarios que se le ofrecen y un
 * botón que le envía la invitación para elegir hora. Dice si el correo salió.
 */
export function InvitarCita({ campana, ocupados }: { campana: string; ocupados: string[] }) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [horarios, setHorarios] = useState<string[]>([]);
  const [estado, setEstado] = useState<{ tipo: "ok" | "error"; texto: string; enlace?: string } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const enCurso = useRef(false);

  async function invitar(e: React.FormEvent) {
    e.preventDefault();
    if (enCurso.current) return;
    if (horarios.length === 0) {
      setEstado({ tipo: "error", texto: "Marca al menos un horario para ofrecerle." });
      return;
    }
    enCurso.current = true;
    setEnviando(true);
    setEstado(null);
    try {
      const res = await fetch(`/servinomic/${campana}/leads/invitar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, correo, horarios }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        setEstado({ tipo: "ok", texto: `Invitación enviada a ${correo}.`, enlace: json.enlace });
        setNombre("");
        setCorreo("");
        setHorarios([]);
        router.refresh();
      } else {
        setEstado({ tipo: "error", texto: json.error || "No se pudo enviar.", enlace: json.enlace });
      }
    } catch {
      setEstado({ tipo: "error", texto: "Sin conexión. Inténtalo de nuevo." });
    } finally {
      enCurso.current = false;
      setEnviando(false);
    }
  }

  const campo =
    "h-12 w-full rounded-xl border-[1.5px] border-[#D8DCD4] bg-white px-3.5 text-[16px] outline-none focus:border-[var(--verde)] focus:ring-2 focus:ring-[var(--verde)]/25";

  return (
    <form onSubmit={invitar} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <label className="text-[13px] font-semibold">
        Nombre
        <input className={`${campo} mt-1`} value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={2} placeholder="Alexa Correa" />
      </label>
      <label className="text-[13px] font-semibold">
        Correo
        <input className={`${campo} mt-1`} type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required placeholder="alexa@correo.com" />
      </label>
      <SelectorHorarios elegidos={horarios} ocupados={ocupados} onChange={setHorarios} />
      <button
        type="submit"
        disabled={enviando}
        className="h-12 cursor-pointer rounded-xl bg-[var(--lima)] px-5 text-[15px] font-bold text-[var(--tinta)] disabled:opacity-60 sm:col-start-3"
      >
        {enviando ? "Enviando…" : `Enviar invitación${horarios.length ? ` (${horarios.length} horarios)` : ""}`}
      </button>
      {estado && (
        <p role="status" className={`sm:col-span-3 text-[14px] ${estado.tipo === "ok" ? "text-[var(--verde)]" : "text-[#B42318]"}`}>
          {estado.texto}
          {estado.enlace && (
            <>
              {" "}
              <a href={estado.enlace} target="_blank" rel="noopener noreferrer" className="underline">
                Ver su página
              </a>
            </>
          )}
        </p>
      )}
    </form>
  );
}
