import type { Campo } from "@/lib/arranque/esquema";
import { leerArchivo, leerMuestra } from "@/lib/arranque/archivos";

/**
 * En el panel, lo que el cliente subió: las plantillas como enlaces para
 * descargar y los documentos de ejemplo como miniaturas (ya tapados), cada
 * página enlazada a su imagen completa.
 */
export function ValorArchivos({ campo, valor }: { campo: Campo; valor: string[] }) {
  if (!valor.length) return <span className="text-[#B9C2BC]">—</span>;
  if (campo.tipo === "archivos") {
    return (
      <ul className="flex flex-col gap-1">
        {valor.map(leerArchivo).map(
          (a) =>
            a && (
              <li key={a.url}>
                <a href={a.url} target="_blank" rel="noreferrer" className="text-[var(--verde)] underline underline-offset-2">
                  {a.nombre}
                </a>
              </li>
            )
        )}
      </ul>
    );
  }
  return (
    <ul className="mt-1 grid grid-cols-3 gap-2 sm:grid-cols-5">
      {valor.map(leerMuestra).map(
        (m, i) =>
          m && (
            <li key={m.paginas[0]} className="overflow-hidden rounded-lg border border-[#D8DCD4]">
              <a href={m.paginas[0]} target="_blank" rel="noreferrer" className="block aspect-[3/4] bg-[#EEF2EF]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.paginas[0]} alt={`${m.tipo} ${i + 1}`} loading="lazy" className="h-full w-full object-cover object-top" />
              </a>
              <p className="px-2 py-1 text-[12px] font-semibold">
                {m.tipo}
                {m.paginas.slice(1).map((p, k) => (
                  <a key={p} href={p} target="_blank" rel="noreferrer" className="ml-1 font-normal text-[var(--verde)] underline">
                    p{k + 2}
                  </a>
                ))}
              </p>
            </li>
          )
      )}
    </ul>
  );
}
