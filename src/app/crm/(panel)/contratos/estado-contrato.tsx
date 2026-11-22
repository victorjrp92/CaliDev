import type { ContratoCrm } from "@/lib/crm/contratos";

/** Firmado cuando firmaron todos; si no, cuántas firmas faltan. */
export function EstadoContrato({ c }: { c: Pick<ContratoCrm, "estado" | "firmantes"> }) {
  if (c.estado === "firmado") return <span className="chip" data-tono="verde">Firmado</span>;
  const faltan = c.firmantes.filter((f) => !f.firmado_at).length;
  return <span className="chip" data-tono="info">{faltan === 1 ? "Falta 1 firma" : `Faltan ${faltan} firmas`}</span>;
}
