import type { Metadata } from "next";
import { diaLargo } from "@/lib/crm/formato";
import { hoy } from "@/lib/crm/hoy";
import { actorDePagina } from "@/lib/crm/pagina";
import { BarraSeccion } from "../barra-seccion";
import { Cuerpo } from "../cuerpo";
import { MetaSemana } from "./meta-semana";
import { PanelAtencion } from "./panel-atencion";
import { PanelCitas } from "./panel-citas";

export const metadata: Metadata = { title: "Hoy" };

type Props = { searchParams: Promise<{ vista?: string }> };

/** El día: citas, lo que pide atención y el embudo de la semana. «Mi día» deja solo tus tareas y las sin asignar. */
export default async function Hoy({ searchParams }: Props) {
  const sp = await searchParams;
  const equipo = sp.vista === "equipo";
  const a = await actorDePagina();
  const h = await hoy(a);
  const yo = a.usuario.id;
  const tareas = h.tareas && !equipo ? h.tareas.filter((t) => t.asignada_a === null || t.asignada_a === yo) : h.tareas;
  return (
    <>
      <BarraSeccion
        titulo={`Hola, ${a.usuario.nombre.split(" ")[0]}`}
        subtitulo={<span className="capitalize-first">{diaLargo(h.dia)} · hora de Colombia</span>}
        segmentos={[
          { href: "/crm/hoy", etiqueta: "Mi día", activo: !equipo },
          { href: "/crm/hoy?vista=equipo", etiqueta: "Todo el equipo", activo: equipo },
        ]}
      />
      <Cuerpo>
        <div className="flex flex-wrap items-start gap-5">
          <PanelCitas citas={h.citas} sinHora={h.citas_sin_hora} />
          <PanelAtencion h={h} yo={yo} tareas={tareas} />
        </div>
        {h.embudo && <MetaSemana e={h.embudo} />}
      </Cuerpo>
    </>
  );
}
