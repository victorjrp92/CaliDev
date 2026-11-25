/** Una cifra del resumen: título, el número grande y una línea de contexto. */
export function CifraResumen({ titulo, valor, nota, alerta = false }: { titulo: string; valor: string; nota?: React.ReactNode; alerta?: boolean }) {
  return (
    <div className="panel flex min-w-0 flex-[1_1_210px] flex-col gap-1.5 px-[18px] py-4">
      <span className="nota">{titulo}</span>
      <span className={`numero-grande break-words ${alerta ? "text-[var(--peligro)]" : ""}`}>{valor}</span>
      {nota && <span className="nota">{nota}</span>}
    </div>
  );
}
