import Image from "next/image";
import type { Campaign } from "@/lib/campaigns";

/**
 * Barra superior mínima: identidad y origen, sin navegación.
 *
 * El chip de origen es la pieza más valiosa de la página — el visitante acaba
 * de ver a LimpiaExpress recomendando esto, y verlo confirmado arriba mantiene
 * la cadena de confianza del anuncio a la landing.
 */
export function ServinomicTopBar({ campaign }: { campaign: Campaign }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#E7E1D7] bg-[#FBF8F3]/93 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white">
            <Image
              src="/logo.png"
              alt="CaliDev"
              width={28}
              height={28}
              className="h-5 w-auto"
            />
          </span>
          <span className="text-[15px] font-bold">CaliDev</span>
        </div>

        {campaign.referrer && (
          <span className="rounded-full bg-[#E6F4EF] px-2.5 py-1.5 text-[11px] font-semibold text-[#0E7A5F]">
            ★ {campaign.referrer}
          </span>
        )}
      </div>
    </header>
  );
}
