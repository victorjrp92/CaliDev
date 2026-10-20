import { horasOcupadas } from "@/lib/citas/datos";
import { describir, horaCompacta, porDia } from "@/lib/citas/horarios";
import { horariosAgendaPublica } from "@/lib/citas/libres";
import { AgendaPublica, type DiaLibre } from "@/components/citas/agenda-publica";

export const dynamic = "force-dynamic";

/**
 * calidev.dev/agendar: la agenda pública de la videollamada gratuita. Llega
 * aquí quien escribe desde Instagram (la tarjeta del privado trae `?c=<código>`
 * para saber de qué persona y publicación viene).
 */
export default async function Agendar({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  let dias: DiaLibre[] = [];
  let fallo = false;
  try {
    const ocupadas = new Set(await horasOcupadas());
    dias = porDia(horariosAgendaPublica().filter((h) => !ocupadas.has(h.inicio.getTime()))).map((g) => ({
      dia: g.dia,
      horarios: g.horarios.map((h) => ({ id: h.id, hora: horaCompacta(h.inicio), descripcion: describir(h) })),
    }));
  } catch (err) {
    console.error("agendar:", err);
    fallo = true;
  }

  return (
    <main className="mx-auto max-w-xl px-5 pb-16 pt-10">
      <p className="mono text-[var(--verde)]">Videollamada gratuita · 1 hora</p>
      <h1 className="mt-3 text-[32px] font-extrabold leading-[1.1] tracking-tight [text-wrap:balance]">Elige cuándo hablamos</h1>
      <p className="mt-3 text-[16px] leading-relaxed text-[#2C3A33]">
        Nos cuentas cómo funciona tu negocio y dónde se te va el tiempo. Sin compromiso: si vemos cómo ayudarte, después te
        enviamos una propuesta.
      </p>
      {fallo ? (
        <p role="alert" className="mt-8 text-[15px] text-[#B42318]">
          No pudimos cargar los horarios. Recarga la página en un momento.
        </p>
      ) : (
        <AgendaPublica dias={dias} codigo={c ?? ""} />
      )}
    </main>
  );
}
