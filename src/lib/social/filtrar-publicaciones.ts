import type { FilaPublicacion } from "./consultas";

/** Filtros de la tabla de publicaciones (Inicio y Publicaciones). Puro, para poder probarlo. */
export const FILTROS_PUBLICACIONES = [
  { id: "todas", texto: "Todas" },
  { id: "automatizadas", texto: "Automatizadas" },
  { id: "landing", texto: "Con landing" },
  { id: "reels", texto: "Reels" },
  { id: "posts", texto: "Publicaciones" },
  { id: "pruebas", texto: "Reels de prueba" },
  { id: "atender", texto: "Por atender" },
] as const;
export type FiltroPublicaciones = (typeof FILTROS_PUBLICACIONES)[number]["id"];

export function filtrarPublicaciones(filas: FilaPublicacion[], f: string): FilaPublicacion[] {
  switch (f) {
    case "automatizadas": return filas.filter((x) => x.modo === "automatico" || x.modo === "borradores");
    case "landing": return filas.filter((x) => !!x.landing);
    case "reels": return filas.filter((x) => x.tipo === "REELS" && x.enPerfil !== false);
    case "posts": return filas.filter((x) => x.tipo !== "REELS");
    // Instagram no marca los reels de prueba; lo único que los distingue es que no están en el perfil.
    case "pruebas": return filas.filter((x) => x.tipo === "REELS" && x.enPerfil === false);
    case "atender": return filas.filter((x) => x.revision > 0);
    default: return filas;
  }
}
