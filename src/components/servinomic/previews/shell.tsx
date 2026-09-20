/**
 * Marco de la ilustración del flujo de agendamiento.
 *
 * Es una recreación con datos inventados, no una captura: la app de producción
 * tiene nombres de colaboradoras, direcciones y cifras del cliente que no
 * pueden salir publicadas.
 *
 * Antes lo compartían tres ilustraciones. Las otras dos —liquidación y reporte—
 * las reemplazó el vídeo de la app funcionando, que enseña lo mismo sin tener
 * que dibujarlo: ver el producto de verdad convence donde una recreación, por
 * buena que sea, solo ilustra. Queda esta porque un flujo de trabajo es una
 * secuencia de pasos y eso se explica mejor con un diagrama que con un vídeo.
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
