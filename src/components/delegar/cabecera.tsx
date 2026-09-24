import Image from "next/image";

/**
 * Cabecera mínima: CaliDev y de dónde viene la persona. Sin menú.
 *
 * «Vienes del video de Deisy» mantiene la cadena de confianza: acaba de ver a
 * Deisy recomendar a Víctor, y lo primero que lee lo confirma.
 */
export function Cabecera({ referencia }: { referencia?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#D8DCD4] bg-[#FAFAF7]/93 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white">
            <Image src="/logo.png" alt="" width={28} height={28} className="h-5 w-auto" />
          </span>
          <span className="text-[15px] font-bold">CaliDev</span>
        </div>
        {referencia && (
          <span className="rounded-full bg-[#E6E8E3] px-2.5 py-1.5 text-[11.5px] font-semibold text-[#0A3D2E]">
            ★ {referencia}
          </span>
        )}
      </div>
    </header>
  );
}
