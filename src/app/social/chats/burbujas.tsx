import { fechaHora } from "@/lib/social/fecha";

/** Mensajes de la conversación, en orden. Distingue lo que escribió el agente y lo que escribió Victor. */
export function Burbujas({ mensajes }: { mensajes: { id: string; texto: string; nuestro: boolean; ts: string; origen: string }[] }) {
  if (!mensajes.length) return <p className="p-6 text-sm text-[#55635C]">Sin mensajes.</p>;
  return (
    <ol className="flex flex-col gap-2.5 p-4 text-sm sm:p-6">
      {mensajes.map((m) => (
        <li key={m.id} className={`max-w-[80%] ${m.nuestro ? "self-end" : "self-start"}`}>
          {m.nuestro && <p className="mb-0.5 text-right text-[11px] text-[#55635C]">{m.origen === "victor" ? "Tú desde el panel" : "Agente / Instagram"}</p>}
          <p className={`whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 ${m.nuestro ? "rounded-br-sm bg-[var(--verde)] text-white" : "rounded-bl-sm border border-[#E3E6E0] bg-white"}`}>
            {m.texto || <i className="opacity-70">[tarjeta o adjunto]</i>}
          </p>
          <p className={`mt-0.5 text-[11px] text-[#55635C] ${m.nuestro ? "text-right" : ""}`}>
            {fechaHora(m.ts)}
          </p>
        </li>
      ))}
    </ol>
  );
}
