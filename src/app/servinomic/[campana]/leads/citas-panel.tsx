import { todasLasCitas, type Cita } from "@/lib/citas/datos";
import { describir, horaEnFrankfurt, horarioPorInicio } from "@/lib/citas/horarios";
import { InvitarCita } from "./invitar-cita";
import { BorrarCita } from "./borrar-cita";

/**
 * Videollamadas en el panel: el formulario para invitar y la lista de
 * invitaciones con su estado (sin elegir, o la hora que eligieron, también en
 * hora de Frankfurt, que es la de Víctor).
 */
export async function CitasPanel({ campana }: { campana: string }) {
  let citas: Cita[] = [];
  let fallo = false;
  try {
    citas = await todasLasCitas();
  } catch {
    fallo = true;
  }

  return (
    <section className="mt-8 rounded-3xl border border-[#D8DCD4] bg-white p-5">
      <h2 className="text-[20px] font-extrabold tracking-tight">Videollamadas</h2>
      <p className="mt-1 text-[14px] text-[#46554D]">
        Envía a alguien el correo para que elija su hora (miércoles a viernes, 8 a 11 a. m. de Colombia).
      </p>
      <div className="mt-4">
        <InvitarCita campana={campana} />
      </div>
      {fallo && <p className="mt-4 text-[14px] text-[#B42318]">No pudimos leer las citas.</p>}
      {citas.length > 0 && (
        <ul className="mt-5 flex flex-col divide-y divide-[#E6E8E3] border-t border-[#E6E8E3]">
          {citas.map((c) => {
            const h = horarioPorInicio(c.inicio);
            return (
              <li key={c.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3 text-[14px]">
                <span>
                  <strong>{c.nombre}</strong> <span className="text-[#46554D]">· {c.correo}</span>
                </span>
                <span className="flex items-baseline gap-2">
                  <span className={h ? "font-semibold text-[var(--verde)]" : "text-[#46554D]"}>
                    {h ? `${describir(h)} · ${horaEnFrankfurt(h)}` : "Sin elegir hora"}
                  </span>
                  <BorrarCita campana={campana} id={c.id} nombre={c.nombre} />
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
