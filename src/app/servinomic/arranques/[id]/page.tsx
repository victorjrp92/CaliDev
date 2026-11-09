import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { panelAbierto } from "@/lib/panel-leads";
import { arranquePorId, respuestasDe } from "@/lib/arranque/datos";
import type { Valores } from "@/lib/arranque/esquema";
import { plantillaDe } from "@/lib/arranque/plantillas";
import { seccionCompleta, visible } from "@/lib/arranque/validar";
import { Puerta } from "../../leads/puerta";
import { ValorArchivos } from "./valor-archivos";
import { RespuestasAnteriores } from "./respuestas-anteriores";
import { respuestasAnteriores } from "@/lib/arranque/anteriores";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Respuestas de arranque · CaliDev",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Las respuestas de un formulario de arranque, sección por sección: los
 * campos como ficha y las listas como tabla, para configurar ServiNomic con
 * esto a la vista.
 */
const texto = (v: Valores[string] | undefined) => (Array.isArray(v) ? v.join(", ") : v ?? "");

export default async function RespuestasArranque({ params }: { params: Promise<{ id: string }> }) {
  if (!(await panelAbierto())) return <Puerta />;
  const a = await arranquePorId(Number((await params).id));
  if (!a) notFound();
  const r = respuestasDe(a);
  const { secciones, producto, anteriores } = plantillaDe(a.plantilla);

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <Link href="/servinomic/arranques" className="text-[14px] font-semibold text-[var(--verde)] underline underline-offset-2">
        Volver a los arranques
      </Link>
      <h1 className="mt-3 text-[30px] font-extrabold leading-tight tracking-tight">{a.negocio || a.cliente}</h1>
      <p className="text-[14px] text-[#46554D]">{producto} · {a.enviado_at ? "Enviado por el cliente" : "Todavía en curso: lo que ves es lo que lleva guardado"}</p>

      {secciones.map((s) => {
        const v = r[s.id];
        const ok = seccionCompleta(s, r);
        return (
          <section key={s.id} className="mt-8">
            <h2 className="flex items-center gap-2 text-[19px] font-bold">
              <span aria-hidden="true" className={`grid h-6 w-6 place-items-center rounded-full text-[12px] ${ok ? "bg-[var(--verde)] text-[var(--lima)]" : "bg-[#FDF3D8] text-[#6B4E00]"}`}>
                {ok ? "✓" : "!"}
              </span>
              {s.titulo}
            </h2>
            {s.tipo === "lista" ? (
              Array.isArray(v) && v.length ? (
                <div className="mt-3 overflow-x-auto rounded-2xl border border-[#D8DCD4] bg-white">
                  <table className="w-full min-w-[640px] border-collapse text-[13.5px]">
                    <thead>
                      <tr>
                        {s.campos.map((c) => (
                          <th key={c.id} className="border-b border-[#D8DCD4] px-3 py-2 text-left font-semibold text-[#46554D]">
                            {c.etiqueta}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {v.map((it, i) => (
                        <tr key={i} className="border-b border-[#EEF0EC] last:border-0">
                          {s.campos.map((c) => (
                            <td key={c.id} className="px-3 py-2 align-top">
                              {texto(it[c.id])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-2 text-[14px] text-[#8C948D]">Sin datos todavía.</p>
              )
            ) : (
              <dl className="mt-3 grid gap-x-6 gap-y-3 rounded-2xl border border-[#D8DCD4] bg-white p-4 sm:grid-cols-2">
                {s.campos
                  .filter((c) => visible(c, v && !Array.isArray(v) ? v : {}))
                  .map((c) => {
                    const x = v && !Array.isArray(v) ? v[c.id] : undefined;
                    const archivos = c.tipo === "archivos" || c.tipo === "muestras";
                    return (
                      <div key={c.id} className={archivos ? "sm:col-span-2" : undefined}>
                        <dt className="text-[12.5px] font-semibold text-[#5A6B63]">{c.etiqueta}</dt>
                        <dd className="mt-0.5 whitespace-pre-wrap text-[14.5px]">
                          {archivos ? <ValorArchivos campo={c} valor={Array.isArray(x) ? x : []} /> : texto(x) || <span className="text-[#B9C2BC]">—</span>}
                        </dd>
                      </div>
                    );
                  })}
              </dl>
            )}
          </section>
        );
      })}
      <RespuestasAnteriores anteriores={respuestasAnteriores(r, secciones)} nombres={anteriores} />
    </main>
  );
}
