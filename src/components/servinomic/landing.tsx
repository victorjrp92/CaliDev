import { ServinomicTopBar } from "@/components/servinomic/top-bar";
import { ServinomicHero } from "@/components/servinomic/hero";
import { ServinomicProof } from "@/components/servinomic/proof";
import { ServinomicRelief } from "@/components/servinomic/relief";
import { ServinomicWhatItDoes } from "@/components/servinomic/what-it-does";
import { ServinomicFitCheck } from "@/components/servinomic/fit-check";
import { ServinomicProcess } from "@/components/servinomic/process";
import { ServinomicFaq } from "@/components/servinomic/faq";
import { LeadForm } from "@/components/servinomic/lead-form";
import { ServinomicClosing } from "@/components/servinomic/closing";
import { StickyCta } from "@/components/servinomic/sticky-cta";
import type { Campaign } from "@/lib/campaigns";

/**
 * Ensamblado de la landing. El orden es la estrategia de conversión:
 *
 *  Hero        → promesa + CTA #1 (para quien ya venía convencido del anuncio)
 *  Testimonio  → quién responde por esto
 *  Cifras      → la afirmación aterrizada en números relativos
 *  Domingo     → el porqué humano, antes de cualquier funcionalidad
 *  Qué hace    → los 4 trabajos, con la pantalla ilustrada de cada uno
 *  ¿Es para ti?→ rubros + descarte + auto-identificación + CTA #2
 *  Proceso     → quita el miedo a lo desconocido, cupos e internacional + CTA #3
 *  FAQ         → mata las objeciones justo antes de pedir datos
 *  Formulario  → la conversión
 *  Barra fija  → CTA #4, siempre al alcance del pulgar
 */
export function ServinomicLanding({ campaign }: { campaign: Campaign }) {
  return (
    <>
      <ServinomicTopBar campaign={campaign} />
      <main>
        <ServinomicHero campaign={campaign} />
        <ServinomicProof campaign={campaign} />
        <ServinomicRelief campaign={campaign} />
        <ServinomicWhatItDoes />
        <ServinomicFitCheck />
        <ServinomicProcess slots={campaign.slots} />
        <ServinomicFaq />
        <LeadForm campaign={campaign.slug} slots={campaign.slots} />
        <ServinomicClosing />
      </main>
      <StickyCta slots={campaign.slots} />
    </>
  );
}
