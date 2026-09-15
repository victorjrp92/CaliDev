import { PayrollPreview } from "@/components/servinomic/previews/payroll-preview";
import { SchedulePreview } from "@/components/servinomic/previews/schedule-preview";
import { MoneyPreview } from "@/components/servinomic/previews/money-preview";
import { GrowthPreview } from "@/components/servinomic/previews/growth-preview";

const FEATURES = [
  {
    title: "Pagarle al equipo sin perder el domingo",
    lines: [
      "Horas, extras y descuentos, cuadrados solos",
      "Seguridad social calculada",
      "El soporte de cada pago, listo para mostrar",
    ],
    before: "Antes: 16 horas cada semana con la calculadora",
    Preview: PayrollPreview,
  },
  {
    title: "Saber qué pasa sin preguntarle a nadie",
    lines: [
      "Quién atiende, dónde y a qué hora",
      "La disponibilidad del equipo, cargada",
      "A quién toca supervisar esta semana",
    ],
    before: "Antes: buscar direcciones en la agenda y en 40 chats",
    Preview: SchedulePreview,
  },
  {
    title: "Ver la plata de verdad",
    lines: [
      "Ingresos, gastos e insumos en un solo lugar",
      "Margen por servicio, no por corazonada",
      "El punto de equilibrio, para saber desde cuándo ganas",
    ],
    before: "Antes: sumar a mano y archivar facturas una por una",
    Preview: MoneyPreview,
  },
  {
    title: "Saber dónde crecer",
    lines: [
      "Qué cliente se está enfriando",
      "Qué zona pide más servicios",
      "Qué canal trae los mejores clientes, y a qué costo",
    ],
    before: "Antes: decidir con el pálpito",
    Preview: GrowthPreview,
  },
];


/**
 * Los cuatro trabajos del sistema, con una ilustración de la pantalla real.
 *
 * La nómina va primero porque es el dolor más reconocible. Muchas apps la
 * hacen; el cuarto bloque, decirle a la dueña dónde está el crecimiento, es el
 * que sostiene el precio.
 *
 * Cada bloque va en renglones y no en párrafo. Son cuatro descripciones
 * seguidas: en prosa se leen como un muro y la gente pasa de largo.
 */
export function ServinomicWhatItDoes() {
  return (
    <section className="mx-auto max-w-xl px-5 pb-10">
      <h2 className="text-2xl font-extrabold leading-tight tracking-tight">
        Cuatro cosas que dejan de hacerse a mano
      </h2>
      <p className="mt-2.5 text-base text-[#46554D]">
        Pagar al equipo es solo la primera.
      </p>

      <div className="mt-6 flex flex-col gap-8">
        {FEATURES.map(({ title, lines, before, Preview }) => (
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
            <p className="mt-2 text-[12.5px] font-semibold text-[#8A5B12]">
              {before}
            </p>
            <div className="mt-3.5">
              <Preview />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
