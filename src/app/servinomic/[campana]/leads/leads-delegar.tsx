import { etiquetaDelegar } from "@/lib/delegar/preguntas";
import type { Prioridad } from "@/lib/delegar/prioridad";

/**
 * Solicitudes del formulario «delegar» en el panel.
 *
 * Van aparte de las del formulario anterior porque se leen con otro
 * diccionario y se ordenan por categoría, no por puntaje. Cada tarjeta dice la
 * prioridad Y el motivo: la regla es provisional y tiene que poder discutirse
 * mirando los casos.
 *
 * El encaje siempre sale «pendiente de revisar»: lo confirma una persona.
 */
export type FilaDelegar = {
  id: number;
  created_at: string;
  name: string;
  company: string | null;
  whatsapp: string;
  email: string | null;
  country_other: string | null;
  role: string | null;
  staff: string | null;
  actividad: string | null;
  dolor: string | null;
  dolor_otro: string | null;
  herramientas: string | null;
  herramientas_otro: string | null;
  busca: string | null;
  plazo: string | null;
  prioridad: Prioridad | null;
  prioridad_motivo: string | null;
  utm: string | null;
};

const ESTILO: Record<Prioridad, { nombre: string; fondo: string; texto: string; orden: number }> = {
  alta: { nombre: "Prioridad alta", fondo: "#C8F045", texto: "#14201B", orden: 0 },
  media: { nombre: "Potencial medio", fondo: "#D9EFE3", texto: "#0A3D2E", orden: 1 },
  incompleta: { nombre: "Incompleta", fondo: "#FDF3D8", texto: "#6B4E00", orden: 2 },
  exploracion: { nombre: "Exploración", fondo: "#E6E8E3", texto: "#46554D", orden: 3 },
};

const FECHA = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function enlaceWhatsapp(numero: string, nombre: string) {
  const saludo = encodeURIComponent(
    `Hola ${nombre.split(" ")[0]}, soy Víctor de CaliDev. Recibí tu solicitud después del video de Deisy.`
  );
  return `https://wa.me/${numero.replace(/\D/g, "")}?text=${saludo}`;
}

export function ordenarDelegar(filas: FilaDelegar[]): FilaDelegar[] {
  return [...filas].sort((a, b) => {
    const pa = ESTILO[a.prioridad ?? "incompleta"].orden;
    const pb = ESTILO[b.prioridad ?? "incompleta"].orden;
    return pa - pb || +new Date(b.created_at) - +new Date(a.created_at);
  });
}

export function LeadsDelegar({ filas }: { filas: FilaDelegar[] }) {
  if (filas.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-[22px] font-extrabold tracking-tight">Formulario «Quiero empezar a delegar»</h2>
      <p className="mt-1.5 text-[14px] text-[#46554D]">
        Ordenadas por prioridad. La prioridad sale de lo que la persona declaró (qué busca y cuándo); el
        encaje lo decides tú.
      </p>
      <ul className="mt-5 grid gap-3 lg:grid-cols-2">
        {ordenarDelegar(filas).map((f) => {
          const e = ESTILO[f.prioridad ?? "incompleta"];
          const datos: [string, string][] = [
            ["Papel", etiquetaDelegar("rol", f.role)],
            ["Negocio", f.actividad ?? "—"],
            ["Equipo", etiquetaDelegar("tamano", f.staff)],
            ["Resolver primero", etiquetaDelegar("dolor", f.dolor) + (f.dolor_otro ? `: ${f.dolor_otro}` : "")],
            ["Organiza con", etiquetaDelegar("herramientas", f.herramientas) + (f.herramientas_otro ? `: ${f.herramientas_otro}` : "")],
            ["Busca", etiquetaDelegar("busca", f.busca)],
            ["Plazo", etiquetaDelegar("plazo", f.plazo)],
          ];
          return (
            <li key={f.id} className="rounded-2xl border border-[#D8DCD4] bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[16px] font-bold">{f.name}</p>
                  <p className="truncate text-[13.5px] text-[#46554D]">
                    {f.company ?? "Sin nombre de empresa"} · {f.country_other ?? "—"}
                  </p>
                </div>
                <span className="mono flex-none rounded-full px-2.5 py-1 text-[10px]" style={{ background: e.fondo, color: e.texto }}>
                  {e.nombre}
                </span>
              </div>
              <p className="mt-2 text-[13px] leading-snug text-[#46554D]">{f.prioridad_motivo}</p>
              <p className="mt-1 text-[12.5px] text-[#46554D]">Encaje: pendiente de revisar</p>
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-xl bg-[#F4F6F2] px-3 py-2.5 text-[12.5px] leading-snug">
                {datos.map(([t, v]) => (
                  <div key={t} className="contents">
                    <dt className="font-semibold text-[#46554D]">{t}</dt>
                    <dd className="text-[#2C3A33]">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <a
                  href={enlaceWhatsapp(f.whatsapp, f.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mono rounded-full bg-[var(--verde)] px-3.5 py-2 text-[11px] text-[var(--hueso)]"
                >
                  WhatsApp {f.whatsapp}
                </a>
                {f.email && <span className="text-[12px] text-[#46554D]">{f.email}</span>}
                <span className="mono text-[11px] tabular-nums text-[#46554D]">
                  {FECHA.format(new Date(f.created_at))}
                  {f.utm ? ` · ${f.utm}` : ""}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
