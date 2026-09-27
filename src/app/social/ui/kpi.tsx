/** Tarjeta de indicador. `destacado` = fondo verde de marca con la cifra en lima. */
export function Kpi({ etiqueta, valor, nota, destacado, aviso }: {
  etiqueta: string; valor: string | number; nota?: string; destacado?: boolean; aviso?: boolean;
}) {
  const fondo = destacado
    ? "bg-[var(--verde)] text-[var(--hueso)]"
    : aviso
      ? "border border-[#F0D9B0] bg-[#FFF6E6]"
      : "border border-[#E3E6E0] bg-white";
  return (
    <div className={`rounded-2xl px-4 py-3.5 ${fondo}`}>
      <p className={`text-[13px] ${destacado ? "text-[#C8D9D1]" : aviso ? "text-[#8A4B0B]" : "text-[#55635C]"}`}>{etiqueta}</p>
      <p className={`mt-0.5 text-[28px] font-extrabold tracking-tight ${destacado ? "text-[var(--lima)]" : aviso ? "text-[#8A4B0B]" : ""}`}>
        {typeof valor === "number" ? valor.toLocaleString("es-CO") : valor}
      </p>
      {nota && <p className={`text-xs ${destacado ? "text-[#C8D9D1]" : "text-[#55635C]"}`}>{nota}</p>}
    </div>
  );
}
