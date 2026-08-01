/**
 * Iconos de los rubros, dibujados a mano en SVG.
 *
 * Se descartó fotografía de stock a propósito: la página se sostiene en que
 * todo lo que muestra es real (el equipo de LimpiaExpress, su web, sus
 * resultados). Meter fotos genéricas de gente que no es cliente rompe justo esa
 * regla, y hoy el stock se lee como plantilla.
 */

type IconProps = { className?: string };

const base = "h-6 w-6";

export function CleaningIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.7" className={className}>
      <path d="M14 3.5 10 7.5" stroke="currentColor" strokeLinecap="round" />
      <path
        d="M9 6.5 13.5 11 9.8 14.7a3.2 3.2 0 0 1-4.5 0L5 14.4a3.2 3.2 0 0 1 0-4.5z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <path d="M15.5 14v6M18.5 13v7M21 15v5" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

export function CareIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.7" className={className}>
      <circle cx="12" cy="7" r="3.2" stroke="currentColor" />
      <path
        d="M4.5 20.5c0-3.6 3.4-6 7.5-6s7.5 2.4 7.5 6"
        stroke="currentColor"
        strokeLinecap="round"
      />
      <path
        d="M15.6 3.4c.9-.9 2.3-.9 3.1 0 .9.9.9 2.3 0 3.1l-3.1 3-3.1-3c-.9-.8-.9-2.2 0-3.1.8-.9 2.2-.9 3.1 0Z"
        stroke="currentColor"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.15"
      />
    </svg>
  );
}

export function BeautyIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.7" className={className}>
      <path
        d="M9.5 3.5h5l-.7 5.2a1.8 1.8 0 0 1-1.8 1.6h0a1.8 1.8 0 0 1-1.8-1.6z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <path d="M12 10.3v4.2" stroke="currentColor" strokeLinecap="round" />
      <rect x="8.5" y="14.5" width="7" height="6" rx="2" stroke="currentColor" />
      <path d="M5 6.5 3 8M19 6.5 21 8" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

export function MaintenanceIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.7" className={className}>
      <path
        d="M14.8 3.6a4.6 4.6 0 0 0-5.4 6l-6 6a1.7 1.7 0 0 0 0 2.4l.6.6a1.7 1.7 0 0 0 2.4 0l6-6a4.6 4.6 0 0 0 6-5.4l-2.8 2.8-2.5-.6-.6-2.5z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <path d="M15 15l5 5" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}
