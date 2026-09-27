"use client";

import { useRouter } from "next/navigation";

/** «+ Automatizar publicación»: lleva al editor de la publicación elegida. */
export function ElegirPublicacion({ opciones }: { opciones: { mediaId: string; titulo: string }[] }) {
  const router = useRouter();
  if (!opciones.length) return null;
  return (
    <label className="flex w-full min-w-0 items-center gap-2 text-sm sm:w-auto">
      <span className="sr-only">Automatizar publicación</span>
      <select defaultValue="" onChange={(e) => e.target.value && router.push(`/social/automatizaciones/${e.target.value}`)}
        className="min-h-11 w-full max-w-full truncate rounded-xl bg-[var(--verde)] px-4 text-sm font-semibold text-white sm:w-auto sm:max-w-[22rem]">
        <option value="">+ Automatizar publicación…</option>
        {opciones.map((o) => <option key={o.mediaId} value={o.mediaId}>{o.titulo.length > 48 ? `${o.titulo.slice(0, 45)}…` : o.titulo}</option>)}
      </select>
    </label>
  );
}
