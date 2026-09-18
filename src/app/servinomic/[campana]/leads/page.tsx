import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { CAMPAIGNS } from "@/lib/campaigns";
import { labelFor } from "@/lib/leads";
import { panelAbierto, panelConfigurado } from "@/lib/panel-leads";
import { Puerta } from "./puerta";
import { Salir } from "./salir";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leads · ServiNomic",
  robots: { index: false, follow: false, nocache: true },
};

type Fila = {
  id: number;
  created_at: string;
  name: string;
  company: string | null;
  whatsapp: string;
  email: string | null;
  role: string | null;
  staff: string | null;
  country: string | null;
  herramientas: string | null;
  repetitivo: string | null;
  freno: string | null;
  urgency: string | null;
  aspiracion: string | null;
  score_value: number;
  score_intent: number;
  score_total: number;
  track: string;
  qualified: boolean;
  completed: boolean;
  referral_contact: string | null;
  /** Lo calcula la base: su reloj es el bueno, no el del navegador. */
  reciente: boolean;
};

/**
 * Cómo de bueno es el lead, en palabras.
 *
 * El puntaje es VALOR × INTENCIÓN / 100, así que 40 ya es alto: exige ser
 * grande Y estar caliente a la vez. Los cortes salen de ahí, no de repartir
 * cien en cuatro tramos iguales.
 *
 * Cada banda lleva etiqueta de texto además de color. Quien no distingue rojo
 * de verde —o quien imprime esto en blanco y negro— tiene que poder ordenar la
 * lista igual.
 */
function banda(fila: Fila) {
  if (!fila.qualified) {
    return { nombre: "Descartado", pista: "No dirige una operación", fondo: "#E6E8E3", texto: "#46554D" };
  }
  if (!fila.completed) {
    return { nombre: "Sin terminar", pista: "Dejó contacto, no acabó el filtro", fondo: "#FDF3D8", texto: "#6B4E00" };
  }
  if (fila.score_total >= 40) {
    return { nombre: "Llamar ya", pista: "Grande y con prisa", fondo: "#C8F045", texto: "#14201B" };
  }
  if (fila.score_total >= 22) {
    return { nombre: "Bueno", pista: "Encaja, sin urgencia", fondo: "#D9EFE3", texto: "#0A3D2E" };
  }
  if (fila.score_total >= 10) {
    return { nombre: "Tibio", pista: "Pequeño o explorando", fondo: "#E6E8E3", texto: "#46554D" };
  }
  return { nombre: "Frío", pista: "Poco encaje", fondo: "#E6E8E3", texto: "#77847C" };
}

const FECHA = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** El WhatsApp se abre de un toque: el panel existe para llamar, no para mirar. */
function enlaceWhatsapp(numero: string, nombre: string) {
  const limpio = numero.replace(/[^\d]/g, "");
  const saludo = encodeURIComponent(
    `Hola ${nombre.split(" ")[0]}, soy Victor de Cali Dev. Vi que dejaste tus datos después del video de Deisy.`
  );
  return `https://wa.me/${limpio}?text=${saludo}`;
}

export default async function PanelLeads({
  params,
}: {
  params: Promise<{ campana: string }>;
}) {
  const { campana } = await params;
  if (!(campana in CAMPAIGNS)) notFound();

  // Sin contraseña configurada la puerta rechazaría a todo el mundo sin decir
  // por qué, y el primero en toparse con eso sería Victor un lunes.
  if (!panelConfigurado()) {
    return (
      <main className="mx-auto max-w-sm px-5 py-24">
        <p className="mono text-[var(--verde)]">Panel privado</p>
        <h1 className="mt-3 text-[26px] font-extrabold leading-tight">Falta configurarlo</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#46554D]">
          No hay contraseña puesta en este entorno. Se define en la variable
          <code className="mono mx-1">PANEL_LEADS_PASSWORD</code>.
        </p>
      </main>
    );
  }

  if (!(await panelAbierto())) return <Puerta />;

  let filas: Fila[] = [];
  let fallo: string | null = null;
  try {
    const resultado = await sql<Fila>`
      SELECT *, created_at > NOW() - INTERVAL '7 days' AS reciente
      FROM leads
      WHERE campaign = ${campana}
      ORDER BY qualified DESC, score_total DESC, created_at DESC
    `;
    filas = resultado.rows;
  } catch {
    fallo = "No pudimos leer la base de datos.";
  }

  const calificados = filas.filter((f) => f.qualified);
  const calientes = calificados.filter((f) => f.completed && f.score_total >= 40);
  const recientes = filas.filter((f) => f.reciente);

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mono text-[var(--verde)]">Panel privado · {campana}</p>
          <h1 className="mt-2 text-[30px] font-extrabold leading-tight tracking-tight">
            Leads de la campaña
          </h1>
        </div>
        <Salir />
      </div>

      {/* Resumen. Tres números y no diez: lo que hay que saber antes de llamar. */}
      <dl className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { n: filas.length, t: "Leads en total" },
          { n: calificados.length, t: "Califican" },
          { n: calientes.length, t: "Para llamar ya" },
          { n: recientes.length, t: "Últimos 7 días" },
        ].map((dato) => (
          <div
            key={dato.t}
            className="rounded-2xl border border-[#D8DCD4] bg-white px-4 py-3.5"
          >
            <dd className="text-[26px] font-extrabold tabular-nums leading-none">{dato.n}</dd>
            <dt className="mt-1.5 text-[12.5px] text-[#46554D]">{dato.t}</dt>
          </div>
        ))}
      </dl>

      {fallo && (
        <p role="alert" className="mt-8 rounded-2xl border border-[#D8DCD4] bg-white p-5 text-[15px] text-[#B42318]">
          {fallo}
        </p>
      )}

      {!fallo && filas.length === 0 && (
        <div className="mt-8 rounded-3xl border border-dashed border-[#C6CCC3] bg-white p-10 text-center">
          <p className="text-[17px] font-semibold">Todavía no hay leads</p>
          <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-[#46554D]">
            Aparecerán aquí en cuanto alguien termine el segundo paso del
            formulario. Quien abandone antes de dejar contacto no se guarda.
          </p>
        </div>
      )}

      {filas.length > 0 && (
        <>
          {/* Móvil: tarjetas. Diecinueve columnas en una pantalla de 390 px no
              se leen, y este panel se abre desde el teléfono. */}
          <ul className="mt-8 flex flex-col gap-3 lg:hidden">
            {filas.map((fila) => {
              const b = banda(fila);
              return (
                <li
                  key={fila.id}
                  className="rounded-2xl border border-[#D8DCD4] bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[16px] font-bold">{fila.name}</p>
                      <p className="truncate text-[13.5px] text-[#46554D]">
                        {fila.company ?? "Sin empresa"}
                      </p>
                    </div>
                    <span
                      className="mono flex-none rounded-full px-2.5 py-1 text-[10px]"
                      style={{ background: b.fondo, color: b.texto }}
                    >
                      {b.nombre}
                    </span>
                  </div>

                  <p className="mt-2 text-[13px] text-[#77847C]">
                    {b.pista} · {labelFor("staff", fila.staff)} ·{" "}
                    {labelFor("urgency", fila.urgency)}
                  </p>

                  {/* Con qué abrir la conversación: lo que le duele y lo que
                      haría si recupera el tiempo. Citarle sus propias palabras
                      en el primer mensaje es la diferencia entre que lea una
                      venta y que lea a alguien que la escuchó. */}
                  {(fila.freno || fila.aspiracion) && (
                    <dl className="mt-2.5 flex flex-col gap-1 rounded-xl bg-[#F4F6F2] px-3 py-2.5 text-[12.5px] leading-snug">
                      {fila.freno && (
                        <div>
                          <dt className="inline font-semibold text-[#46554D]">Le duele: </dt>
                          <dd className="inline text-[#46554D]">
                            {labelFor("freno", fila.freno)}
                          </dd>
                        </div>
                      )}
                      {fila.aspiracion && (
                        <div>
                          <dt className="inline font-semibold text-[var(--verde)]">Quiere: </dt>
                          <dd className="inline text-[var(--verde)]">
                            {labelFor("aspiracion", fila.aspiracion)}
                          </dd>
                        </div>
                      )}
                    </dl>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <a
                      href={enlaceWhatsapp(fila.whatsapp, fila.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mono rounded-full bg-[var(--verde)] px-3.5 py-2 text-[11px] text-[var(--hueso)]"
                    >
                      Escribir por WhatsApp
                    </a>
                    <span className="mono text-[11px] tabular-nums text-[#77847C]">
                      {fila.score_total} pts · {FECHA.format(new Date(fila.created_at))}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Escritorio: tabla. Desborde propio para que la página no scrollee
              a lo ancho cuando el contenido es más ancho que la pantalla. */}
          <div className="mt-8 hidden overflow-x-auto rounded-2xl border border-[#D8DCD4] bg-white lg:block">
            <table className="w-full min-w-[1000px] border-collapse text-left text-[13.5px]">
              <caption className="sr-only">
                Leads de la campaña {campana}, ordenados por calificación
              </caption>
              <thead>
                <tr className="border-b border-[#D8DCD4]">
                  {[
                    "Calificación",
                    "Nombre",
                    "Empresa",
                    "Contacto",
                    "Equipo",
                    "Con qué trabaja",
                    "Horas repetitivas",
                    "Qué la frena",
                    "Urgencia",
                    "Puntaje",
                    "Entró",
                  ].map((titulo) => (
                    <th
                      key={titulo}
                      scope="col"
                      className="mono whitespace-nowrap px-3.5 py-3 text-[10px] font-normal text-[#77847C]"
                    >
                      {titulo}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.map((fila) => {
                  const b = banda(fila);
                  return (
                    <tr key={fila.id} className="border-b border-[#E6E8E3] last:border-0">
                      <td className="px-3.5 py-3">
                        <span
                          className="mono inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[10px]"
                          style={{ background: b.fondo, color: b.texto }}
                        >
                          {b.nombre}
                        </span>
                        <span className="mt-1 block text-[11.5px] text-[#77847C]">
                          {b.pista}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 font-semibold">{fila.name}</td>
                      <td className="px-3.5 py-3 text-[#46554D]">{fila.company ?? "—"}</td>
                      <td className="px-3.5 py-3">
                        <a
                          href={enlaceWhatsapp(fila.whatsapp, fila.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-[var(--verde)] underline underline-offset-2"
                        >
                          {fila.whatsapp}
                        </a>
                        {fila.email && (
                          <span className="mt-0.5 block text-[12px] text-[#77847C]">
                            {fila.email}
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-3 text-[#46554D]">{labelFor("staff", fila.staff)}</td>
                      <td className="px-3.5 py-3 text-[#46554D]">
                        {labelFor("herramientas", fila.herramientas)}
                      </td>
                      <td className="px-3.5 py-3 text-[#46554D]">
                        {labelFor("repetitivo", fila.repetitivo)}
                      </td>
                      <td className="px-3.5 py-3 text-[#46554D]">
                        {labelFor("freno", fila.freno)}
                      </td>
                      <td className="px-3.5 py-3 text-[#46554D]">
                        {labelFor("urgency", fila.urgency)}
                      </td>
                      <td className="px-3.5 py-3 tabular-nums">
                        <span className="font-bold">{fila.score_total}</span>
                        <span className="mt-0.5 block text-[11.5px] text-[#77847C]">
                          valor {fila.score_value} · prisa {fila.score_intent}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3.5 py-3 tabular-nums text-[#77847C]">
                        {FECHA.format(new Date(fila.created_at))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-5 text-[13px] leading-relaxed text-[#77847C]">
            El puntaje es valor × prisa ÷ 100: premia solo a quien es grande{" "}
            <em>y</em> tiene apuro a la vez, así que una empresa grande que está
            explorando no desplaza a una mediana que quiere empezar ya.
          </p>
        </>
      )}
    </main>
  );
}
