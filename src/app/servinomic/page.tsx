import type { Metadata } from "next";
import { ServinomicLanding } from "@/components/servinomic/landing";
import { getCampaign } from "@/lib/campaigns";

/** Página canónica: la que alguien escribe de memoria o se enlaza desde el sitio. */
const campaign = getCampaign("directo");

export const metadata: Metadata = {
  title: "ServiNomic — El sistema de operación para empresas de servicios",
  description: campaign.subhead,
};

export default function ServinomicPage() {
  return <ServinomicLanding campaign={campaign} />;
}
