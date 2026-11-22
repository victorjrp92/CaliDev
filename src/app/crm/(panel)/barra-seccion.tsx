import Link from "next/link";
import { Icono } from "./icono";

export type Segmento = { href: string; etiqueta: string; activo: boolean; cuenta?: number | null };

/**
 * Cabecera de cada sección: título, el submenú segmentado propio de la sección
 * y su acción principal. Se queda pegada arriba al desplazar.
 */
export function BarraSeccion({ titulo, subtitulo, volver, segmentos, accion }: {
  titulo: React.ReactNode;
  subtitulo?: React.ReactNode;
  volver?: { href: string; etiqueta: string };
  segmentos?: Segmento[];
  accion?: { href: string; etiqueta: string };
}) {
  return (
    <header className="barra">
      <div className="barra-titulos">
        {volver && (
          <Link href={volver.href} className="volver inline-flex items-center gap-1">
            <Icono nombre="atras" tamano={14} grosor={2.2} />
            {volver.etiqueta}
          </Link>
        )}
        <h1 className="titulo-grande">{titulo}</h1>
        {subtitulo && <div className="nota text-[13px]">{subtitulo}</div>}
      </div>
      {segmentos && segmentos.length > 1 && (
        <nav className="segmentado" aria-label="Vistas de la sección">
          {segmentos.map((s) => (
            <Link key={s.href} href={s.href} className="seg" aria-current={s.activo ? "page" : undefined}>
              {s.etiqueta}
              {s.cuenta !== undefined && s.cuenta !== null && <span className="num">{s.cuenta}</span>}
            </Link>
          ))}
        </nav>
      )}
      {accion && (
        <div className="barra-acciones">
          <Link href={accion.href} className="boton" scroll={false}>
            <Icono nombre="mas" tamano={14} grosor={2.4} />
            {accion.etiqueta}
          </Link>
        </div>
      )}
    </header>
  );
}
