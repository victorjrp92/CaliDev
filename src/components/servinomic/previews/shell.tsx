/**
 * Marco común de las ilustraciones de ServiNomic.
 *
 * Son recreaciones de la interfaz real con datos inventados, no capturas: la
 * app de producción tiene nombres de colaboradoras, direcciones y cifras del
 * cliente que no pueden salir publicadas. Recrearlas además se ve nítido en
 * cualquier pantalla y no pesa nada.
 */
export function PreviewShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#D8DCD4] bg-white">
      <div className="flex items-center gap-2 border-b border-[#F0EBE2] bg-[#FAF8F4] px-3.5 py-2.5">
        <span className="flex h-4 w-4 items-center justify-center rounded bg-[#0A3D2E] text-[8px] font-extrabold text-white">
          S
        </span>
        <span className="text-[11px] font-bold tracking-tight text-[#46554D]">
          {title}
        </span>
      </div>
      <div className="p-3.5">{children}</div>
    </div>
  );
}

/** Etiqueta pequeña en mayúsculas, como las de la app. */
export function PreviewLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[8.5px] font-bold uppercase tracking-[0.08em] text-[#8C948D]">
      {children}
    </p>
  );
}
