import Link from "next/link";
import { contactos } from "@/lib/social/consultas";
import { diaMes } from "@/lib/social/fecha";
import { panelAbierto } from "@/lib/social/sesion";

export const dynamic = "force-dynamic";

const PASO_FORM = ["—", "Empezó", "Sus datos", "Dejó datos", "Completó"];
type C = Awaited<ReturnType<typeof contactos>>[number];
const FILTROS = [
  { id: "todos", texto: "Todos", ok: () => true },
  { id: "negocio", texto: "Leads con negocio", ok: (c: C) => c.rama === "negocio" },
  { id: "formulario", texto: "Con formulario", ok: (c: C) => c.pasoFormulario >= 3 || !!c.nombre },
  { id: "aliado", texto: "LimpiaExpress", ok: (c: C) => c.rama === "aliado" || c.rama === "limpiaexpress" },
  { id: "pendientes", texto: "Sin respuesta", ok: (c: C) => c.paso === "esperando_boton" || c.paso === "esperando_texto" },
];

/** Todas las personas que entraron por Instagram, con lo que hicieron después. */
export default async function ContactosPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  if (!(await panelAbierto())) return null;
  const { f } = await searchParams;
  const todos = await contactos();
  const filtro = FILTROS.find((x) => x.id === f) ?? FILTROS[0];
  const lista = todos.filter((c) => filtro.ok(c));

  return (
    <main className="mx-auto flex max-w-[1180px] flex-col gap-4 px-4 py-7 md:px-8">
      <h1 className="text-[28px] font-extrabold tracking-tight">Contactos</h1>
      <div className="flex flex-wrap gap-1.5">
        {FILTROS.map((x) => (
          <Link key={x.id} href={`/social/contactos?f=${x.id}`} aria-current={x.id === filtro.id ? "true" : undefined}
            className={`rounded-full px-3 py-1 text-xs ${x.id === filtro.id ? "bg-[var(--tinta)] font-semibold text-white" : "border border-[#D5DAD2] bg-white"}`}>
            {x.texto} {todos.filter((c) => x.ok(c)).length}
          </Link>
        ))}
      </div>
      {lista.length === 0 ? (
        <p className="rounded-2xl border border-[#E3E6E0] bg-white p-6 text-sm text-[#55635C]">
          {todos.length === 0 ? "Todavía nadie ha entrado por un comentario automatizado." : "Nadie en este filtro."}
        </p>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-[#E3E6E0] bg-white">
          <div className="hidden grid-cols-[1.4fr_1.6fr_1fr_1fr_1fr_1.4fr] gap-3 bg-[#F4F5F1] px-5 py-2.5 text-xs uppercase tracking-wide text-[#55635C] md:grid">
            <span>Persona</span><span>Vino de</span><span>Rama</span><span>Landing</span><span>Formulario</span><span>Datos del lead</span>
          </div>
          <ul>
            {lista.map((c) => (
              <li key={c.igsid} className="border-t border-[#EEF0EB] first:border-t-0">
                <Link href={`/social/chats?f=todos&p=${c.igsid}`} className="grid gap-1.5 px-5 py-3.5 text-sm hover:bg-[#FAFAF7] md:grid-cols-[1.4fr_1.6fr_1fr_1fr_1fr_1.4fr] md:items-center md:gap-3">
                  <span><b>@{c.usuario}</b><span className="block text-xs text-[#55635C]">{diaMes(c.desde)}{c.etiquetas.length ? ` · ${c.etiquetas.join(", ")}` : ""}</span></span>
                  <span className="text-[13px]">{c.publicacion ?? "—"}</span>
                  <span className="text-[13px]">{c.rama ?? <span className="text-[#55635C]">sin definir</span>}</span>
                  <span className="text-[13px]">{c.visitas ? `${c.visitas} visita(s)` : "—"}</span>
                  <span className="text-[13px]">{PASO_FORM[c.pasoFormulario] ?? "—"}</span>
                  <span className="text-[13px]">{c.nombre ? <>{c.nombre} · {c.whatsapp}{c.prioridad ? <span className="ml-1 rounded-md bg-[#EEF0EB] px-1.5 text-xs">{c.prioridad}</span> : null}</> : "—"}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
