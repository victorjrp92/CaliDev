/**
 * El servicio en tres acciones concretas: qué se hace, quién lo hace y cómo se
 * sabe que va bien. Es la diferencia entre «ordenar el negocio» y comprar un
 * programa.
 *
 * El cierre nombra la tecnología —software, apps, webs, automatizaciones—
 * porque también la construimos, y sin esa línea la página parecería vender
 * solo acompañamiento.
 */
const ACCIONES = [
  {
    titulo: "Qué se hace y cómo.",
    texto: "Dejamos claros los pasos de las tareas que hoy necesitan tus explicaciones.",
  },
  {
    titulo: "Quién se encarga.",
    texto: "Definimos responsabilidades para que cada persona sepa qué le corresponde.",
  },
  {
    titulo: "Cómo sabes que va bien.",
    texto: "Organizamos el seguimiento para que puedas revisar resultados sin intervenir en cada paso.",
  },
];

export function Servicio() {
  return (
    <section className="mx-auto max-w-xl px-5 py-10">
      <h2 className="text-[26px] font-extrabold leading-tight tracking-tight">
        Una forma de trabajar que puedas delegar
      </h2>
      <p className="mt-3 text-[16px] leading-relaxed text-[#2C3A33]">
        Construimos contigo procesos claros, responsabilidades y herramientas para que puedas
        delegar y dar seguimiento al trabajo de tu equipo.
      </p>
      <ul className="mt-5 flex flex-col gap-3">
        {ACCIONES.map((a) => (
          <li key={a.titulo} className="rounded-2xl border border-[#D8DCD4] bg-white px-4 py-4 text-[15.5px] leading-relaxed text-[#2C3A33]">
            <strong className="font-bold text-[var(--tinta)]">{a.titulo}</strong> {a.texto}
          </li>
        ))}
      </ul>
      <p className="mt-5 text-[16px] leading-relaxed text-[#2C3A33]">
        Y cuando hace falta, construimos la tecnología que la sostiene:{" "}
        <strong className="font-bold text-[var(--tinta)]">
          software a la medida, apps, páginas web y automatizaciones.
        </strong>
      </p>
    </section>
  );
}
