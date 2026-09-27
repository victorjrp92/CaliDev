/**
 * Formato de fechas del panel, en un solo lugar y con zona fija. Sin zona fija
 * el servidor (UTC en Vercel) y el navegador escriben horas distintas, y los
 * componentes de cliente fallan al hidratar. Victor lee el panel desde
 * Frankfurt: esa es la zona.
 */
const ZONA = "Europe/Berlin";

export const fechaHora = (iso: string) =>
  new Intl.DateTimeFormat("es-CO", { dateStyle: "short", timeStyle: "short", timeZone: ZONA }).format(new Date(iso));
export const diaMes = (iso: string) =>
  new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", timeZone: ZONA }).format(new Date(iso));
export const fechaLarga = (iso: string) =>
  new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeZone: ZONA }).format(new Date(iso));
