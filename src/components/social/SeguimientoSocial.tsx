"use client";

import { useEffect } from "react";
import { detectorRabia, esClicMuerto } from "@/lib/social/seguimiento";

/**
 * Mapa de calor propio de las landings. Registra la visita, hasta dónde se
 * baja, qué secciones ([data-seccion]) se ven, los clics (con clic muerto y de
 * rabia) y el paso del formulario (evento "social:paso"). Si la visita viene
 * del botón de Instagram (?c=), queda ligada a esa persona.
 *
 * Envía por lotes con sendBeacon: no frena la página ni se pierde al cerrarla.
 * No guarda IP ni texto escrito en los campos.
 */
const CLAVE = "social_codigo";

function selector(el: Element): string {
  const partes: string[] = [];
  let n: Element | null = el;
  for (let i = 0; n && i < 4 && n.tagName !== "BODY"; i++, n = n.parentElement) {
    const id = n.id ? `#${n.id}` : "";
    const texto = n.tagName === "A" || n.tagName === "BUTTON" ? `[${(n.textContent ?? "").trim().slice(0, 24)}]` : "";
    partes.unshift(`${n.tagName.toLowerCase()}${id}${texto}`);
    if (id) break;
  }
  return partes.join(">").slice(0, 160);
}

export function SeguimientoSocial({ landing }: { landing: string }) {
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const codigo = params.get("c");
    try {
      if (codigo && /^[a-z0-9]{10}$/.test(codigo)) sessionStorage.setItem(CLAVE, codigo);
    } catch {}
    let guardado: string | null = null;
    try { guardado = sessionStorage.getItem(CLAVE); } catch {}

    const visita = crypto.randomUUID();
    const vistas = new Set<string>();
    let maxScroll = 0;
    let paso = 0;
    let cola: object[] = [];
    const rabia = detectorRabia();

    const enviar = (cerrar = false) => {
      const cuerpo = JSON.stringify({
        visita, landing, codigo: guardado, dispositivo: innerWidth < 768 ? "celular" : "computador",
        maxScroll: Math.round(maxScroll * 100) / 100, secciones: [...vistas], paso, clics: cola.slice(0, 40), cerrar,
      });
      cola = [];
      navigator.sendBeacon?.("/api/social/t", new Blob([cuerpo], { type: "application/json" }));
    };

    const alScroll = () => {
      const alto = document.documentElement.scrollHeight - innerHeight;
      if (alto > 0) maxScroll = Math.max(maxScroll, Math.min(1, scrollY / alto));
    };
    const obs = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && vistas.add((e.target as HTMLElement).dataset.seccion ?? "")),
      { threshold: 0.35 },
    );
    document.querySelectorAll("[data-seccion]").forEach((s) => obs.observe(s));

    const alClic = (ev: MouseEvent) => {
      const el = ev.target as Element | null;
      if (!el) return;
      const cadena: { etiqueta: string; rol?: string | null; clicable?: boolean }[] = [];
      for (let n: Element | null = el; n && n.tagName !== "BODY"; n = n.parentElement) {
        cadena.push({ etiqueta: n.tagName, rol: n.getAttribute("role"), clicable: n.hasAttribute("onclick") });
      }
      const seccion = (el.closest("[data-seccion]") as HTMLElement | null)?.dataset.seccion ?? null;
      const caja = (el.closest("[data-seccion]") ?? document.body).getBoundingClientRect();
      cola.push({
        selector: selector(el), seccion,
        x: Math.round(((ev.clientX - caja.left) / Math.max(1, caja.width)) * 1000) / 1000,
        y: Math.round(((ev.clientY - caja.top) / Math.max(1, caja.height)) * 1000) / 1000,
        muerto: esClicMuerto(cadena), rabia: rabia(ev.timeStamp, ev.clientX, ev.clientY),
      });
      if (cola.length >= 20) enviar();
    };
    const alPaso = (ev: Event) => {
      paso = Math.max(paso, Number((ev as CustomEvent).detail) || 0);
      enviar();
    };
    const alOcultar = () => document.visibilityState === "hidden" && enviar(true);

    enviar();
    addEventListener("scroll", alScroll, { passive: true });
    addEventListener("click", alClic, true);
    addEventListener("social:paso", alPaso);
    document.addEventListener("visibilitychange", alOcultar);
    const reloj = setInterval(() => enviar(), 15_000);
    return () => {
      obs.disconnect();
      clearInterval(reloj);
      removeEventListener("scroll", alScroll);
      removeEventListener("click", alClic, true);
      removeEventListener("social:paso", alPaso);
      document.removeEventListener("visibilitychange", alOcultar);
    };
  }, [landing]);
  return null;
}

/** Para el formulario: el código de la persona si vino de Instagram. */
export function codigoSocial(): string | null {
  try { return sessionStorage.getItem(CLAVE); } catch { return null; }
}
