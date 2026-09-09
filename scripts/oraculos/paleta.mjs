/** Fichas de SEÑAL. Única fuente de verdad para los oráculos de color. */
export const PALETA = {
  verde: "#0a3d2e",
  lima: "#c8f045",
  azul: "#0f2233",
  niebla: "#e6e8e3",
  hueso: "#fafaf7",
  tinta: "#14201b",
  verdeHondo: "#072a20",
};

/** El velo de la barra: verde de marca al 78 %. */
export const CRISTAL = { color: PALETA.verde, alpha: 0.78 };

const canal = (v) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

export const rgb = (hex) => {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};

export const luminancia = (hex) => {
  const [r, g, b] = rgb(hex).map(canal);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const ratio = (fg, bg) => {
  const [a, b] = [luminancia(fg), luminancia(bg)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
};

/** Mezcla `capa` con opacidad `alpha` sobre `fondo`. Devuelve hex. */
export const componer = (capa, alpha, fondo) => {
  const [cr, cg, cb] = rgb(capa);
  const [fr, fg_, fb] = rgb(fondo);
  const mez = [cr * alpha + fr * (1 - alpha), cg * alpha + fg_ * (1 - alpha), cb * alpha + fb * (1 - alpha)];
  return "#" + mez.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
};
