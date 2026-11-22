import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { actorPorCookie } from "@/lib/crm/guardia";
import { COOKIE_SESION } from "@/lib/crm/sesion";
import { FormularioEntrar } from "./formulario-entrar";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Entrar" };

export default async function Entrar() {
  if (await actorPorCookie((await cookies()).get(COOKIE_SESION)?.value)) redirect("/crm/hoy");
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-16">
      <p className="mono text-[var(--verde)]">calidev / crm</p>
      <h1 className="mt-3 text-[28px] font-extrabold leading-tight tracking-tight">Entrar</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-[#46554D]">Con tu correo y la contraseña que elegiste al aceptar la invitación.</p>
      <FormularioEntrar />
    </main>
  );
}
