"use client";

import { createContext, useContext } from "react";
import { upload } from "@vercel/blob/client";
import { carpetaDe } from "@/lib/arranque/archivos";

/**
 * El token del enlace, para que los campos que suben archivos sepan a qué
 * carpeta van sin pasarlo por cada sección.
 */
const Contexto = createContext<string>("");

export const ProveedorArranque = Contexto.Provider;

/** Sube un archivo a la carpeta del enlace y devuelve su URL. */
export function useSubir() {
  const token = useContext(Contexto);
  return async (ruta: string, contenido: Blob, tipo: string) => {
    const r = await upload(carpetaDe(token) + ruta, contenido, {
      access: "public",
      handleUploadUrl: "/api/arranque/subir",
      clientPayload: token,
      contentType: tipo,
    });
    return r.url;
  };
}
