/**
 * Monograma CD de la marca, en línea y no como `<img>`.
 *
 * Va en línea porque tiene que cambiar de color: sobre el hero es hueso y sobre
 * un panel claro es verde. Con `currentColor` lo hereda del contenedor y no
 * hacen falta dos archivos.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="6 4 195 112"
      role="img"
      aria-label="CaliDev"
      className={className}
      fill="currentColor"
      fillRule="evenodd"
    >
      <title>CaliDev</title>
      <path d="M104.9 24 A56 56 0 1 0 104.9 96 L87.28 81.21 A33 33 0 1 1 87.28 38.79 Z" />
      <path d="M122 4 L145 4 A56 56 0 0 1 145 116 L122 116 Z M145 27 A33 33 0 0 1 145 93 Z" />
    </svg>
  );
}
