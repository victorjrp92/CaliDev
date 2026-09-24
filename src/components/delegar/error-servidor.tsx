"use client";

/** Error del servidor: se anuncia al aparecer y dice qué hacer. */
export function ErrorServidor({ texto }: { texto: string }) {
  return (
    <p role="alert" className="mt-5 rounded-2xl border border-[#F1C4BE] bg-[#FDF0EE] px-4 py-3 text-[15px] font-medium text-[#B42318]">
      {texto}
    </p>
  );
}
