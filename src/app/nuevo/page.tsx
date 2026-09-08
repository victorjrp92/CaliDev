import { WorkPageHero } from "@/components/ui/work-page-hero";

/**
 * Home nuevo, primera pasada: solo el hero. La sección de abajo existe para
 * que haya scroll con el que ver la expansión del vídeo — la reemplazan los
 * servicios en scroll horizontal.
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

      {/* Provisional: da scroll para ver el pin y sirve de control positivo
          de que la página sigue viva después del hero. */}
      <section className="relative z-40 border-t border-[var(--verde)]/12 bg-[var(--hueso)] px-6 py-24 md:px-14">
        <div className="mx-auto max-w-5xl">
          <p className="mono text-[var(--verde)]">Aquí van los servicios</p>
          <h2 className="mt-5 max-w-[18ch] text-4xl font-extrabold leading-[1.02] tracking-tight md:text-6xl">
            Estrategia digital y sistemas que se quedan tuyos.
          </h2>
          <p className="mt-6 max-w-[58ch] text-lg text-[var(--tinta)]/70">
            Webs, apps, CRMs, automatizaciones y consultoría. Esta sección la
            reemplaza el scroll horizontal.
          </p>
          <a
            href="#"
            className="mt-9 inline-block rounded-full bg-[var(--lima)] px-7 py-3.5 text-[15px] font-semibold text-[var(--tinta)] transition-transform duration-200 hover:-translate-y-0.5"
          >
            Hablemos
          </a>
        </div>
      </section>

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
