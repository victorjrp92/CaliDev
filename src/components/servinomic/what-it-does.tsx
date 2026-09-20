import Image from "next/image";
import { AgendaPreview } from "@/components/servinomic/previews/agenda-preview";
import { Clip } from "@/components/servinomic/clip";

/**
 * Lo que se le construyó a LimpiaExpress, en el orden en que pasó.
 *
 * Antes eran cuatro funciones de ServiNomic con su pantalla cada una. Eso hacía
 * que Cali Dev pareciera una empresa de un solo producto, justo lo contrario de
 * lo que dice la sección de abajo. Tres trabajos distintos para un mismo cliente
 * dicen más: se ve el alcance y además se lee como una historia y no como un
 * catálogo.
 *
 * El segundo bloque lista los flujos y el visual enseña uno entero. «Flujo de
 * trabajo» no lo entiende casi nadie leyéndolo, así que debajo va el de
 * agendamiento paso a paso: un link, tres datos, y el servicio aparece solo en
 * la agenda. Un ejemplo completo explica la categoría mejor que una definición.
 */
const TRABAJOS = [
  {
    title: "Primero, que la encontraran",
    lines: [
      "Página web propia, con su marca",
      "Perfil de Google montado y verificado",
      "Los clientes la encuentran y llegan desde ahí",
    ],
    Visual: WebVisual,
  },
  {
    title: "Flujo de trabajo en ServiNomic",
    lines: [
      "Datos y agendamiento de clientes, por link",
      "Disponibilidad del equipo, por link",
      "Medición de inventario: ¿está por acabarse, hay que comprar?",
      "Control de calidad, con supervisión del servicio",
      "Y los que la operación vaya pidiendo",
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

/**
 * La app de verdad, en vídeo, en vez de dos maquetas.
 *
 * Aquí había dos pantallas dibujadas a mano en React —liquidación y reporte—.
 * Se veían bien y eran mentira: reproducían la app, no eran la app. Este bloque
 * cierra la sección diciendo «toda la operación en un solo sitio», y ese es
 * justo el sitio donde una maqueta se nota y una grabación convence.
 *
 * El clip recorre tres pantallas reales en cinco segundos: el panel de dinero,
 * el inventario y el resumen. Lleva dentro su propia insignia de «DEMO · DATOS
 * FICTICIOS», que es la verdad y además evita el problema de siempre: las
 * cifras de un cliente no se publican.
 *
 * El pie lo repite en grande porque en un móvil esa insignia mide tres píxeles.
 */
function ServinomicVisual() {
  return (
    <figure className="overflow-hidden rounded-2xl border border-[#D8DCD4] bg-white">
      <Clip
        src="/servinomic/app-servinomic.mp4"
        poster="/servinomic/app-servinomic-poster.webp"
        descripcion="La aplicación ServiNomic en un portátil: recorre el panel con ingresos, gastos y utilidad del periodo, después el inventario de productos con sus costos y cantidades, y termina en el resumen del negocio"
      />
      <figcaption className="border-t border-[#F0EBE2] px-3.5 py-2.5 text-[11.5px] text-[#77847C]">
        ServiNomic funcionando · datos de demostración, no de un cliente
      </figcaption>
    </figure>
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
