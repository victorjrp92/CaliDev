import { tablaPublicaciones } from "@/lib/social/consultas";
import { filtrarPublicaciones } from "@/lib/social/filtrar-publicaciones";
import { panelAbierto } from "@/lib/social/sesion";
import { FiltrosPublicaciones } from "../filtros-publicaciones";
import { TablaPublicaciones } from "../tabla-publicaciones";

export const dynamic = "force-dynamic";

export default async function PublicacionesPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  if (!(await panelAbierto())) return null;
  const { f } = await searchParams;
  const filas = await tablaPublicaciones();
  const filtro = f ?? "todas";
  return (
    <main className="mx-auto flex max-w-[1180px] flex-col gap-4 px-4 py-7 md:px-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-[28px] font-extrabold tracking-tight">Publicaciones</h1>
        <p className="text-xs text-[#55635C]">Los «reels de prueba» son los que Instagram no muestra en el perfil: la API no los marca de otra forma.</p>
      </div>
      <FiltrosPublicaciones filas={filas} actual={filtro} base="/social/publicaciones" />
      <TablaPublicaciones filas={filtrarPublicaciones(filas, filtro)} />
    </main>
  );
}
