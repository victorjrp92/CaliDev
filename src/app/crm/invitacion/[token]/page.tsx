import type { Metadata } from "next";
import Link from "next/link";
import { invitacionVigente } from "@/lib/crm/usuarios";
import { FormularioInvitacion } from "./formulario-invitacion";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Invitación" };

/** Enlace de un solo uso: la persona elige su contraseña y queda dentro. */
export default async function Invitacion({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const u = await invitacionVigente(token).catch(() => null);
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-16">
      <p className="mono text-[var(--verde)]">calidev / crm</p>
      {u ? (
        <>
          <h1 className="mt-3 text-[28px] font-extrabold leading-tight tracking-tight">Hola, {u.nombre.split(" ")[0]}</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-[#46554D]">
            Elige tu contraseña para entrar al CRM con <strong className="font-semibold text-[var(--tinta)]">{u.correo}</strong>. Mínimo 10 caracteres; una frase corta sirve.
          </p>
          <FormularioInvitacion token={token} correo={u.correo} />
        </>
      ) : (
        <>
          <h1 className="mt-3 text-[28px] font-extrabold leading-tight tracking-tight">Este enlace ya no sirve</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-[#46554D]">
            Se usó una vez o venció. Pide a Victor uno nuevo; si ya tienes contraseña, entra directo.
          </p>
          <Link href="/crm/entrar" className="boton-principal mt-8 text-center">Ir a entrar</Link>
        </>
      )}
    </main>
  );
}
