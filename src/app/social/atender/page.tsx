import { porAtender } from "@/lib/social/consultas";
import { panelAbierto } from "@/lib/social/sesion";
import { ItemPorAtender } from "./item";

export const dynamic = "force-dynamic";

export default async function AtenderPage() {
  if (!(await panelAbierto())) return null;
  const items = await porAtender();
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-7 md:px-8">
      <div>
        <h1 className="text-[28px] font-extrabold tracking-tight">Por atender</h1>
        <p className="mt-1 text-sm text-[#55635C]">Lo que el agente no resolvió solo, de todas las publicaciones. Lo más antiguo primero.</p>
      </div>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-[#E3E6E0] bg-white p-6 text-sm text-[#55635C]">Nada pendiente. 🎉</p>
      ) : items.map((i) => <ItemPorAtender key={i.clase + i.id} i={i} />)}
    </main>
  );
}
