import { ESTILO_CONTRATO } from "@/lib/contratos/estilo-contrato";

/**
 * Plantilla del contrato de implementación y suscripción de ServiNomic.
 *
 * Es el contrato que se firmó con Maison pure en octubre de 2026, con lo que
 * cambia de un cliente a otro convertido en datos: precios publicados y
 * finales, cuotas, mensualidad, mes gratis, consultorías, fechas y
 * permanencia. El orden es el mismo: primero lo que recibe el cliente, en
 * grande; al final las condiciones, en texto sobrio pero legible.
 *
 * Es una función pura (sin servidor): el formulario del panel la usa para la
 * vista previa y el HTML que sale de aquí es exactamente el que se guarda y se
 * firma.
 */

export type Cuota = { cuando: string; valor: number };

export type DatosServinomic = {
  /** Cómo se le saluda: «María José». */
  nombre: string;
  negocio: string;
  ciudad: string;
  /** Fecha del contrato, AAAA-MM-DD. */
  fecha: string;
  arranquePublicado: number;
  arranque: number;
  cuotas: Cuota[];
  mensualidadPublicada: number;
  mensualidad: number;
  personas: number;
  personaAdicional: number;
  /** «diciembre de 2026» */
  mensualidadDesde: string;
  /** «Noviembre de 2026», o vacío si no hay mes gratis. */
  mesGratis: string;
  nomina: boolean;
  consultorias: number;
  consultoriasHasta: string;
  /** «miércoles 21 de octubre de 2026» */
  inicio: string;
  /** «30 de noviembre de 2026» */
  finArranque: string;
  permanenciaMeses: number;
  permanenciaDesde: string;
  permanenciaHasta: string;
};

export const EJEMPLO_SERVINOMIC: DatosServinomic = {
  nombre: "",
  negocio: "",
  ciudad: "Cali",
  fecha: "",
  arranquePublicado: 2_500_000,
  arranque: 1_850_000,
  cuotas: [
    { cuando: "Entre el 1 y el 5 de noviembre de 2026", valor: 950_000 },
    { cuando: "Entre el 1 y el 5 de diciembre de 2026", valor: 900_000 },
  ],
  mensualidadPublicada: 250_000,
  mensualidad: 150_000,
  personas: 10,
  personaAdicional: 15_000,
  mensualidadDesde: "diciembre de 2026",
  mesGratis: "",
  nomina: true,
  consultorias: 0,
  consultoriasHasta: "",
  inicio: "",
  finArranque: "",
  permanenciaMeses: 12,
  permanenciaDesde: "",
  permanenciaHasta: "",
};

function esc(t: string): string {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function pesos(n: number): string {
  return "$" + Math.round(n).toLocaleString("es-CO");
}

function porcentaje(publicado: number, final: number): number {
  return publicado > 0 ? Math.round((1 - final / publicado) * 100) : 0;
}

function fechaLarga(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  return new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z"));
}

export function tituloServinomic(d: DatosServinomic): string {
  return `Contrato ServiNomic · ${d.negocio.trim() || d.nombre.trim() || "cliente"}`;
}

/** Lo que el cliente se ahorra el primer año frente a los precios publicados. */
export function ahorroPrimerAno(d: DatosServinomic): number {
  return Math.max(0, d.arranquePublicado - d.arranque) + 12 * Math.max(0, d.mensualidadPublicada - d.mensualidad) + (d.mesGratis.trim() ? d.mensualidad : 0);
}

export function htmlServinomic(d: DatosServinomic): string {
  const nombre = esc(d.nombre.trim() || "Cliente");
  const negocio = esc(d.negocio.trim());
  const totalCuotas = d.cuotas.reduce((s, c) => s + c.valor, 0);
  const descArranque = Math.max(0, d.arranquePublicado - d.arranque);
  const pctArranque = porcentaje(d.arranquePublicado, d.arranque);
  const pctMes = porcentaje(d.mensualidadPublicada, d.mensualidad);
  const ahorro = ahorroPrimerAno(d);
  const gratis = d.mesGratis.trim();
  const nCuotas = d.cuotas.length;

  const tachado = (publicado: number, final: number) => (publicado > final ? ` <span class="was">${pesos(publicado)}</span>` : "");

  const piezasAhorro = [
    descArranque > 0 ? `${pesos(descArranque)} en el arranque` : "",
    d.mensualidadPublicada > d.mensualidad ? `${pesos(12 * (d.mensualidadPublicada - d.mensualidad))} en mensualidades` : "",
    gratis ? `un mes gratis de ${pesos(d.mensualidad)}` : "",
  ].filter(Boolean);
  const extrasAhorro = [d.nomina ? "el pago de nómina" : "", d.consultorias > 0 ? "las consultorías incluidas" : ""].filter(Boolean);

  const regalos: string[] = [
    `<div class="regalo${descArranque > 0 ? " hl" : ""}"><p class="k">Arranque (una sola vez)</p><p class="v">${pesos(d.arranque)}${tachado(d.arranquePublicado, d.arranque)}</p><p class="d">${pctArranque > 0 ? `${pctArranque}% menos, ` : ""}${nCuotas > 1 ? `en ${nCuotas} cuotas sin intereses.` : "en un solo pago."}</p></div>`,
    `<div class="regalo${pctMes > 0 ? " hl" : ""}"><p class="k">Mensualidad · hasta ${d.personas} personas</p><p class="v">${pesos(d.mensualidad)}${tachado(d.mensualidadPublicada, d.mensualidad)}</p><p class="d">${pctMes > 0 ? `${pctMes}% menos cada mes. ` : ""}Empiezas a pagarla en ${esc(d.mensualidadDesde)}.</p></div>`,
  ];
  if (gratis) regalos.push(`<div class="regalo"><p class="k">${esc(gratis)}</p><p class="v">Mes gratis</p><p class="d">Usas la app completa sin pagar mensualidad.</p></div>`);
  if (d.nomina) regalos.push(`<div class="regalo"><p class="k">Pago de nómina con un clic</p><p class="v">Incluido</p><p class="d">Normalmente solo viene en el plan Operación.</p></div>`);
  if (d.consultorias > 0) regalos.push(`<div class="regalo"><p class="k">Consultoría</p><p class="v">${d.consultorias} ${d.consultorias === 1 ? "sesión incluida" : "sesiones incluidas"}</p><p class="d">Con nuestro equipo, para ordenar tu negocio más allá de la app.</p></div>`);
  regalos.push(`<div class="regalo"><p class="k">La app</p><p class="v">Todas sus funciones</p><p class="d">Agenda, liquidación semanal, seguridad social, clientes, equipo y pagos.</p></div>`);

  const filas = [
    `<tr><td>${esc(fechaLarga(d.fecha) || "Fecha de firma")}</td><td>Firma del contrato</td><td class="r mono">$0</td></tr>`,
    ...d.cuotas.map((c, i) => `<tr><td>${esc(c.cuando)}</td><td>${nCuotas > 1 ? `Cuota ${i + 1} del arranque` : "Arranque"}</td><td class="r mono">${pesos(c.valor)}</td></tr>`),
    gratis ? `<tr><td>${esc(gratis)}</td><td>Mensualidad <span class="tag">Gratis</span></td><td class="r mono">$0</td></tr>` : "",
    `<tr><td>Desde ${esc(d.mensualidadDesde)}, entre el 1 y el 5 de cada mes</td><td>Mensualidad</td><td class="r mono">${pesos(d.mensualidad)}</td></tr>`,
  ].join("");

  const textoCuotas =
    nCuotas > 1
      ? `pagaderos en ${nCuotas} cuotas: ${d.cuotas.map((c) => `${pesos(c.valor)} ${esc(c.cuando.charAt(0).toLowerCase() + c.cuando.slice(1))}`).join(", ").replace(/, ([^,]*)$/, " y $1")}`
      : nCuotas === 1
        ? `pagaderos ${esc(d.cuotas[0].cuando.charAt(0).toLowerCase() + d.cuotas[0].cuando.slice(1))}`
        : "pagaderos al firmar";

  const clausulas: [string, string][] = [
    ["Partes", `De una parte, ${negocio ? `la persona propietaria de ${negocio}` : "la persona que firma como Clienta"} (en adelante, la Clienta). De la otra, CaliDev. Cada parte queda identificada con los datos y la verificación de identidad que registra al firmar, que constan en la constancia de firma al final de este documento y hacen parte de este contrato.`],
    ["Objeto", `CaliDev realiza el arranque de ServiNomic descrito en este documento y le concede a la Clienta el uso de la aplicación mediante una suscripción mensual, con todas las funciones que la aplicación tiene a la fecha de firma, para hasta ${d.personas} personas en su equipo.`],
    ["Precio y pagos", `El arranque vale ${pesos(d.arranque)}, ${textoCuotas}. La mensualidad vale ${pesos(d.mensualidad)} y se paga entre el 1 y el 5 de cada mes desde ${esc(d.mensualidadDesde)}${gratis ? `; ${esc(gratis.charAt(0).toLowerCase() + gratis.slice(1))} no se cobra` : ""}. Desde la persona ${d.personas + 1} del equipo, cada persona adicional suma ${pesos(d.personaAdicional)} al mes. Los pagos se hacen a la cuenta que CaliDev indique por escrito. Ningún valor genera intereses.`],
    ["Alcance del arranque", "«Adaptar» ServiNomic significa configurar la aplicación a la operación de la Clienta, no desarrollar funciones que no existen hoy. Cualquier función nueva se cotiza aparte y solo se hace si la Clienta la aprueba por escrito."],
    ["Entrega del arranque", `El arranque termina según lo descrito en este documento. Firmada el acta, o pasados 3 días hábiles sin observaciones escritas de la Clienta, el arranque se da por recibido. Si hay demora por información o reuniones pendientes de parte de la Clienta, el arranque igual cierra el ${esc(d.finArranque)}; lo pendiente por esa causa se termina después, sin costo adicional.`],
  ];
  if (d.permanenciaMeses > 0) {
    clausulas.push([
      `Permanencia de ${d.permanenciaMeses} meses`,
      `Los precios especiales de este contrato se conceden a cambio de una permanencia mínima de ${d.permanenciaMeses} meses, del ${esc(d.permanenciaDesde)} al ${esc(d.permanenciaHasta)}. ${descArranque > 0 ? `Si la Clienta termina el contrato antes, pagará ${pesos(descArranque)}, que corresponden al descuento recibido en el arranque. Esta suma no se cobra si el negocio de la Clienta entra en un proceso de insolvencia o liquidación por quiebra, acreditado con el documento del proceso.` : "Si la Clienta termina el contrato antes, avisará por escrito con 30 días de anticipación."}`,
    ]);
  }
  clausulas.push(
    ["Si un pago se atrasa", "Durante los primeros 10 días de mora la cuenta sigue funcionando. Desde el día 11 queda en modo de solo lectura. Desde el día 30 se suspende el acceso y CaliDev le entrega a la Clienta toda su información en formato Excel. Pasados 90 días sin pago, la información se borra, con aviso previo de 10 días. El arranque pagado no se reembolsa, porque corresponde a un trabajo realizado. Si la Clienta se pone al día dentro de los 6 meses siguientes, se reactiva su cuenta sin volver a cobrar el arranque."],
    ["Propiedad", "ServiNomic y las configuraciones o adaptaciones hechas en él son propiedad de CaliDev; la Clienta recibe el derecho de uso mientras la suscripción esté vigente. La información del negocio de la Clienta (clientes, equipo, servicios y pagos) es suya, y puede pedir una copia en cualquier momento."],
    ["Datos personales", "La Clienta es la responsable de los datos personales de su equipo y sus clientes, y CaliDev actúa como encargado de su tratamiento, conforme a la Ley 1581 de 2012. CaliDev usará esos datos solo para prestar el servicio, los mantendrá protegidos y no los compartirá con terceros, salvo con los proveedores necesarios para operar la aplicación y los pagos (como Wompi)."]
  );
  if (d.nomina) clausulas.push(["Pagos de nómina", "Los pagos al equipo se procesan a través de Wompi. La comisión de cada transferencia la cobra Wompi y corre por cuenta de la Clienta."]);
  clausulas.push(
    ["Duración y renovación", `${d.permanenciaMeses > 0 ? `Después de los ${d.permanenciaMeses} meses de permanencia, la suscripción se renueva mes a mes` : "La suscripción se renueva mes a mes"}. Cualquiera de las partes puede terminarla avisando por escrito con 30 días de anticipación. Los precios de este contrato se mantienen ${d.permanenciaMeses > 0 ? "durante la permanencia" : "durante los primeros 12 meses"}; después, CaliDev puede ajustarlos como máximo según el IPC del año anterior, avisando con 30 días de anticipación.`],
    ["Firma electrónica", "Las partes firman este contrato electrónicamente y reconocen esa firma con la misma validez que la firma manuscrita, conforme a la Ley 527 de 1999 y el Decreto 2364 de 2012."],
    ["Diferencias y ley aplicable", `Este contrato se rige por la ley colombiana. Cualquier diferencia se intentará resolver directamente entre las partes durante 15 días hábiles; si no hay acuerdo, se acudirá a los jueces de ${esc(d.ciudad || "Cali")}.`]
  );

  const consultoria =
    d.consultorias > 0
      ? `<section><p class="eyebrow">Las consultorías</p><h2>${d.consultorias === 1 ? "Una sesión" : `${d.consultorias === 2 ? "Dos" : d.consultorias === 3 ? "Tres" : d.consultorias} sesiones`} con nuestro equipo</h2><p class="lead">${d.consultorias === 1 ? "Una sesión" : `${d.consultorias} sesiones`} de una hora por videollamada, para trabajar contigo temas de tu negocio que van más allá de la app: procesos, organización del equipo o lo que necesites priorizar.${d.consultoriasHasta.trim() ? ` Las agendas cuando quieras, hasta el ${esc(d.consultoriasHasta)}.` : ""}</p></section>`
      : "";

  return `<div class="contrato">
<style>${ESTILO_CONTRATO}</style>
<div class="top"><div class="marca">Servi<span>Nomic</span> <span style="color:var(--gris);font-weight:600;font-size:10pt">· CaliDev</span></div><div class="fecha">${esc(d.ciudad || "Cali")}${fechaLarga(d.fecha) ? `, ${esc(fechaLarga(d.fecha))}` : ""}<br>Contrato de implementación y suscripción</div></div>
<div class="titulo"><p class="eyebrow">Propuesta especial${negocio ? ` · ${negocio}` : ""}</p><h1>${nombre}, esto es lo que recibes</h1><p>ServiNomic funcionando en tu negocio, con tu información, tu equipo y tus clientes, y nosotros acompañándote mientras arrancas.</p></div>
${ahorro > 0 ? `<div class="ahorro"><div class="num">${pesos(ahorro)}</div><p><b>Te ahorras ${pesos(ahorro)} en el primer año</b> frente al precio publicado en servinomic.com${piezasAhorro.length ? `: ${piezasAhorro.join(", ").replace(/, ([^,]*)$/, " y $1")}` : ""}.${extrasAhorro.length ? ` Sin contar ${extrasAhorro.join(" ni ")}.` : ""}</p></div>` : ""}
<div class="regalos">${regalos.join("")}</div>
<section><p class="eyebrow">Cómo lo pagas</p><h2>Así quedan tus pagos</h2><table><thead><tr><th>Fecha</th><th>Qué pagas</th><th class="r">Valor</th></tr></thead><tbody>${filas}</tbody></table><p class="lead" style="margin-top:8px">Sin intereses. El arranque suma ${pesos(totalCuotas || d.arranque)} en total.</p></section>
<section><p class="eyebrow">El arranque</p><h2>Dejamos ServiNomic funcionando en tu negocio</h2><p class="lead">El arranque es el trabajo de poner la app a andar con tu información real.${d.inicio.trim() ? ` Empieza el ${esc(d.inicio)}` : " Empieza al firmar"} y tiene cuatro entregas:</p>
<div class="entregas"><div class="entrega"><span class="n">1</span><h3>Diagnóstico</h3><p>Revisamos contigo cómo trabajas hoy y te entregamos por escrito qué tienes, qué te falta y cómo va a quedar.</p></div><div class="entrega"><span class="n">2</span><h3>Configuración</h3><p>Cargamos tus servicios, tarifas, equipo, clientes y tu forma de pagarle a tu gente, desde tus Excel o lo que nos entregues.</p></div><div class="entrega"><span class="n">3</span><h3>Capacitación</h3><p>Te enseñamos a usar la app a ti y a una persona más que elijas.</p></div><div class="entrega"><span class="n">4</span><h3>Primera semana</h3><p>Cierras tu primera semana completa en ServiNomic y la revisamos contigo.</p></div></div>
<div class="fin"><p><b>Cuándo termina:</b> cuando las cuatro entregas estén hechas y hayas cerrado tu primera semana en la app, o a más tardar el ${esc(d.finArranque)}, lo que pase primero. Ese día firmamos un acta de entrega corta.</p></div></section>
${consultoria}
<div class="acuerdo"><p class="eyebrow">Lo que acordamos</p><h2>Condiciones del contrato</h2><p class="lead">Lo que las dos partes nos comprometemos a cumplir.</p>
<div class="clausulas">${clausulas.map(([t, p], i) => `<div class="cl"><h3>${i + 1}. ${esc(t)}</h3><p>${p}</p></div>`).join("")}</div></div>
</div>`;
}

/** Lo que falta para poder crear el contrato; vacío si está completo. */
export function faltantesServinomic(d: DatosServinomic): string[] {
  const f: string[] = [];
  if (!d.nombre.trim()) f.push("el nombre de la clienta");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.fecha)) f.push("la fecha del contrato");
  if (!(d.arranque > 0)) f.push("el valor del arranque");
  if (!d.cuotas.length || d.cuotas.some((c) => !c.cuando.trim() || !(c.valor > 0))) f.push("las cuotas (fecha y valor)");
  const suma = d.cuotas.reduce((s, c) => s + c.valor, 0);
  if (d.cuotas.length && suma !== d.arranque) f.push(`que las cuotas sumen el arranque (suman ${pesos(suma)})`);
  if (!(d.mensualidad > 0)) f.push("la mensualidad");
  if (!d.mensualidadDesde.trim()) f.push("desde cuándo se paga la mensualidad");
  if (!d.finArranque.trim()) f.push("la fecha límite del arranque");
  if (d.permanenciaMeses > 0 && (!d.permanenciaDesde.trim() || !d.permanenciaHasta.trim())) f.push("las fechas de la permanencia");
  return f;
}
