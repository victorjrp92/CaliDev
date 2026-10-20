"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  EJEMPLO_SERVINOMIC,
  faltantesServinomic,
  htmlServinomic,
  pesos,
  type DatosServinomic,
} from "@/lib/contratos/plantilla-servinomic";
import { CopiarEnlace } from "./copiar-enlace";

export type Base = { id: number; titulo: string; datos: DatosServinomic };
type Creado = { etiqueta: string; enlace: string }[];

/**
 * Crear un contrato desde la plantilla de ServiNomic. Se puede partir de uno
 * anterior (copia sus precios, cuotas y condiciones) y cambiar solo lo que
 * difiere. La vista previa es el mismo HTML que se guardará y se firmará.
 * Al crearlo devuelve los dos enlaces: CaliDev firma primero y después se
 * envía el de la clienta.
 */
function hoy() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
}

const campo = "mt-1 block h-11 w-full rounded-lg border-[1.5px] border-[#D8DCD4] bg-white px-3 text-[15px] outline-none focus:border-[var(--verde)]";
const etiqueta = "block text-[13px] font-semibold";

function Texto({ label, value, onChange, ayuda, placeholder }: { label: string; value: string; onChange: (v: string) => void; ayuda?: string; placeholder?: string }) {
  return (
    <label className={etiqueta}>
      {label}
      <input className={campo} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {ayuda && <span className="mt-1 block text-[12px] font-normal text-[#8C948D]">{ayuda}</span>}
    </label>
  );
}

function Numero({ label, value, onChange, dinero = true }: { label: string; value: number; onChange: (v: number) => void; dinero?: boolean }) {
  return (
    <label className={etiqueta}>
      {label}
      <input className={campo} inputMode="numeric" value={value ? String(value) : ""} onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, "")) || 0)} />
      {dinero && value > 0 && <span className="mono mt-1 block text-[12px] font-normal text-[#46554D]">{pesos(value)}</span>}
    </label>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="mt-5 border-t border-[#E6E8E3] pt-4">
      <legend className="mono pr-2 text-[11px] text-[var(--verde)]">{titulo}</legend>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function NuevoContrato({ bases }: { bases: Base[] }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [d, setD] = useState<DatosServinomic>({ ...EJEMPLO_SERVINOMIC, fecha: hoy() });
  const [previa, setPrevia] = useState(false);
  const [estado, setEstado] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [creado, setCreado] = useState<Creado | null>(null);

  const set = <K extends keyof DatosServinomic>(k: K) => (v: DatosServinomic[K]) => setD((x) => ({ ...x, [k]: v }));
  const suma = d.cuotas.reduce((s, c) => s + c.valor, 0);
  const faltan = faltantesServinomic(d);

  function partirDe(id: string) {
    const b = bases.find((x) => String(x.id) === id);
    if (b) setD({ ...EJEMPLO_SERVINOMIC, ...b.datos, nombre: "", negocio: "", fecha: hoy() });
  }

  async function crear() {
    if (faltan.length) return setEstado(`Falta ${faltan.join(", ")}.`);
    setEnviando(true);
    setEstado(null);
    const res = await fetch("/servinomic/leads/contratos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plantilla: "servinomic", datos: d }),
    }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    setEnviando(false);
    if (res?.ok) {
      setCreado(json.firmantes);
      router.refresh();
    } else setEstado(json.error ?? "Sin conexión.");
  }

  if (!abierto) {
    return (
      <button type="button" onClick={() => setAbierto(true)} className="cursor-pointer rounded-xl bg-[var(--verde)] px-5 py-3 text-[15px] font-bold text-white">
        Nuevo contrato
      </button>
    );
  }

  if (creado) {
    const calidev = creado.find((f) => f.etiqueta === "CaliDev");
    const clienta = creado.find((f) => f.etiqueta !== "CaliDev");
    return (
      <div className="rounded-2xl border border-[var(--verde)] bg-[#F1F8F4] p-5">
        <p className="text-[17px] font-bold">Contrato creado</p>
        <ol className="mt-3 flex list-decimal flex-col gap-3 pl-5 text-[14.5px]">
          {calidev && (
            <li>
              Firma tú primero:{" "}
              <a href={calidev.enlace} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--verde)] underline underline-offset-2">
                abrir mi enlace de firma
              </a>
            </li>
          )}
          {clienta && (
            <li className="flex flex-wrap items-center gap-2">
              Envíale a la clienta su enlace: <CopiarEnlace enlace={clienta.enlace} />
            </li>
          )}
        </ol>
        <button
          type="button"
          onClick={() => {
            setCreado(null);
            setAbierto(false);
            setD({ ...EJEMPLO_SERVINOMIC, fecha: hoy() });
          }}
          className="mt-4 cursor-pointer text-[13px] font-semibold text-[var(--verde)] underline underline-offset-2"
        >
          Listo
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#D8DCD4] bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[18px] font-bold">Nuevo contrato de ServiNomic</p>
        {bases.length > 0 && (
          <label className="text-[13px] font-semibold">
            Partir de{" "}
            <select className="ml-1 h-9 rounded-lg border-[1.5px] border-[#D8DCD4] bg-white px-2 text-[14px]" defaultValue="" onChange={(e) => partirDe(e.target.value)}>
              <option value="">Plantilla en blanco</option>
              {bases.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.titulo}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <Bloque titulo="Cliente">
        <Texto label="Nombre para el saludo" value={d.nombre} onChange={set("nombre")} placeholder="María José" />
        <Texto label="Negocio" value={d.negocio} onChange={set("negocio")} placeholder="Maison pure" />
        <Texto label="Ciudad del contrato" value={d.ciudad} onChange={set("ciudad")} />
        <label className={etiqueta}>
          Fecha del contrato
          <input type="date" className={campo} value={d.fecha} onChange={(e) => set("fecha")(e.target.value)} />
        </label>
      </Bloque>

      <Bloque titulo="Arranque">
        <Numero label="Precio publicado" value={d.arranquePublicado} onChange={set("arranquePublicado")} />
        <Numero label="Precio para este cliente" value={d.arranque} onChange={set("arranque")} />
        <div className="sm:col-span-2">
          <p className={etiqueta}>Cuotas</p>
          <div className="mt-1 flex flex-col gap-2">
            {d.cuotas.map((c, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <input
                  className={`${campo} mt-0 min-w-[220px] flex-1`}
                  placeholder="Entre el 1 y el 5 de noviembre de 2026"
                  value={c.cuando}
                  onChange={(e) => setD((x) => ({ ...x, cuotas: x.cuotas.map((y, j) => (j === i ? { ...y, cuando: e.target.value } : y)) }))}
                />
                <input
                  className={`${campo} mt-0 w-36`}
                  inputMode="numeric"
                  placeholder="Valor"
                  value={c.valor ? String(c.valor) : ""}
                  onChange={(e) => setD((x) => ({ ...x, cuotas: x.cuotas.map((y, j) => (j === i ? { ...y, valor: Number(e.target.value.replace(/\D/g, "")) || 0 } : y)) }))}
                />
                <button type="button" onClick={() => setD((x) => ({ ...x, cuotas: x.cuotas.filter((_, j) => j !== i) }))} className="cursor-pointer text-[13px] text-[#8C948D] underline">
                  Quitar
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[13px]">
            <button type="button" onClick={() => setD((x) => ({ ...x, cuotas: [...x.cuotas, { cuando: "", valor: 0 }] }))} className="cursor-pointer font-semibold text-[var(--verde)] underline underline-offset-2">
              Agregar cuota
            </button>
            <span className={`mono ${suma === d.arranque ? "text-[#46554D]" : "text-[#B42318]"}`}>
              Suman {pesos(suma)} de {pesos(d.arranque)}
            </span>
          </div>
        </div>
        <Texto label="Empieza el trabajo" value={d.inicio} onChange={set("inicio")} placeholder="miércoles 21 de octubre de 2026" />
        <Texto label="El arranque termina a más tardar" value={d.finArranque} onChange={set("finArranque")} placeholder="30 de noviembre de 2026" />
      </Bloque>

      <Bloque titulo="Mensualidad">
        <Numero label="Precio publicado" value={d.mensualidadPublicada} onChange={set("mensualidadPublicada")} />
        <Numero label="Precio para este cliente" value={d.mensualidad} onChange={set("mensualidad")} />
        <Numero label="Personas incluidas" value={d.personas} onChange={set("personas")} dinero={false} />
        <Numero label="Cada persona adicional" value={d.personaAdicional} onChange={set("personaAdicional")} />
        <Texto label="Se paga desde" value={d.mensualidadDesde} onChange={set("mensualidadDesde")} placeholder="diciembre de 2026" />
        <Texto label="Mes gratis" value={d.mesGratis} onChange={set("mesGratis")} placeholder="Noviembre de 2026" ayuda="Vacío si no hay mes gratis." />
      </Bloque>

      <Bloque titulo="Incluye">
        <label className="flex items-center gap-2 text-[14px] font-semibold sm:col-span-2">
          <input type="checkbox" className="h-5 w-5 accent-[var(--verde)]" checked={d.nomina} onChange={(e) => set("nomina")(e.target.checked)} />
          Pago de nómina con un clic (Wompi)
        </label>
        <Numero label="Sesiones de consultoría" value={d.consultorias} onChange={set("consultorias")} dinero={false} />
        <Texto label="Se usan hasta" value={d.consultoriasHasta} onChange={set("consultoriasHasta")} placeholder="31 de mayo de 2027" />
      </Bloque>

      <Bloque titulo="Permanencia">
        <Numero label="Meses (0 = sin permanencia)" value={d.permanenciaMeses} onChange={set("permanenciaMeses")} dinero={false} />
        <div />
        <Texto label="Desde" value={d.permanenciaDesde} onChange={set("permanenciaDesde")} placeholder="1 de diciembre de 2026" />
        <Texto label="Hasta" value={d.permanenciaHasta} onChange={set("permanenciaHasta")} placeholder="30 de noviembre de 2027" />
      </Bloque>

      {faltan.length > 0 && <p className="mt-5 text-[13.5px] text-[#6B4E00]">Para crearlo falta {faltan.join(", ")}.</p>}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setPrevia((x) => !x)} className="cursor-pointer rounded-xl border-[1.5px] border-[#D8DCD4] bg-white px-4 py-2.5 text-[14px] font-semibold text-[var(--verde)]">
          {previa ? "Ocultar vista previa" : "Ver vista previa"}
        </button>
        <button type="button" onClick={crear} disabled={enviando} className="cursor-pointer rounded-xl bg-[var(--lima)] px-5 py-2.5 text-[15px] font-extrabold text-[var(--tinta)] disabled:opacity-60">
          {enviando ? "Creando…" : "Crear contrato"}
        </button>
        <button type="button" onClick={() => setAbierto(false)} className="cursor-pointer text-[13px] text-[#46554D]">
          Cancelar
        </button>
      </div>
      {estado && <p role="alert" className="mt-3 text-[14px] font-semibold text-[#B42318]">{estado}</p>}

      {previa && (
        <div className="mt-5 overflow-hidden rounded-2xl border border-[#E6E8E3] p-4 sm:p-6">
          <div dangerouslySetInnerHTML={{ __html: htmlServinomic(d) }} />
        </div>
      )}
    </div>
  );
}
