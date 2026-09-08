"use client";

import { useEffect, useRef } from "react";

/**
 * Semiesfera de partículas que gira despacio bajo las órbitas.
 *
 * Los puntos se reparten con la espiral de Fibonacci —la única forma de
 * distribuirlos de verdad uniformemente sobre una esfera; al azar se apelmazan
 * en los polos— y se proyectan con perspectiva simple, así que el tamaño y la
 * opacidad de cada uno delatan su profundidad y la bola se lee como volumen y
 * no como un disco de puntos.
 *
 * Solo dibuja cuando está a la vista, y con `prefers-reduced-motion` pinta un
 * único fotograma y para: un lienzo animado fuera de pantalla gasta batería
 * sin que nadie lo vea.
 */
export function EsferaParticulas({
  puntos = 1000,
  color = "#C8F045",
  colorProfundo = "#3E7A5E",
  className = "",
}: {
  puntos?: number;
  color?: string;
  colorProfundo?: string;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Espiral de Fibonacci sobre la esfera unidad.
    const phi = Math.PI * (3 - Math.sqrt(5));
    const nube = Array.from({ length: puntos }, (_, i) => {
      const y = 1 - (i / (puntos - 1)) * 2;
      const radio = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = phi * i;
      return { x: Math.cos(theta) * radio, y, z: Math.sin(theta) * radio };
    });

    let ancho = 0;
    let alto = 0;
    const medir = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      ancho = r.width;
      alto = r.height;
      canvas.width = Math.round(ancho * dpr);
      canvas.height = Math.round(alto * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    medir();

    const pintar = (angulo: number) => {
      ctx.clearRect(0, 0, ancho, alto);
      const cx = ancho / 2;
      const cy = alto / 2;
      const R = Math.min(ancho, alto) / 2 - 2;
      const fov = 2.6;
      const sen = Math.sin(angulo);
      const cos = Math.cos(angulo);

      for (const p of nube) {
        const x = p.x * cos - p.z * sen;
        const z = p.x * sen + p.z * cos;
        const escala = fov / (fov + z);
        const px = cx + x * R * escala;
        const py = cy + p.y * R * escala;
        // z va de -1 (cerca) a 1 (lejos): lo normalizo a 0..1 para mezclar.
        const cerca = (1 - z) / 2;
        ctx.globalAlpha = 0.22 + cerca * 0.68;
        ctx.fillStyle = cerca > 0.55 ? color : colorProfundo;
        ctx.beginPath();
        ctx.arc(px, py, 0.6 + cerca * 1.7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    if (still) {
      pintar(0);
      return;
    }

    let raf = 0;
    let visible = false;
    let t0 = 0;

    const bucle = (t: number) => {
      if (!t0) t0 = t;
      pintar(((t - t0) / 1000) * 0.16);
      raf = requestAnimationFrame(bucle);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !visible) {
          visible = true;
          t0 = 0;
          raf = requestAnimationFrame(bucle);
        } else if (!e.isIntersecting && visible) {
          visible = false;
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0.05 }
    );
    io.observe(canvas);

    const onResize = () => {
      medir();
      if (!visible) pintar(0);
    };
    window.addEventListener("resize", onResize);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [puntos, color, colorProfundo]);

  return <canvas ref={ref} aria-hidden="true" className={`block h-full w-full ${className}`} />;
}
