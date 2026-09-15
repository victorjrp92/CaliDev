import Image from "next/image";
import { AgendaPreview } from "@/components/servinomic/previews/agenda-preview";
import { PayrollPreview } from "@/components/servinomic/previews/payroll-preview";
import { MoneyPreview } from "@/components/servinomic/previews/money-preview";

/**
 * Lo que se le construyó a LimpiaExpress, en el orden en que pasó.
 *
 * Antes eran cuatro funciones de ServiNomic con su pantalla cada una. Eso hacía
 * que Cali Dev pareciera una empresa de un solo producto, justo lo contrario de
 * lo que dice la sección de abajo. Tres trabajos distintos para un mismo cliente
 * dicen más: se ve el alcance y además se lee como una historia y no como un
 * catálogo.
 *
 * El segundo bloque es el que más trabaja. «Flujo de trabajo» no lo entiende
 * casi nadie, así que no se nombra: se enseña. Un link, tres datos, y el
 * servicio aparece solo en la agenda.
 */
const TRABAJOS = [
  {
    title: "Primero, que la encontraran",
    lines: [
      "Página web propia, con su marca",
      "Perfil de Google montado y verificado",
      "Los clientes agendan desde ahí, no por chat",
    ],
    Visual: WebVisual,
  },
  {
    title: "Después, que la agenda se llenara sola",
    lines: [
      "El cliente entra por un link",
      "Deja nombre, teléfono y dirección",
      "Escoge servicio, fecha y hora",
      "Queda en la agenda sin que nadie lo escriba",
    ],
    Visual: AgendaPreview,
  },
  {
    title: "Y al final, toda la operación en un solo sitio",
    lines: [
      "Los servicios del día y quién los atiende",
      "Los clientes y su historial",
      "El equipo, sus horas y su pago",
      "El inventario y lo que se gasta en cada servicio",
    ],
    Visual: ServinomicVisual,
  },
];

function WebVisual() {
  return (
    <figure className="overflow-hidden rounded-2xl border border-[#D8DCD4] bg-white">
      <Image
        src="/servinomic/web-limpiaexpress.webp"
        alt="La página web de Limpia Express Cali, con su logo, el menú y el botón de agendamiento"
        width={1200}
        height={703}
        sizes="(max-width: 640px) 100vw, 576px"
        className="h-auto w-full"
      />
      <figcaption className="border-t border-[#F0EBE2] px-3.5 py-2.5 text-[11.5px] text-[#77847C]">
        limpiaexpresscali.com · búscala por su nombre y ahí está
      </figcaption>
    </figure>
  );
}

/** Dos pantallas y no cuatro: alcanzan para que se entienda qué es la app. */
function ServinomicVisual() {
  return (
    <div className="flex flex-col gap-3">
      <PayrollPreview />
      <MoneyPreview />
    </div>
  );
}

export function ServinomicWhatItDoes() {
  return (
    <section className="mx-auto max-w-xl px-5 pb-10">
      <h2 className="text-2xl font-extrabold leading-tight tracking-tight">
        Lo que le construimos a LimpiaExpress
      </h2>
      <p className="mt-2.5 text-base text-[#46554D]">
        Tres trabajos distintos, uno detrás de otro.
      </p>

      <div className="mt-6 flex flex-col gap-8">
        {TRABAJOS.map(({ title, lines, Visual }) => (
          <article key={title}>
            <h3 className="text-[17px] font-bold leading-snug">{title}</h3>
            <ul className="mt-2 flex flex-col gap-1.5">
              {lines.map((linea) => (
                <li
                  key={linea}
                  className="flex items-start gap-2.5 text-[15px] leading-snug text-[#46554D]"
                >
                  <span
                    aria-hidden="true"
                    className="mt-[0.6em] h-[3px] w-3 flex-none rounded-full bg-[var(--verde)]/55"
                  />
                  <span>{linea}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3.5">
              <Visual />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
