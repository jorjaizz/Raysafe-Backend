# Raysafe — Backend

API REST de RaySafe: sistema de denuncia y seguimiento de casos de abuso (personas y animales) en Guatemala.

Construido con **Express + TypeScript + MySQL**, sin ORM (se usa `mysql2` directamente).

## Requisitos

- Node.js 18 o superior (probado en Node 22; el proyecto no fija versión con `engines`)
- MySQL 8 (o compatible) corriendo en local
- `pnpm` (el proyecto usa `pnpm-lock.yaml`)

## Puesta en marcha

**1. Crear la base de datos**

El script `src/db/raysafe-complete.sql` crea la base `raysafe`, todas las tablas y datos de ejemplo (100 usuarios, 120 denuncias, catálogos, ubicaciones de los 22 departamentos).

```bash
mysql -u root -p < src/db/raysafe-complete.sql
```

**2. Configurar las variables de entorno**

Crea un archivo `.env` en la raíz (está en `.gitignore`, no lo subas):

```ini
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=raysafe
JWT_SECRET=una_cadena_larga_y_aleatoria
JWT_EXPIRES_IN=1h
```

`config/env.ts` valida el `.env` con zod al arrancar. Si algo falla, imprime el detalle y termina el proceso, así que un error de configuración se ve de inmediato.

**Solo 4 son obligatorias** (sin valor por defecto, el proceso no arranca):

| Variable | Regla |
|---|---|
| `DB_HOST` | No vacía |
| `DB_USER` | No vacía |
| `DB_NAME` | No vacía |
| `JWT_SECRET` | Mínimo 16 caracteres |

Las demás son opcionales y tienen valor por defecto:

| Variable | Por defecto |
|---|---|
| `PORT` | `3000` |
| `NODE_ENV` | `development` |
| `DB_PORT` | `3306` |
| `DB_PASSWORD` | *(vacío)* |
| `JWT_EXPIRES_IN` | `1h` |

> `DB_PASSWORD` cae en cadena vacía, así que si tu MySQL no tiene password puedes arrancarlo sin definirla. En cualquier otro caso, defínela.

**3. Instalar y ejecutar**

```bash
pnpm install
pnpm dev
```

El servidor queda en `http://localhost:3000`.

## Scripts

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo con recarga automática (`tsx watch`) |
| `pnpm build` | Compila TypeScript a `dist/` |
| `pnpm start` | Ejecuta la versión compilada (`dist/server.js`) |

> `pnpm start` requiere `pnpm build` antes. La carpeta `dist/` del repositorio puede estar desactualizada: úsala solo después de compilar.

## Estructura

```
src/
  app.ts                Configuración de Express (middlewares y montaje de rutas)
  server.ts             Arranca el servidor
  config/
    env.ts              Valida las variables de entorno (zod)
    database.ts         Pool de conexiones a MySQL
    uploads.ts          Configuración de multer para evidencias
  routes/               Define los endpoints y los conecta con sus controladores
  controllers/          Recibe req/res, delega en el service y responde
  services/             Lógica de negocio (no conoce HTTP ni MySQL)
  repositories/         Consultas SQL (única capa que toca la base de datos)
  schemas/              Esquemas de validación con zod
  middleware/           Autenticación, roles, validación y manejo de errores
  utils/                Utilidades (HttpError, parseo de parámetros)
  types/                Ampliación de tipos de Express
  db/                   Script SQL de esquema y datos semilla
```

El flujo de una petición es siempre de una sola dirección:

```
Ruta → [Middleware] → Controller → Service → Repository → MySQL
```

Cada capa conoce únicamente a la siguiente: el controller nunca toca MySQL, el service nunca responde HTTP y el repository solo ejecuta SQL.

## Autenticación

La API usa **JWT en cabecera `Authorization`**. No hay cookies ni sesiones.

```
Authorization: Bearer <token>
```

El token se obtiene en `POST /api/auth/login`. Hay tres roles:

| Rol | Significado |
|---|---|
| `agente` | Personal de la institución que atiende las denuncias |
| `admin` | Administración del panel |

Cada endpoint indica el acceso requerido en la tabla siguiente.

## Endpoints

Base: `http://localhost:3000/api`

### Público — ciudadano (sin login)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/abuse-types` | Tipos de abuso. Filtro opcional `?category=human\|animal` |
| `GET` | `/abuse-types/:id` | Detalle de un tipo de abuso |
| `GET` | `/locations/departments` | Los 22 departamentos |
| `GET` | `/locations/municipalities?department=X` | Municipios de un departamento |
| `GET` | `/report-statuses` | Estados del flujo de una denuncia |
| `GET` | `/help-resources` | Recursos de ayuda (líneas de emergencia, centros) |
| `GET` | `/educational-guides` | Guías y marcos legales |
| `GET` | `/stats/dashboard` | Estadísticas por departamento |
| `POST` | `/reports` | Crear una denuncia |
| `GET` | `/reports/track/:publicId` | Consultar una denuncia. Con `?token=X` devuelve el detalle completo |
| `PUT` | `/reports/track/:publicId` | Editar la denuncia mientras siga en estado `Recibida` |
| `POST` | `/reports/:publicId/evidence` | Adjuntar evidencia (multipart, requiere token) |
| `GET` | `/reports/:publicId/evidence` | Listar evidencias (requiere token) |
| `PATCH` | `/reports/:publicId/evidence/:evidenceId` | Editar la descripción (requiere token) |
| `DELETE` | `/reports/:publicId/evidence/:evidenceId` | Eliminar evidencia (requiere token) |
| `POST` | `/auth/login` | Iniciar sesión |

> **Seguimiento de denuncia:** al crearla, la API devuelve un `public_id` (`DN-XXXX-XXXX`) y un `token`. Ese token se muestra **una sola vez**: la base de datos solo guarda su hash SHA-256. Sin él, el ciudadano solo puede ver el estado y el tipo de abuso, no los datos de la denuncia.

### Requiere rol `admin`

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/abuse-types` | Crear tipo de abuso |
| `PUT` | `/abuse-types/:id` | Actualizar tipo de abuso |
| `DELETE` | `/abuse-types/:id` | Eliminar tipo de abuso |
| `GET` | `/admin/agents` | Listar agentes (paginado) |
| `GET` | `/admin/agents/:id` | Detalle de un agente |
| `POST` | `/admin/agents` | Crear agente |
| `PATCH` | `/admin/agents/:id` | Actualizar rol o estado |
| `GET` | `/admin/reports` | Bitácora de denuncias (paginado, con búsqueda) |
| `GET` | `/admin/reports/:id` | Expediente completo de una denuncia |
| `GET` | `/auth/me` | Datos del usuario autenticado (cualquier rol) |

> Los endpoints de agentes y de la bitácora filtran por institución: un admin solo ve los datos de su propia institución.

### Requiere rol `agente`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/agent/reports/unassigned` | Denuncias sin asignar (paginado) |
| `GET` | `/agent/reports/unassigned/:id` | Detalle de una denuncia sin asignar |
| `POST` | `/agent/reports/unassigned/:id/take` | Tomar una denuncia (define el nivel de riesgo) |
| `GET` | `/agent/reports` | Denuncias asignadas al agente |
| `GET` | `/agent/reports/:id` | Detalle de una denuncia asignada |
| `POST` | `/agent/reports/:id/notes` | Agregar nota interna |
| `PATCH` | `/agent/reports/:id/status` | Cambiar el estado de la denuncia |

**33 endpoints en total.** Todos los datos están filtrados por institución: un agente solo ve los casos de su institución.

## Códigos de respuesta

| Código | Cuándo |
|---|---|
| `200` | Éxito en consulta o actualización |
| `201` | Recurso creado |
| `204` | Recurso eliminado |
| `400` | Body o parámetros inválidos (incluye detalle de validación de zod) |
| `401` | Sin token, token inválido o expirado |
| `403` | Autenticado pero sin el rol requerido, o token de seguimiento incorrecto |
| `404` | Recurso no encontrado |
| `409` | Conflicto: la denuncia ya avanzó de estado, o la foreign key impide eliminar |
| `500` | Error interno del servidor |

Los errores devuelven siempre `{ "error": "mensaje" }`.

## Añadir un módulo nuevo

Para una tabla nueva `x`, crea las capas en este orden y monta la ruta:

1. `src/repositories/x.repository.ts` — las consultas SQL, siempre con placeholders `?`
2. `src/services/x.service.ts` — la lógica de negocio
3. `src/controllers/x.controller.ts` — el manejo de `req`/`res`
4. `src/routes/x.routes.ts` — las rutas
5. `src/app.ts` — `app.use('/api', xRoutes)`

Si recibe body, agrega `src/schemas/x.schema.ts` con zod y aplica `validate(xSchema)` antes del controlador.

**Reglas del patrón**

- Las rutas solo enrutan; los controllers solo manejan HTTP; los services solo lógica; los repositories solo SQL.
- Nunca escribas `pool.query` fuera de un repository.
- Nunca concatenes valores en el SQL: usa placeholders con array.
- Valida el body con zod antes de que llegue al controller.
- Las rutas que escriben datos sensibles deben llevar `authenticate` y el `require*` de rol correspondiente.

## Documentación de la API

En `docs/` hay una colección de Postman (`raysafe.postman_collection.json`) con su environment para `http://localhost:3000/api`.

> Las credenciales que trae la colección no coinciden con los datos semilla del script SQL. Actualízalas antes de usarla.

## Notas

- **No hay tests ni linter configurados.** La verificación disponible es `pnpm build` (TypeScript en modo estricto).
- Las evidencias se guardan en `uploads/evidence/` y se sirven desde `/uploads`.
- `helmet` está activo. `cors()` se usa sin restricciones y no hay límite de peticiones; es aceptable en desarrollo local, pero conviene restrictarlo antes de exponer la API.
