import { notFound } from "next/navigation";
import { contratoPorId, firmantePorToken, firmantesDe, huellaDe, marcarAbierto } from "@/lib/contratos/datos";
import { fechaColombia } from "@/lib/contratos/correos";
import { FormularioFirma } from "@/components/contratos/formulario-firma";
import { Constancia } from "@/components/contratos/constancia";
import { BotonImprimir } from "@/components/contratos/boton-imprimir";

export const dynamic = "force-dynamic";

/**
 * La página personal de un firmante: calidev.dev/contratos/<token>.
 *
 * Arriba el estado, después el contrato completo, después el formulario de
 * firma (si a esta persona le falta firmar) y al final la constancia con las
 * firmas registradas. Al imprimir o guardar como PDF salen el contrato y la
 * constancia, sin el formulario.
 *
 * El HTML del contrato lo escribe CaliDev desde el panel, nunca quien firma;
 * por eso se pinta tal cual.
 */
export default async function PaginaContrato({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const firmante = await firmantePorToken(token);
  if (!firmante) notFound();
  const contrato = await contratoPorId(firmante.contrato_id);
  if (!contrato) notFound();
  const firmantes = await firmantesDe(contrato.id);
  await marcarAbierto(firmante.id);

  const completo = firmantes.every((f) => f.firmado_at);
  const yaFirme = Boolean(firmante.firmado_at);

  return (
    <main className="mx-auto max-w-[860px] px-4 pb-20 pt-6 sm:px-6 sm:pt-10">
      <style>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          .no-imprimir { display: none !important; }
          body { background: #fff !important; }
          main { padding: 0 !important; max-width: none !important; }
          .constancia { border: 0 !important; padding: 0 !important; break-before: page; }
        }
      `}</style>

      <div className="no-imprimir mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mono text-[var(--verde)]">CaliDev · Contrato</p>
          <p className="mt-1 text-[15px] font-semibold">
            {completo
              ? "Firmado por todas las partes."
              : yaFirme
                ? `Ya firmaste el ${fechaColombia(firmante.firmado_at!)}. Falta la otra parte.`
                : "Léelo con calma. Al final pones tus datos y firmas."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!yaFirme && (
            <a href="#firmar" className="rounded-xl bg-[var(--lima)] px-4 py-2.5 text-[14px] font-extrabold text-[var(--tinta)]">
              Ir a firmar
            </a>
          )}
          <BotonImprimir />
        </div>
      </div>

      <article className="overflow-hidden rounded-3xl bg-white p-5 shadow-[0_1px_0_rgba(20,32,27,.06),0_10px_40px_rgba(20,32,27,.06)] sm:p-9 print:rounded-none print:p-0 print:shadow-none">
        <div dangerouslySetInnerHTML={{ __html: contrato.html }} />
      </article>

      {!yaFirme && <FormularioFirma token={firmante.token} etiqueta={firmante.etiqueta} empresaSugerida={firmante.rol === "clienta" ? "" : "CaliDev"} />}

      <Constancia firmantes={firmantes} huella={contrato.huella} huellaCoincide={huellaDe(contrato.html) === contrato.huella} creado={contrato.created_at} />
    </main>
  );
}
