/** Etiqueta del tipo que asignó Jev, con su confianza. */
const NOMBRE: Record<string, string> = {
  felicitacion: "Felicitación", quiere_contacto: "Quiere contacto", limpiaexpress: "Busca LimpiaExpress",
  etiqueta_emoji: "Etiqueta/emoji", critica: "Crítica", ofensa_spam: "Ofensa o spam",
};
const COLOR: Record<string, string> = {
  felicitacion: "bg-[#E4F5D0] text-[#2F5A12]", quiere_contacto: "bg-[var(--lima)] text-[var(--verde)]",
  limpiaexpress: "bg-[#E9F3FF] text-[#1F4E8C]", etiqueta_emoji: "bg-[#ECEBF7] text-[#3D3A6B]",
  critica: "bg-[#FFF1D9] text-[#8A4B0B]", ofensa_spam: "bg-[#FBE4DE] text-[#8F2E1B]",
};
export const nombreTipo = (t: string | null) => (t ? NOMBRE[t] ?? t : "—");
export const TIPOS_LISTA = Object.keys(NOMBRE);

export function TipoJev({ tipo, confianza }: { tipo: string | null; confianza?: number | null }) {
  if (!tipo) return null;
  return (
    <span className={`whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold ${COLOR[tipo] ?? "bg-[#EEF0EB]"}`}>
      {nombreTipo(tipo)}{confianza != null ? ` · ${Math.round(confianza * 100)} %` : ""}
    </span>
  );
}
