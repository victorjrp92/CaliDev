import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServinomicLanding } from "@/components/servinomic/landing";
import { CAMPAIGNS, campaignSlugs, getCampaign } from "@/lib/campaigns";

export function generateStaticParams() {
  return campaignSlugs().map((campana) => ({ campana }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ campana: string }>;
}): Promise<Metadata> {
  const { campana } = await params;
  const campaign = getCampaign(campana);

  return {
    title: "ServiNomic — El sistema de operación para empresas de servicios",
    description: campaign.subhead,
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

  return <ServinomicLanding campaign={getCampaign(campana)} />;
}
