import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingDelegar } from "@/components/delegar/landing";
import { CAMPAIGNS, campaignSlugs, getCampaign } from "@/lib/campaigns";

export function generateStaticParams() {
  return campaignSlugs().map((campana) => ({ campana }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ campana: string }>;
}): Promise<Metadata> {
  await params;

  return {
    title: "CaliDev — Tu negocio puede crecer sin que todo dependa de ti",
    description:
      "Víctor, de CaliDev, te ayuda a crear procesos, software y sistemas para que tu equipo sepa qué hacer y tú puedas delegar.",
    // Página de campaña: no debe competir en buscadores con el sitio principal.
    robots: { index: false, follow: false },
  };
}

export default async function CampaignLandingPage({
  params,
}: {
  params: Promise<{ campana: string }>;
}) {
  const { campana } = await params;
  if (!(campana in CAMPAIGNS)) notFound();

  // Versión A «delegar», elegida el 2026-09-24. Para volver a la anterior:
  // `return <ServinomicLanding campaign={getCampaign(campana)} />` con su import
  // de "@/components/servinomic/landing".
  return <LandingDelegar campaign={getCampaign(campana)} />;
}
