# calidev

El CLI del CRM de calidev.dev. Habla con la misma API que la interfaz (`/api/crm/v1`) y todo lo que escribe queda auditado con origen `cli`.

## Instalar

Necesita Node 22.18 o superior (corre el TypeScript directo, sin compilar).

```sh
cd cli && npm link
calidev login          # pega la clave cdv_… creada en /crm/ajustes
calidev hoy
```

`npm link` deja `calidev` como enlace al repo: un `git pull` lo actualiza. No lo instales copiando la carpeta dentro de `node_modules`, porque Node no quita los tipos de los archivos que están ahí.

## Para agentes

- `--json` en cualquier comando. Los errores salen por stdout con la forma `{"error":{"codigo","mensaje","campo"}}`.
- Códigos de salida: 0 ok · 1 otro error · 2 uso · 3 sin permiso · 4 quedó pendiente de aprobación.
- `--idempotency-key <k>` en las escrituras evita duplicar al reintentar.
- `CALIDEV_URL`, `CALIDEV_CLAVE` y `CALIDEV_CONFIG` reemplazan la configuración guardada en `~/.config/calidev/config.json`.

`calidev ayuda` lista los comandos y `calidev api` lista los endpoints.
