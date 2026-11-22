import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { actorPorCookie } from "@/lib/crm/guardia";
import { COOKIE_SESION } from "@/lib/crm/sesion";
import { TarjetaAcceso } from "../tarjeta-acceso";
import { FormularioEntrar } from "./formulario-entrar";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Entrar" };

export default async function Entrar() {
  if (await actorPorCookie((await cookies()).get(COOKIE_SESION)?.value)) redirect("/crm/hoy");
  return (
    <TarjetaAcceso titulo="Entrar">
      <p className="mt-2 text-[15px] leading-relaxed text-[var(--texto-2)]">Con tu correo y la contraseña que elegiste al aceptar la invitación.</p>
      <FormularioEntrar />
    </TarjetaAcceso>
  );
}
