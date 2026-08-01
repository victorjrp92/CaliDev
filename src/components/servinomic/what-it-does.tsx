import { PayrollPreview } from "@/components/servinomic/previews/payroll-preview";
import { SchedulePreview } from "@/components/servinomic/previews/schedule-preview";
import { MoneyPreview } from "@/components/servinomic/previews/money-preview";
import { GrowthPreview } from "@/components/servinomic/previews/growth-preview";

const FEATURES = [
  {
    title: "Pagarle al equipo sin perder el domingo",
    body: "Cuadra horas, extras y descuentos solo. Calcula la seguridad social, aplica los bonos por desempeño y deja el soporte de cada pago listo para mostrar.",
    before: "Antes: 16 horas cada semana con la calculadora",
    Preview: PayrollPreview,
  },
  {
    title: "Saber qué pasa sin preguntarle a nadie",
    body: "Quién atiende, dónde, a qué hora y cuánto duró. La disponibilidad del equipo cargada, y a quién toca supervisar esta semana.",
    before: "Antes: buscar direcciones en la agenda y en 40 chats",
    Preview: SchedulePreview,
  },
  {
    title: "Ver la plata de verdad",
    body: "Ingresos, gastos, insumos y margen por servicio en un solo lugar. Te dice cuántos servicios necesitas para no perder, antes de que termine el mes.",
    before: "Antes: sumar a mano y archivar facturas una por una",
    Preview: MoneyPreview,
  },
  {
    title: "Saber dónde crecer",
    body: "Qué cliente se está enfriando, qué zona pide más servicios, qué canal te trae los mejores clientes y cuánto te cuesta conseguir uno.",
    before: "Antes: decidir con el pálpito",
    Preview: GrowthPreview,
  },
];

/**
 * Los cuatro trabajos del sistema, con una ilustración de la pantalla real.
 *
 * La nómina va primero porque es el dolor más reconocible, pero es solo uno de
 * cuatro: muchas apps hacen nómina. Lo que ninguna hace es el cuarto bloque —
 * decirle a la dueña dónde está el crecimiento. Ese es el argumento de que esto
 * no es una app de nómina sino una guía para hacer crecer el negocio.
 */
export function ServinomicWhatItDoes() {
  return (
    <section className="mx-auto max-w-xl px-5 pb-10">
      <h2 className="text-2xl font-extrabold leading-tight tracking-tight">
        No es una app de nómina
      </h2>
      <p className="mt-2.5 text-base text-[#4A5A53]">
        Pagar al equipo es apenas una de las cuatro cosas que resuelve.
      </p>

      <div className="mt-6 flex flex-col gap-8">
        {FEATURES.map(({ title, body, before, Preview }) => (
          <article key={title}>
            <h3 className="text-[17px] font-bold leading-snug">{title}</h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-[#4A5A53]">
              {body}
            </p>
            <p className="mt-2 text-[12.5px] font-semibold text-[#B8791F]">
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
