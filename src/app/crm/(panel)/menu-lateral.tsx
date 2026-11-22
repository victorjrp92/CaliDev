"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { LogoCrm } from "../logo-crm";
import { Icono, type NombreIcono } from "./icono";
import { Salir } from "./salir";

type Item = { href: string; texto: string; icono: NombreIcono; cuenta?: number; pronto?: boolean };

/** Iniciales para el avatar: «Victor Ramos» → «VR». */
function iniciales(nombre: string) {
  return nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "?";
}

/**
 * Menú de secciones a la izquierda. Contratos y Finanzas se anuncian sin
 * enlace hasta que existan (fases 1b y 1c). En el teléfono el menú se vuelve
 * una fila que se desplaza de lado.
 */
export function MenuLateral({ nombre, rol, pendientes, agentes }: { nombre: string; rol: string; pendientes: number; agentes: boolean }) {
  const ruta = usePathname();
  const nav = useRef<HTMLElement>(null);
  // En el teléfono el menú es una fila que se desplaza: la sección activa tiene que quedar a la vista.
  useEffect(() => {
    const n = nav.current;
    const activo = n?.querySelector<HTMLElement>("[aria-current=page]");
    if (n && activo && n.scrollWidth > n.clientWidth) n.scrollTo({ left: activo.offsetLeft - (n.clientWidth - activo.offsetWidth) / 2 });
  }, [ruta]);
  const grupos: { titulo: string; items: Item[] }[] = [
    {
      titulo: "Día a día",
      items: [
        { href: "/crm/hoy", texto: "Hoy", icono: "sol" },
        { href: "/crm/agenda", texto: "Agenda", icono: "calendario" },
        { href: "/crm/aprobaciones", texto: "Aprobaciones", icono: "escudo", cuenta: pendientes },
      ],
    },
    {
      titulo: "Comercial",
      items: [
        { href: "/crm/ventas", texto: "Ventas", icono: "barras" },
        { href: "/crm/contactos", texto: "Contactos", icono: "personas" },
        { href: "/crm/contratos", texto: "Contratos", icono: "documento" },
        { href: "/crm/finanzas", texto: "Finanzas", icono: "billete", pronto: true },
      ],
    },
  ];
  if (agentes) grupos.push({ titulo: "Equipo", items: [{ href: "/crm/agentes", texto: "Agentes", icono: "robot" }] });

  return (
    <aside className="lateral">
      <Link href="/crm/hoy" className="marca">
        <LogoCrm />
        <span className="marca-nombre">Calidev</span>
        <span className="nota">CRM</span>
      </Link>

      <form action="/crm/contactos" method="get" role="search">
        <label className="buscador">
          <Icono nombre="lupa" tamano={15} grosor={2} />
          <span className="oculto">Buscar contactos</span>
          <input type="search" name="q" placeholder="Buscar contactos…" autoComplete="off" />
        </label>
      </form>

      <nav ref={nav} className="nav" aria-label="Secciones">
        {grupos.map((g) => (
          <div key={g.titulo} className="contents">
            <p className="grupo">{g.titulo}</p>
            {g.items.map((it) =>
              it.pronto ? (
                <span key={it.href} className="nav-item pronto" aria-disabled="true">
                  <Icono nombre={it.icono} />
                  {it.texto}
                  <span className="etq-pronto">Pronto</span>
                </span>
              ) : (
                <Link key={it.href} href={it.href} className="nav-item" aria-current={ruta === it.href || ruta.startsWith(`${it.href}/`) ? "page" : undefined}>
                  <Icono nombre={it.icono} />
                  {it.texto}
                  {!!it.cuenta && <span className="contador">{it.cuenta}<span className="oculto"> pendientes</span></span>}
                </Link>
              ),
            )}
          </div>
        ))}
      </nav>

      <div className="pie-lateral">
        <span className="avatar" aria-hidden="true">{iniciales(nombre)}</span>
        <span className="quien">
          <span className="fuerte truncate text-[13px]">{nombre}</span>
          <span className="nota">{rol}</span>
        </span>
        <Salir />
      </div>
    </aside>
  );
}
