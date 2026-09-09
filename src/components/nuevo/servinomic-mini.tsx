/**
 * Recreación compacta de ServiNomic. Todos los nombres, códigos y cifras son
 * inventados: el producto real corre sobre datos de un cliente y esos no
 * salen publicados. La estructura sí es la del producto — liquidación semanal
 * con la seguridad social ya calculada, que es lo que lo distingue.
 */
const FILAS = [
  { code: "CLB-07", nombre: "Marta O.", horas: "38 h", pago: "$ 441.300" },
  { code: "CLB-11", nombre: "Yeimy C.", horas: "44 h", pago: "$ 512.750" },
  { code: "CLB-14", nombre: "Sandra P.", horas: "30 h", pago: "$ 348.900" },
];

export function ServinomicMini() {
  return (
    <div className="overflow-hidden rounded-xl bg-white text-[#14201B] shadow-2xl ring-1 ring-black/10">
      <div className="flex items-center gap-2 border-b border-black/8 bg-[#F5F7F5] px-3.5 py-2.5">
        <span className="grid h-4 w-4 place-items-center rounded bg-[#0A3D2E] text-[8px] font-extrabold text-white">
          S
        </span>
        <span className="text-[11px] font-bold tracking-tight text-[#4A5A53]">
          ServiNomic · Liquidación semana 31
        </span>
      </div>

      <div className="p-3.5">
        <div className="flex items-center justify-between rounded-lg bg-[#E9F5EE] px-3 py-2">
          <span className="font-[family-name:var(--font-plex)] text-[8.5px] uppercase tracking-[0.1em] text-[#7C8A83]">
            Lista para pagar
          </span>
          <span className="text-[10px] font-bold text-[#0A3D2E]">22 colaboradoras ✓</span>
        </div>

        <ul className="mt-2.5 flex flex-col gap-1.5">
          {FILAS.map((f) => (
            <li
              key={f.code}
              className="flex items-center gap-2 rounded-lg border border-black/8 px-2.5 py-2"
            >
              <span className="rounded bg-[#F0F2F0] px-1.5 py-0.5 font-[family-name:var(--font-plex)] text-[8px] text-[#8A948E]">
                {f.code}
              </span>
              <span className="flex-1 truncate text-[11px] font-semibold">{f.nombre}</span>
              <span className="font-[family-name:var(--font-plex)] text-[9px] text-[#8A948E]">
                {f.horas}
              </span>
              <span className="font-[family-name:var(--font-plex)] text-[10px] font-bold tabular-nums">
                {f.pago}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-2.5 flex gap-1.5">
          {["Salud", "Pensión", "ARL", "Caja"].map((x) => (
            <span
              key={x}
              className="flex-1 rounded-md bg-[#F0F2F0] py-1 text-center text-[8.5px] font-semibold text-[#4A5A53]"
            >
              {x} ✓
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
