import type { Anterior } from "@/lib/arranque/anteriores";
import { leerArchivo, leerMuestra } from "@/lib/arranque/archivos";

/**
 * En el panel, al final: lo que el cliente respondió a preguntas que ya no
 * están en el formulario. Con su pregunta original si la conocemos; los
 * archivos, como enlaces.
 */
function Valor({ valor }: { valor: string | string[] }) {
  const lista = Array.isArray(valor) ? valor : [valor];
  const enlaces = lista.map((x) => {
    const m = leerMuestra(x);
    return leerArchivo(x) ?? (m ? { url: m.paginas[0], nombre: m.tipo } : null);
  });
  if (enlaces.every((a) => a !== null)) {
    return (
      <ul className="flex flex-col gap-1">
        {enlaces.map((a) => (
          <li key={a.url}>
            <a href={a.url} target="_blank" rel="noreferrer" className="text-[var(--verde)] underline underline-offset-2">
              {a.nombre}
            </a>
          </li>
        ))}
      </ul>
    );
  }
  return <>{lista.join(", ")}</>;
}

export function RespuestasAnteriores({ anteriores, nombres }: { anteriores: Anterior[]; nombres?: Readonly<Record<string, string>> }) {
  if (!anteriores.length) return null;
  return (
    <section className="mt-10">
      <h2 className="text-[19px] font-bold">Respuestas a preguntas que ya no están en el formulario</h2>
      <p className="mt-1 text-[14px] text-[#46554D]">Las respondió antes de que simplificáramos el formulario. Siguen guardadas.</p>
      <dl className="mt-3 grid gap-x-6 gap-y-3 rounded-2xl border border-dashed border-[#D8DCD4] bg-white p-4 sm:grid-cols-2">
        {anteriores.map((a) => (
          <div key={`${a.seccion}.${a.campo}.${a.indice ?? 0}`}>
            <dt className="text-[12.5px] font-semibold text-[#5A6B63]">
              {nombres?.[a.seccion] ?? a.seccion} · {nombres?.[`${a.seccion}.${a.campo}`] ?? a.campo}
              {a.indice ? ` (n.º ${a.indice})` : ""}
            </dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-[14.5px]">
              <Valor valor={a.valor} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
