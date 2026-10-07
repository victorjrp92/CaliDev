import { NOMBRE_ETAPA, type Etapa, type Persona } from "@/lib/seguimiento/personas";
import { LineaEtapas } from "./linea-etapas";
import { Historial } from "./historial";
import { AccionesPersona } from "./acciones-persona";
import { RecordarCita } from "./recordar-cita";
import { BorrarCita } from "./borrar-cita";
import { AgendarCita } from "./agendar-cita";

/**
 * La ficha de una persona: quién es, en qué etapa está, qué toca hacer ahora,
 * la línea de pasos con fechas, lo que contó en el formulario, el historial de
 * correos y las acciones. El «próximo paso» va arriba y en grande: es lo que se
 * mira primero.
 */
const COLOR: Record<Etapa, string> = {
  "por-invitar": "bg-[#FDF3D8] text-[#6B4E00]",
  "esperando-hora-1": "bg-[#E6E8E3] text-[#46554D]",
  "cita-1": "bg-[#C8F045] text-[#14201B]",
  "por-invitar-2": "bg-[#FDF3D8] text-[#6B4E00]",
  "esperando-hora-2": "bg-[#E6E8E3] text-[#46554D]",
  "cita-2": "bg-[#C8F045] text-[#14201B]",
  "por-proponer": "bg-[#FDF3D8] text-[#6B4E00]",
  propuesta: "bg-[#D9EFE3] text-[#0A3D2E]",
  ganado: "bg-[#0A3D2E] text-[#C8F045]",
  perdido: "bg-[#F1F2EE] text-[#8C948D]",
  pausa: "bg-[#F1F2EE] text-[#46554D]",
};

function enlaceWhatsapp(numero: string, nombre: string) {
  const saludo = encodeURIComponent(`Hola ${nombre.split(" ")[0]}, soy Víctor de CaliDev.`);
  return `https://wa.me/${numero.replace(/\D/g, "")}?text=${saludo}`;
}

export function TarjetaPersona({ persona: p, ocupados }: { persona: Persona; ocupados: string[] }) {
  const pendiente = p.segunda && !p.segunda.inicio ? p.segunda : p.primera && !p.primera.inicio && !p.segunda ? p.primera : null;
  const vigente = p.vigente;
  const invitarA =
    p.etapa === "por-invitar" ? "primera" : p.etapa === "por-invitar-2" ? "segunda" : null;
  const etapaManual = p.seguimiento?.etapa ?? null;

  return (
    <li className="rounded-2xl border border-[#D8DCD4] bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[17px] font-bold">{p.nombre}</p>
          <p className="text-[13px] text-[#46554D]">
            {[p.empresa, p.origen].filter(Boolean).join(" · ")}
          </p>
          <p className="mt-1 flex flex-wrap gap-x-3 text-[13px]">
            {p.correo && <span className="text-[#2C3A33]">{p.correo}</span>}
            {p.whatsapp && (
              <a href={enlaceWhatsapp(p.whatsapp, p.nombre)} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--verde)] underline underline-offset-2">
                WhatsApp {p.whatsapp}
              </a>
            )}
          </p>
        </div>
        <span className={`mono flex-none rounded-full px-2.5 py-1 text-[10.5px] ${COLOR[p.etapa]}`}>{NOMBRE_ETAPA[p.etapa]}</span>
      </div>

      <p className="mt-3 rounded-xl bg-[#F4F6F2] px-3.5 py-2.5 text-[14.5px] leading-snug">
        <span className="font-semibold">Próximo paso: </span>
        {p.proximo}
      </p>

      <div className="mt-4 overflow-x-auto">
        <LineaEtapas pasos={p.pasos} />
      </div>

      {p.formulario && (
        <details className="mt-3">
          <summary className="cursor-pointer text-[13px] font-semibold text-[var(--verde)]">
            Lo que contó en el formulario{p.formulario.prioridad ? ` · prioridad ${p.formulario.prioridad}` : ""}
          </summary>
          {p.formulario.motivo && <p className="mt-2 text-[13px] text-[#46554D]">{p.formulario.motivo}</p>}
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13px]">
            {p.formulario.datos.map((d) => (
              <div key={d.etiqueta} className="contents">
                <dt className="font-semibold text-[#46554D]">{d.etiqueta}</dt>
                <dd className="text-[#2C3A33]">{d.valor}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}

      <div className="mt-3">
        <Historial persona={p} />
      </div>

      {(pendiente || vigente) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {pendiente && <RecordarCita id={pendiente.id} />}
          {vigente && (
            <AgendarCita id={vigente.id} textoBoton={vigente.inicio ? "Cambiar la hora" : "Agendar directamente"} />
          )}
          {pendiente && <BorrarCita id={pendiente.id} nombre={p.nombre} />}
        </div>
      )}

      <div className="mt-4 border-t border-[#E6E8E3] pt-4">
        <AccionesPersona
          clave={p.clave}
          nombre={p.nombre}
          correo={p.correo}
          invitarA={invitarA}
          etapaActual={etapaManual}
          notaInicial={p.seguimiento?.nota ?? ""}
          ocupados={ocupados}
        />
      </div>
    </li>
  );
}
