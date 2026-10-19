/* eslint-disable @next/next/no-img-element -- la firma es un data URL guardado, no una imagen a optimizar */
import type { Firmante } from "@/lib/contratos/datos";
import { fechaColombia } from "@/lib/contratos/correos";

/**
 * Constancia de firma: lo que prueba quién firmó, cuándo, desde dónde y qué
 * texto exacto. Va al final del contrato y sale también al imprimir o guardar
 * como PDF.
 */
function Dato({ k, v }: { k: string; v: string }) {
  return (
    <div className="contents">
      <dt className="text-[#5A6B63]">{k}</dt>
      <dd className="break-words text-[var(--tinta)]">{v}</dd>
    </div>
  );
}

export function Constancia({
  firmantes,
  huella,
  huellaCoincide,
  creado,
}: {
  firmantes: Firmante[];
  huella: string;
  huellaCoincide: boolean;
  creado: string;
}) {
  return (
    <section className="constancia mt-10 break-inside-avoid rounded-3xl border border-[#D8DCD4] bg-white p-5 sm:p-7">
      <p className="mono text-[var(--verde)]">Constancia de firma electrónica</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {firmantes.map((f) => (
          <div key={f.id} className="break-inside-avoid rounded-2xl border border-[#E6E8E3] p-4">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-[#5A6B63]">{f.etiqueta}</p>
            {f.firmado_at ? (
              <>
                <img src={f.firma!} alt={`Firma de ${f.nombre}`} className="mt-2 h-[90px] w-auto max-w-full" />
                <p className="mt-1 border-t border-[#D8DCD4] pt-2 text-[16px] font-bold">{f.nombre}</p>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13px]">
                  <Dato k="Documento" v={`${f.tipo_documento} ${f.documento}`} />
                  {f.empresa && <Dato k="Negocio" v={f.empresa} />}
                  <Dato k="Correo verificado" v={f.correo ?? ""} />
                  {f.celular && <Dato k="Celular" v={f.celular} />}
                  <Dato k="Firmó" v={fechaColombia(f.firmado_at)} />
                  <Dato k="IP" v={f.ip ?? ""} />
                </dl>
              </>
            ) : (
              <p className="mt-3 text-[15px] text-[#8C948D]">Pendiente de firma</p>
            )}
          </div>
        ))}
      </div>
      <div className="mt-5 text-[12.5px] leading-relaxed text-[#46554D]">
        <p>
          Contrato emitido el {fechaColombia(creado)}. Huella SHA-256 del texto firmado:{" "}
          <span className="mono break-all text-[var(--tinta)]">{huella}</span>
          {huellaCoincide ? " · el texto no ha cambiado desde su emisión." : " · ATENCIÓN: el texto no coincide con la huella."}
        </p>
        <p className="mt-2">
          Cada firmante se identificó con sus datos y con un código de un solo uso enviado a su correo. Firma electrónica conforme a la Ley 527 de 1999 y el Decreto 2364 de 2012.
        </p>
      </div>
    </section>
  );
}
