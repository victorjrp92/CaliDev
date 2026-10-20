import type { Contrato, Firmante } from "@/lib/contratos/datos";
import { enlaceFirmante, fechaColombia } from "@/lib/contratos/correos";
import { CopiarEnlace } from "./copiar-enlace";
import { BorrarContrato } from "./borrar-contrato";

/**
 * Un contrato: título, cuándo se creó, y por cada firmante si firmó (cuándo y
 * con qué nombre), si solo abrió el enlace o si aún no lo abre. Desde aquí se
 * copia el enlace de cada uno y se abre el contrato completo con su constancia
 * para descargarlo en PDF.
 */
function Estado({ f }: { f: Firmante }) {
  if (f.firmado_at) {
    return (
      <span className="mono rounded-full bg-[var(--verde)] px-2.5 py-1 text-[10.5px] text-[var(--lima)]">
        Firmó · {fechaColombia(f.firmado_at).replace(" (hora de Colombia)", "")}
      </span>
    );
  }
  if (f.abierto_at) {
    return (
      <span className="mono rounded-full bg-[#FDF3D8] px-2.5 py-1 text-[10.5px] text-[#6B4E00]">
        Abrió el enlace · {fechaColombia(f.abierto_at).replace(" (hora de Colombia)", "")}
      </span>
    );
  }
  return <span className="mono rounded-full bg-[#E6E8E3] px-2.5 py-1 text-[10.5px] text-[#46554D]">Sin abrir</span>;
}

export function TarjetaContrato({ contrato: c }: { contrato: Contrato & { firmantes: Firmante[] } }) {
  const algunaFirma = c.firmantes.some((f) => f.firmado_at);
  const ver = c.firmantes.find((f) => f.rol === "calidev") ?? c.firmantes[0];

  return (
    <li className="rounded-2xl border border-[#D8DCD4] bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[17px] font-bold">{c.titulo}</p>
          <p className="text-[13px] text-[#46554D]">Creado el {fechaColombia(c.created_at)}</p>
        </div>
        {ver && (
          <a
            href={enlaceFirmante(ver)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-[var(--lima)] px-3.5 py-2 text-[13px] font-bold text-[var(--tinta)]"
          >
            Ver y descargar PDF
          </a>
        )}
      </div>

      <ul className="mt-4 flex flex-col divide-y divide-[#E6E8E3] border-t border-[#E6E8E3]">
        {c.firmantes.map((f) => (
          <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div className="min-w-0">
              <p className="text-[14px] font-semibold">
                {f.etiqueta}
                {f.nombre && <span className="font-normal text-[#46554D]"> · {f.nombre}</span>}
              </p>
              {f.correo && <p className="text-[12.5px] text-[#46554D]">{f.correo}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Estado f={f} />
              {!f.firmado_at && <CopiarEnlace enlace={enlaceFirmante(f)} />}
            </div>
          </li>
        ))}
      </ul>

      {!algunaFirma && (
        <div className="mt-2">
          <BorrarContrato id={c.id} titulo={c.titulo} />
        </div>
      )}
    </li>
  );
}
