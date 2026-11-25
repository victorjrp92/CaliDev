import type { Permiso } from "./permisos";

/**
 * La lista de endpoints de /api/crm/v1 (spec §7): la devuelve `GET /api/crm/v1`
 * y la imprime `calidev api`, para que un agente no tenga que adivinar rutas.
 * `endpoints.test.ts` comprueba que cada entrada tiene su route.ts y que cada
 * route.ts exporta los métodos que aquí se declaran: la lista no puede mentir.
 *
 * `permiso`: "publico" no pide sesión; "sesion" pide estar autenticado sin un
 * permiso concreto.
 */
export type Endpoint = {
  metodo: "GET" | "POST" | "PATCH" | "DELETE";
  ruta: string;
  permiso: Permiso | "publico" | "sesion";
  hace: string;
  cuerpo?: string;
};

export const ENDPOINTS: Endpoint[] = [
  { metodo: "GET", ruta: "/api/crm/v1", permiso: "sesion", hace: "Esta lista" },
  { metodo: "POST", ruta: "/api/crm/v1/sesion", permiso: "publico", hace: "Entrar con correo y contraseña (pone la cookie)", cuerpo: "{correo, contrasena}" },
  { metodo: "DELETE", ruta: "/api/crm/v1/sesion", permiso: "publico", hace: "Salir (borra la cookie)" },
  { metodo: "POST", ruta: "/api/crm/v1/invitacion", permiso: "publico", hace: "Aceptar una invitación eligiendo contraseña", cuerpo: "{token, contrasena}" },
  { metodo: "GET", ruta: "/api/crm/v1/yo", permiso: "sesion", hace: "Quién soy, por dónde entré y qué permisos tengo" },
  { metodo: "GET", ruta: "/api/crm/v1/hoy", permiso: "sesion", hace: "Citas del día, tareas, oportunidades vencidas, aprobaciones, embudo y, con finanzas:leer, MRR, meta, mora y cobros que vencen (?dia=AAAA-MM-DD)" },

  { metodo: "GET", ruta: "/api/crm/v1/personas", permiso: "contactos:leer", hace: "Buscar personas (?q=texto&limite=)" },
  { metodo: "POST", ruta: "/api/crm/v1/personas", permiso: "contactos:escribir", hace: "Crear persona", cuerpo: "{nombre, correo?, whatsapp?, usuario_ig?, empresa?, origen?, notas?}" },
  { metodo: "GET", ruta: "/api/crm/v1/personas/[id]", permiso: "contactos:leer", hace: "Persona con línea de tiempo, oportunidades y notas" },
  { metodo: "PATCH", ruta: "/api/crm/v1/personas/[id]", permiso: "contactos:escribir", hace: "Editar persona", cuerpo: "{nombre?, correo?, whatsapp?, usuario_ig?, empresa?, notas?}" },

  { metodo: "GET", ruta: "/api/crm/v1/oportunidades", permiso: "ventas:leer", hace: "Pipeline (?etapa=&abiertas=1&persona_id=&vencidas=1)" },
  { metodo: "POST", ruta: "/api/crm/v1/oportunidades", permiso: "ventas:escribir", hace: "Crear oportunidad (próximo paso con fecha obligatorio si queda abierta)", cuerpo: "{titulo, persona_id?, etapa?, proximo_paso, proximo_paso_at, valor_arranque?, valor_mensual?, moneda?}" },
  { metodo: "GET", ruta: "/api/crm/v1/oportunidades/[id]", permiso: "ventas:leer", hace: "Oportunidad con historial de etapas y notas" },
  { metodo: "PATCH", ruta: "/api/crm/v1/oportunidades/[id]", permiso: "ventas:escribir", hace: "Editar datos o fijar el próximo paso", cuerpo: "{titulo?, valor_arranque?, valor_mensual?, moneda?, responsable_id?, proximo_paso?, proximo_paso_at?}" },
  { metodo: "POST", ruta: "/api/crm/v1/oportunidades/[id]/etapa", permiso: "ventas:escribir", hace: "Mover de etapa (ganado exige oportunidad:ganar)", cuerpo: "{a, proximo_paso?, proximo_paso_at?, motivo_perdida?}" },

  { metodo: "GET", ruta: "/api/crm/v1/tareas", permiso: "tareas:leer", hace: "Tareas (?mia=1&area=&estado=abierta)" },
  { metodo: "POST", ruta: "/api/crm/v1/tareas", permiso: "tareas:escribir", hace: "Crear tarea", cuerpo: "{titulo, area?, entidad?, entidad_id?, asignada_a?, vence_at?}" },
  { metodo: "PATCH", ruta: "/api/crm/v1/tareas/[id]", permiso: "tareas:escribir", hace: "Tomar o cerrar una tarea", cuerpo: "{accion: tomar|hecha|cancelada}" },

  { metodo: "GET", ruta: "/api/crm/v1/notas", permiso: "notas:leer", hace: "Notas de una entidad (?entidad=persona&id=7)" },
  { metodo: "POST", ruta: "/api/crm/v1/notas", permiso: "notas:escribir", hace: "Agregar nota o brief", cuerpo: "{entidad, entidad_id, tipo?: nota|brief|resumen_llamada, cuerpo}" },
  { metodo: "POST", ruta: "/api/crm/v1/agentes/resumen", permiso: "notas:escribir", hace: "Notas crudas de una llamada → nota resumen_llamada; la etapa y el próximo paso propuestos esperan en Aprobaciones", cuerpo: "{oportunidad_id? | cita_id?, notas}" },

  { metodo: "GET", ruta: "/api/crm/v1/contratos", permiso: "contratos:leer", hace: "Contratos con sus firmantes (?estado=esperando|firmado&oportunidad_id=&persona_id=)" },
  { metodo: "POST", ruta: "/api/crm/v1/contratos", permiso: "contratos:escribir", hace: "Crear contrato con la plantilla de ServiNomic o con texto propio", cuerpo: "{plantilla?: servinomic|libre, datos?, titulo?, html?, firmantes?, oportunidad_id?, persona_id?, empresa_id?}" },
  { metodo: "GET", ruta: "/api/crm/v1/contratos/borrador", permiso: "contratos:leer", hace: "Datos de la plantilla ya llenos desde una oportunidad (?oportunidad_id=). No crea nada" },
  { metodo: "GET", ruta: "/api/crm/v1/contratos/[id]", permiso: "contratos:leer", hace: "Contrato con firmantes y envíos (el enlace de firma solo con contrato:enviar)" },
  { metodo: "DELETE", ruta: "/api/crm/v1/contratos/[id]", permiso: "contratos:escribir", hace: "Borrar un contrato que nadie ha firmado" },
  { metodo: "POST", ruta: "/api/crm/v1/contratos/[id]/enviar", permiso: "contratos:leer", hace: "Mandar o reenviar el enlace de firma: 200 si sale ya; 202 {aprobacion} si lo pide un agente", cuerpo: "{firmante_id?, correo?}" },

  { metodo: "GET", ruta: "/api/crm/v1/citas", permiso: "agenda:leer", hace: "Citas de un día (?dia=) o de la semana (?semana=1), y las invitaciones sin hora" },

  { metodo: "GET", ruta: "/api/crm/v1/productos", permiso: "finanzas:leer", hace: "Catálogo con precios vigentes (?todos=1 incluye inactivos)" },
  { metodo: "POST", ruta: "/api/crm/v1/productos", permiso: "finanzas:escribir", hace: "Crear producto", cuerpo: "{nombre, descripcion?}" },
  { metodo: "GET", ruta: "/api/crm/v1/productos/[id]", permiso: "finanzas:leer", hace: "Producto con historial de precios" },
  { metodo: "PATCH", ruta: "/api/crm/v1/productos/[id]", permiso: "finanzas:escribir", hace: "Editar o desactivar producto", cuerpo: "{nombre?, descripcion?, activo?}" },
  { metodo: "POST", ruta: "/api/crm/v1/productos/[id]/precios", permiso: "precio:fijar", hace: "Nuevo precio de un concepto (cierra el vigente)", cuerpo: "{concepto: arranque|mensualidad|persona_adicional, valor, moneda?, incluye?}" },
  { metodo: "GET", ruta: "/api/crm/v1/promos", permiso: "finanzas:leer", hace: "Promociones (?vigentes=1)" },
  { metodo: "POST", ruta: "/api/crm/v1/promos", permiso: "precio:fijar", hace: "Crear promoción", cuerpo: "{codigo, descripcion?, concepto?, porcentaje | valor, producto_id?, vigente_hasta?}" },

  { metodo: "GET", ruta: "/api/crm/v1/suscripciones", permiso: "finanzas:leer", hace: "Suscripciones (?estado=activa|pausada|cancelada&empresa_id=)" },
  { metodo: "POST", ruta: "/api/crm/v1/suscripciones", permiso: "finanzas:escribir", hace: "Crear suscripción", cuerpo: "{empresa_id, producto_id, valor_mensual, valor_arranque?, moneda?, persona_id?, oportunidad_id?, contrato_id?, personas?, permanencia_hasta?, inicio?}" },
  { metodo: "GET", ruta: "/api/crm/v1/suscripciones/[id]", permiso: "finanzas:leer", hace: "Una suscripción" },
  { metodo: "PATCH", ruta: "/api/crm/v1/suscripciones/[id]", permiso: "finanzas:escribir", hace: "Estado, personas o permanencia; valores o moneda piden precio:fijar", cuerpo: "{estado?, personas?, permanencia_hasta?, valor_mensual?, valor_arranque?, moneda?}" },

  { metodo: "GET", ruta: "/api/crm/v1/cobros", permiso: "finanzas:leer", hace: "Cobros (?estado=pendiente|pagado|anulado&mora=1&empresa_id=&suscripcion_id=&limite=)" },
  { metodo: "POST", ruta: "/api/crm/v1/cobros", permiso: "cobros:borrador", hace: "Crear cobro con la tasa del día: 201 si queda creado; 202 {aprobacion} si lo pide un agente", cuerpo: "{empresa_id, valor, vence_at, concepto?: arranque|cuota|mensualidad|otro, moneda?, metodo?: transferencia|stripe|efectivo, persona_id?, suscripcion_id?, descripcion?, tasa_eur?, tasa_usd?}" },
  { metodo: "GET", ruta: "/api/crm/v1/cobros/[id]", permiso: "finanzas:leer", hace: "Un cobro" },
  { metodo: "PATCH", ruta: "/api/crm/v1/cobros/[id]", permiso: "finanzas:escribir", hace: "Marcar pagado (toma la tasa del día del pago) o anular", cuerpo: "{accion: pagado|anulado, metodo?, pagado_at?, tasa_eur?, tasa_usd?, motivo?}" },

  { metodo: "GET", ruta: "/api/crm/v1/gastos", permiso: "finanzas:leer", hace: "Gastos (?desde=&hasta=&empresa_id=)" },
  { metodo: "POST", ruta: "/api/crm/v1/gastos", permiso: "finanzas:escribir", hace: "Registrar gasto con la tasa de su día", cuerpo: "{proveedor, concepto, valor, moneda?, fecha?, empresa_id?, recurrente?, tasa_eur?, tasa_usd?}" },
  { metodo: "DELETE", ruta: "/api/crm/v1/gastos/[id]", permiso: "finanzas:escribir", hace: "Borrar gasto" },

  { metodo: "POST", ruta: "/api/crm/v1/clientes", permiso: "cobros:crear", hace: "Alta de cliente en un paso: empresa, contacto, suscripción y cobros", cuerpo: "{empresa, nit?, contacto: {nombre, correo?, whatsapp?}, producto_id?, valor_mensual?, valor_arranque?, promo?, moneda?, personas?, permanencia_hasta?, inicio?, cobros?: [{valor, vence, concepto?, metodo?, descripcion?}]}" },
  { metodo: "GET", ruta: "/api/crm/v1/finanzas", permiso: "finanzas:leer", hace: "Resumen del mes: MRR, ingresos, por cobrar, mora, gastos, margen por empresa y meta (?mes=AAAA-MM)" },
  { metodo: "GET", ruta: "/api/crm/v1/finanzas/exportar", permiso: "finanzas:leer", hace: "CSV del mes para el contador (?mes=AAAA-MM)" },

  { metodo: "GET", ruta: "/api/crm/v1/aprobaciones", permiso: "aprobaciones:leer", hace: "Cola de aprobaciones (?estado=pendiente|aprobada|rechazada|ejecutada|fallida|todas)" },
  { metodo: "POST", ruta: "/api/crm/v1/aprobaciones", permiso: "aprobaciones:solicitar", hace: "Pedir una acción externa: responde 202 {aprobacion_id}", cuerpo: "{tipo, payload, vista_previa, entidad?, entidad_id?}" },
  { metodo: "GET", ruta: "/api/crm/v1/aprobaciones/[id]", permiso: "aprobaciones:leer", hace: "Una aprobación" },
  { metodo: "POST", ruta: "/api/crm/v1/aprobaciones/[id]/decision", permiso: "aprobaciones:decidir", hace: "Aprobar (opcionalmente con payload editado) o rechazar con motivo. Solo humanos", cuerpo: "{decision: aprobar|rechazar, motivo?, payload?}" },

  { metodo: "GET", ruta: "/api/crm/v1/auditoria", permiso: "auditoria:leer", hace: "Registro de auditoría (?entidad=&id=&limite=)" },

  { metodo: "GET", ruta: "/api/crm/v1/usuarios", permiso: "usuarios:gestionar", hace: "Usuarios humanos y agentes" },
  { metodo: "POST", ruta: "/api/crm/v1/usuarios", permiso: "usuarios:gestionar", hace: "Crear usuario; un humano recibe enlace de invitación", cuerpo: "{nombre, correo, tipo: humano|agente, rol}" },
  { metodo: "PATCH", ruta: "/api/crm/v1/usuarios/[id]", permiso: "usuarios:gestionar", hace: "Activar/desactivar, reinvitar o cerrar sesiones", cuerpo: "{activo?, reinvitar?, cerrar_sesiones?}" },
  { metodo: "GET", ruta: "/api/crm/v1/claves", permiso: "claves:propias", hace: "Mis claves (todas si tengo claves:gestionar)" },
  { metodo: "POST", ruta: "/api/crm/v1/claves", permiso: "claves:propias", hace: "Crear clave cdv_… (se muestra una sola vez)", cuerpo: "{nombre, usuario_id?, alcances?, dias_vigencia?}" },
  { metodo: "DELETE", ruta: "/api/crm/v1/claves/[id]", permiso: "claves:propias", hace: "Revocar clave" },
  { metodo: "POST", ruta: "/api/crm/v1/sincronizar", permiso: "sistema:sincronizar", hace: "Traer al CRM leads, citas, contactos e Instagram (idempotente)" },
];
