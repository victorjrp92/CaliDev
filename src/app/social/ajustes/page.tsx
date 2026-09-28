import { fechaHora } from "@/lib/social/fecha";
import { datosAjustes } from "@/lib/social/consultas";
import { panelAbierto } from "@/lib/social/sesion";
import { Controles } from "./controles";

export const dynamic = "force-dynamic";

const LIMITE_COMPOSIO = 100_000;

function hace(min: number | null) {
  if (min === null) return "todavía no ha corrido";
  return min < 1 ? "hace menos de un minuto" : `hace ${min} min`;
}

export default async function AjustesPage() {
  if (!(await panelAbierto())) return null; // el layout ya muestra la puerta
  const d = await datosAjustes();
  const composio = d.consumo.composio ?? 0;

  return (
    <main className="mx-auto max-w-5xl px-4 py-7 md:px-8">
      <h1 className="text-[28px] font-extrabold tracking-tight">Ajustes</h1>

      {d.simulacion && (
        <p className="mt-4 rounded-xl border border-[#F0D58A] bg-[#FFF7E0] px-4 py-3 text-sm">
          <b>Modo simulación:</b> el agente clasifica y decide, pero no publica nada en Instagram.
        </p>
      )}
      {d.pausado && (
        <p className="mt-4 rounded-xl border border-[#F0D58A] bg-[#FFF7E0] px-4 py-3 text-sm">
          <b>Agente pausado:</b> no responde comentarios ni mensajes, y tampoco mide métricas. El reloj sigue llamando cada minuto.
        </p>
      )}
      {(d.minutosDesdeReloj === null || d.minutosDesdeReloj > 5) && (
        <p role="alert" className="mt-4 rounded-xl bg-[#FDEDEA] px-4 py-3 text-sm text-[#8F2E1B]">
          <b>El reloj no está corriendo:</b> última llamada {hace(d.minutosDesdeReloj)}. Revisa cron-job.org.
        </p>
      )}

      <section className="mt-6 rounded-2xl border border-[#E3E6E0] bg-white p-5">
        <h2 className="text-lg font-bold">Agente</h2>
        <p className="mt-1 text-sm text-[#55635C]">
          Último ciclo: {hace(d.minutosDesdeCiclo)} · reloj: {hace(d.minutosDesdeReloj)} · fallos seguidos: {d.fallosSeguidos}
        </p>
        <div className="mt-4">
          <Controles pausado={d.pausado} simulacion={d.simulacion} />
        </div>
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-[var(--azul)] p-5 text-[var(--niebla)]">
          <p className="text-sm">Composio este mes</p>
          <p className="mt-1 text-2xl font-extrabold text-white">
            {composio.toLocaleString("es-CO")} <span className="text-sm font-normal">/ 100.000</span>
          </p>
          <div className="mt-2 h-2 rounded bg-[#22364A]">
            <div className="h-2 rounded bg-[var(--lima)]" style={{ width: `${Math.min(100, (composio / LIMITE_COMPOSIO) * 100)}%` }} />
          </div>
        </div>
        <div className="rounded-2xl border border-[#E3E6E0] bg-white p-5">
          <p className="text-sm text-[#55635C]">Jev (clasificaciones)</p>
          <p className="mt-1 text-2xl font-extrabold">{(d.consumo.jev ?? 0).toLocaleString("es-CO")}</p>
        </div>
        <div className="rounded-2xl border border-[#E3E6E0] bg-white p-5">
          <p className="text-sm text-[#55635C]">DeepSeek (respuestas redactadas)</p>
          <p className="mt-1 text-2xl font-extrabold">{(d.consumo.deepseek ?? 0).toLocaleString("es-CO")}</p>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-[#E3E6E0] bg-white p-5">
        <h2 className="text-lg font-bold">Eventos</h2>
        {d.eventos.length === 0 ? (
          <p className="mt-2 text-sm text-[#55635C]">Sin eventos todavía.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[#EEF0EB]">
            {d.eventos.map((e, i) => (
              <li key={i} className="flex gap-3 py-2.5 text-sm">
                <span
                  className={`h-fit shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${
                    e.nivel === "error" ? "bg-[#FBE4DE] text-[#8F2E1B]" : e.nivel === "alerta" ? "bg-[#FFF1D9] text-[#8A4B0B]" : "bg-[#EEF0EB] text-[#33413A]"
                  }`}
                >
                  {e.nivel}
                </span>
                <span className="min-w-0 flex-1 break-words">{e.texto}</span>
                <span className="shrink-0 text-xs text-[#55635C]">{fechaHora(e.ts)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
