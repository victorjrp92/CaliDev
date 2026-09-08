import { WorkPageHero } from "@/components/ui/work-page-hero";
import { Servicios } from "@/components/nuevo/servicios";

/**
 * Home nuevo: hero con vídeo que se expande, y los servicios como paneles
 * que avanzan en horizontal. La última sección es el hueco de las órbitas.
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

      <section className="bg-[var(--azul)] px-6 py-24 text-[var(--niebla)] md:px-14">
        <div className="mx-auto max-w-5xl">
          <p className="mono text-[var(--lima)]">Y aquí las herramientas</p>
          <h2 className="mt-5 max-w-[20ch] text-3xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">
            El sitio de las órbitas con los logos.
          </h2>
        </div>
      </section>
    </main>
  );
}
