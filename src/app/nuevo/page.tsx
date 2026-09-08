import { WorkPageHero } from "@/components/ui/work-page-hero";
import { Servicios } from "@/components/nuevo/servicios";
import { Herramientas } from "@/components/nuevo/herramientas";

/**
 * Home nuevo: hero con vídeo que se expande, y los servicios como paneles
 * que avanzan en horizontal, y cierra con las herramientas orbitando.
 */
export default function NuevoPage() {
  return (
    <main>
      <WorkPageHero
        videoSrc="/hero/loop.mp4"
        poster="/hero/poster.jpg"
        playbackRate={0.8}
        topWord="construimos"
        rightWord="tu"
        bottomWord="ventaja"
        accentColor="#0A3D2E"
        textColor="#14201B"
        backgroundColor="#FAFAF7"
        liveColor="#C8F045"
        clocks={[
          { tz: "America/Bogota", label: "CALI" },
          { tz: "Europe/Berlin", label: "FRANKFURT" },
          { tz: "Australia/Sydney", label: "SÍDNEY" },
        ]}
      />

      <Servicios />

      <Herramientas />
    </main>
  );
}
