/** Un grupo del formulario del contrato (Cliente, Arranque…): título y rejilla de dos columnas. */
export function GrupoCampos({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="bloque flex flex-col gap-4 px-[18px] py-4">
      <legend className="sr-only">{titulo}</legend>
      <p aria-hidden className="titulo-3">{titulo}</p>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}
