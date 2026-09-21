# Raysafe Backend

API REST para Raysafe, construida con **Express + TypeScript + MySQL** (sin ORM, usando `mysql2` directamente).

## Requisitos

- Node.js 18+
- MySQL 8 (o compatible) corriendo de forma local
- `pnpm` (gestor de paquetes del proyecto)

## Puesta en marcha

1. **Crear la base de datos.** Ejecuta el script `src/db/raysafe-complete.sql` en tu MySQL: crea la BD `raysafe`, sus tablas y los datos de ejemplo.

2. **Configurar el `.env`.** Copia `.env.example` a `.env` y ajusta las credenciales de tu MySQL:

   ```
   PORT=3000
   NODE_ENV=development
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=tu_password
   DB_NAME=raysafe
   ```

3. **Instalar dependencias y correr:**

   ```
   pnpm install
   pnpm dev
   ```

   El servidor queda en `http://localhost:3000`.

## Estructura del proyecto

```
src/
  app.ts                Configuración de Express (middlewares y montaje de rutas)
  server.ts             Arranca el servidor
  config/
    env.ts              Valida las variables de entorno (zod)
    database.ts         Pool de conexiones a MySQL (mysql2)
  routes/               Define los endpoints y los conecta con sus controladores
  controllers/          Recibe req/res, delega en el service y responde
  services/             Lógica de negocio (no conoce HTTP ni MySQL)
  repositories/         Consultas SQL contra MySQL (única capa que toca la BD)
  schemas/              Esquemas de validación con zod
  middleware/           Funciones entre la petición y el controlador
  db/                   Scripts SQL
```

El flujo de una petición es siempre de una sola vía:

```
Ruta (routes) → [Middleware de validación] → Controller → Service → Repository → MySQL
```

Cada capa importa solo a la inmediata: el controller nunca toca MySQL ni el service, el service nunca responde HTTP y el repository solo ejecuta SQL.

## Endpoints

| Método | Ruta                   | Descripción                          |
|--------|------------------------|--------------------------------------|
| GET    | `/api/abuse-types`     | Lista todos los tipos de abuso       |
| GET    | `/api/abuse-types/:id` | Obtiene un tipo de abuso por su id   |
| POST   | `/api/abuse-types`     | Crea un tipo de abuso                |
| PUT    | `/api/abuse-types/:id` | Actualiza un tipo de abuso completo  |
| DELETE | `/api/abuse-types/:id` | Elimina un tipo de abuso             |

### Ejemplo de body para POST / PUT

```json
{
  "category": "human",
  "name": "Nuevo tipo de abuso",
  "description": "Descripción opcional"
}
```

`category` solo acepta `human` o `animal` (lo valida zod y coincide con el `ENUM` de la tabla).

### Códigos de respuesta

- `200` éxito (GET, PUT)
- `201` creado (POST)
- `204` eliminado sin contenido (DELETE)
- `400` body inválido (con `details` de los errores de zod)
- `404` recurso no encontrado (`{ "error": "..." }`)
- `409` conflicto: no se puede eliminar porque el registro está asociado a otros (violación de foreign key)
- `500` error interno (`{ "error": "Error interno del servidor" }`)

---

## Endpoints del proyecto (fuera del CRUD inicial)

Módulos construidos sobre el CRUD base, agrupados por área. Todos viven en `src/routes/` y están montados en `/api`.

### Autenticación

#### `POST /api/auth/login`
Inicia sesión con email y contraseña. Devuelve el **JWT** y los datos públicos del usuario. Usa el mismo 401 para email inexistente y contraseña incorrecta (evita enumerar usuarios).

Body:
```json
{
  "email": "operator@raysafe.gt",
  "password": "1234"
}
```
Respuesta `200`:
```json
{
  "token": "eyJhbGciOi...",
  "user": {
    "id": 2,
    "name": "Operador RaySafe",
    "email": "operator@raysafe.gt",
    "role": "operator"
  }
}
```
Errores: `400` body inválido · `401` credenciales inválidas.

#### `GET /api/auth/me`
Datos del usuario autenticado. Requiere cabecera `Authorization: Bearer <token>` (obtenido en login).

Respuesta `200`: `{ "id": 2, "name": "...", "email": "...", "role": "operator" }`.
Errores: `401` sin token o token inválido · `404` usuario no existe/desactivado.

### Catálogos (públicos, alimentan formularios del frontend)

#### `GET /api/abuse-types?category=human|animal`
Tipos de abuso disponibles para denunciar. `category` es opcional (`human` o `animal`); si se pasa otro valor responde `400`.

Respuesta `200`:
```json
[
  { "id": 1, "category": "human", "name": "Violencia física", "description": "Agresión que causa daño corporal a una persona." },
  { "id": 16, "category": "animal", "name": "Maltrato físico", "description": "Golpes, heridas u otras lesiones infligidas a un animal." }
]
```

#### `GET /api/locations/departments`
Lista los **22 departamentos** de Guatemala.

Respuesta `200`:
```json
["Alta Verapaz", "Baja Verapaz", "Chimaltenango", "Chiquimula", "..."]
```

#### `GET /api/locations/municipalities?department=X`
Municipios de un departamento. `department` es obligatorio (si falta, responde `400`).

Respuesta `200` (ej. `?department=Guatemala`):
```json
[
  { "id": 1, "city": "Ciudad de Guatemala", "department": "Guatemala" },
  { "id": 2, "city": "Mixco", "department": "Guatemala" }
]
```

#### `GET /api/educational-guides`
Guías educativas (leyes y material de prevención). Sin autenticación, devuelve todas.

Respuesta `200`:
```json
[
  {
    "id": 1,
    "title": "Ley para Prevenir, Sancionar y Erradicar la Violencia Intrafamiliar (Decreto 97-96)",
    "description": "Marco legal guatemalteco que define la violencia intrafamiliar y establece medidas de protección para las víctimas.",
    "category": "prevención - humano",
    "pdf_file_url": "https://siteal.iiep.unesco.org/sites/default/files/sit_accion_files/decreto_97-1996.pdf"
  }
]
```

#### `GET /api/help-resources`
Recursos de ayuda **activos** (líneas de emergencia, centros de apoyo, albergues). Incluye la ubicación legible mediante JOIN con `locations`. `abuse_type_id: null` significa que aplica a todos los tipos.

Respuesta `200`:
```json
[
  {
    "id": 5,
    "name": "Centro de Apoyo Integral a la Mujer (CAIMU)",
    "type": "support_center",
    "abuse_type_id": 13,
    "location_id": 1,
    "address": "Zona 1, Ciudad de Guatemala",
    "phone": "36307574",
    "schedule": "Lunes a viernes 8:00-16:00",
    "city": "Cobán",
    "department": "Alta Verapaz"
  }
]
```
`type` acepta `emergency_line` | `support_center` | `shelter`.

### Denuncias (público ciudadano, sin login)

#### `POST /api/reports`
Crea una denuncia anónima. El backend asigna el `public_id` (`DN-XXXX-XXXX`), el estado inicial `Recibida`, la institución según la categoría del abuso (human → MP, animal → UBA) y genera un **token que se muestra una sola vez**: es la llave del ciudadano para seguir/modificar su denuncia.

Body:
```json
{
  "abuse_type_id": 1,
  "description": "Mi vecino agrede físicamente a su pareja todas las noches.",
  "specific_address": "Colonia El Milagro, lote 12",
  "location_id": 1,
  "notification_email": "test@example.com"
}
```
`abuse_type_id` y `description` son obligatorios; `specific_address` (≤250), `location_id` y `notification_email` opcionales.

Respuesta `201`:
```json
{
  "id": 122,
  "public_id": "DN-1683-6659",
  "token": "38c1527b6f11a4d3e9f0c2b5a8d7e6f19c0b3a2d4e5f60718",
  "abuse_type_id": 1,
  "report_status_id": 1,
  "institution_id": 1,
  "description": "Mi vecino agrede físicamente a su pareja todas las noches.",
  "specific_address": "Colonia El Milagro, lote 12",
  "location_id": 1,
  "risk_level": null,
  "notification_email": "test@example.com",
  "created_at": "2026-09-21T07:37:05.000Z"
}
```
Errores: `400` body inválido o tipo de abuso inexistente · `500` si no se encuentra institución/estado.

> **Importante:** el `token` solo se devuelve aquí. La BD guarda únicamente su hash (SHA-256) en `token_hash`.

#### `GET /api/reports/track/:publicId`
Consulta el estado de una denuncia sin revelar datos sensibles.

- **Sin token:** vista básica (solo estado y tipo).
- **Con `?token=<valor>` válido:** vista explícita con todos los datos.

Ejemplo `GET /api/reports/track/DN-1683-6659` → `200`:
```json
{
  "public_id": "DN-1683-6659",
  "status_name": "Recibida",
  "abuse_type_name": "Violencia física",
  "abuse_type_category": "human",
  "created_at": "2026-09-21T07:37:05.000Z",
  "updated_at": "2026-09-21T07:37:05.000Z"
}
```
Con token válido agrega: `report_status_id, abuse_type_id, institution_id, institution_name, description, specific_address, location_id, city, department, notification_email`.

Errores: `400` formato de `public_id` incorrecto · `403` token inválido · `404` denuncia no encontrada.

#### `PUT /api/reports/track/:publicId`
Permite al ciudadano corregir su denuncia **mientras el estado sea `Recibida`**. Requiere token y al menos un campo a modificar. Si la denuncia ya avanzó a otro estado responde `409`.

Body:
```json
{
  "token": "38c1527b6f11a4d3e9f0c2b5a8d7e6f19c0b3a2d4e5f60718",
  "description": "Descripción corregida tras aportar más detalles.",
  "specific_address": "Colonia El Milagro, lote 12, casa 3"
}
```
Campos editables: `description`, `specific_address`, `location_id`, `notification_email` (los opcionales aceptan `null` para limpiarlos).

Respuesta `200`: la denuncia actualizada con la **vista explícita** (igual que el GET con token).
Errores: `400` sin token o sin campos editables · `403` token inválido · `404` denuncia no encontrada · `409` estado distinto de `Recibida`.

### Estadísticas (público)

#### `GET /api/stats/dashboard`
Dashboard de abuso: total nacional, total de departamentos y, por cada departamento, su total y el desglose por categoría amplia (con porcentaje para barras de progreso). Los departamentos sin denuncias aparecen con total `0` y desglose vacío. El desglose solo incluye categorías con al menos una denuncia.

Categorías calculadas por mapping de `abuse_type_id`: `VIOLENCIA GÉNERO/FAMILIAR`, `ABUSO SEXUAL`, `ABUSO INFANTIL`, `TRATA Y EXPLOTACIÓN`, `ADULTO MAYOR/DISCRIMINACIÓN`, `ABUSO ANIMAL`.

Respuesta `200`:
```json
{
  "total_denuncias_nacional": 121,
  "total_departamentos": 22,
  "departamentos": [
    {
      "departamento_id": "Alta Verapaz",
      "nombre_departamento": "Alta Verapaz",
      "total_denuncias": 4,
      "desglose_por_categoria": [
        { "categoria": "ABUSO ANIMAL", "cantidad": 3, "porcentaje": 75 },
        { "categoria": "TRATA Y EXPLOTACIÓN", "cantidad": 1, "porcentaje": 25 }
      ]
    }
  ]
}
```

---

## Cómo crear un endpoint nuevo

Usa el módulo `abuse_types` como referencia. Para una nueva tabla `X`, crea 4 archivos y monta la ruta:

1. `src/repositories/x.repository.ts` → consultas SQL
2. `src/services/x.service.ts` → lógica de negocio
3. `src/controllers/x.controller.ts` → manejo de HTTP
4. `src/routes/x.routes.ts` → rutas
5. Montar en `src/app.ts`

Y, si hace falta, un esquema en `src/schemas/x.schema.ts` para validar el body con zod.

### 1. Repository — `src/repositories/x.repository.ts`

Aquí vive la pura consulta SQL. No recibe `req` ni `res`. Toda consulta con datos del usuario usa placeholders `?` para evitar inyección SQL.

```ts
import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';

export const getAllX = async (): Promise<X[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM x ORDER BY id',
  );
  return rows as X[];
};

export const getXById = async (id: number): Promise<X | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM x WHERE id = ?', [id],
  );
  return (rows[0] as X) ?? null;
};
```

Para escritura usa `ResultSetHeader` como tipo de resultado:

```ts
import type { ResultSetHeader } from 'mysql2/promise';

export const insertX = async (data: X) => {
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO x (name) VALUES (?)', [data.name],
  );
  return { id: result.insertId, ...data };
};

export const updateX = async (id: number, data: X): Promise<boolean> => {
  const [result] = await pool.query<ResultSetHeader>(
    'UPDATE x SET name = ? WHERE id = ?', [data.name, id],
  );
  return result.affectedRows > 0;
};

export const removeX = async (id: number): Promise<boolean> => {
  const [result] = await pool.query<ResultSetHeader>(
    'DELETE FROM x WHERE id = ?', [id],
  );
  return result.affectedRows > 0;
};
```

### 2. Service — `src/services/x.service.ts`

Solo lógica de negocio, sin SQL: delega en el repository.

```ts
import * as xRepository from '../repositories/x.repository';

export const getAllX = () => xRepository.getAllX();
export const getXById = (id: number) => xRepository.getXById(id);
export const createX = (data: xRepository.X) => xRepository.insertX(data);
export const updateX = (id: number, data: xRepository.X) => xRepository.updateX(id, data);
export const deleteX = (id: number) => xRepository.removeX(id);
```

### 3. Controller — `src/controllers/x.controller.ts`

Traduce HTTP: recibe `req/res`, llama al service y responde con el código correcto.

```ts
import type { Request, Response } from 'express';
import * as xService from '../services/x.service';

export const getXs = async (_req: Request, res: Response) => {
  try {
    const xs = await xService.getAllX();
    return res.status(200).json(xs);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
```

- `req.params` para `:id` (ej. `Number(req.params.id)`)
- `req.body` para el contenido de POST/PUT (ya validado por zod)
- Responde `404` si el recurso no existe, `201` en creación

### 4. Rutas — `src/routes/x.routes.ts`

Mapea el verbo HTTP con la ruta y el controlador. Para validar el body, agrega el middleware `validate` con un esquema de zod antes del controlador:

```ts
import { Router } from 'express';
import { getXs, getX, postX, putX, deleteX } from '../controllers/x.controller';
import { validate } from '../middleware/validate.middleware';
import { xSchema } from '../schemas/x.schema';

const router = Router();

router.get('/xs', getXs);
router.get('/xs/:id', getX);
router.post('/xs', validate(xSchema), postX);
router.put('/xs/:id', validate(xSchema), putX);
router.delete('/xs/:id', deleteX);

export default router;
```

### 5. Montar la ruta — `src/app.ts`

```ts
import xRoutes from './routes/x.routes';
// ...
app.use('/api', xRoutes);
```

### 6. Validación — `src/schemas/x.schema.ts`

Define el esquema con zod; el middleware `validate` lo aplica a cada POST/PUT:

```ts
import { z } from 'zod';

export const xSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
});
```

### Reglas de oro del patrón

- `routes` solo enruta; `controllers` solo responden HTTP; `services` solo lógica de negocio; `repositories` solo tocan MySQL.
- Nunca hagas `pool.query` dentro de un controller ni de un service: pásalo al repository.
- Siempre usa placeholders `?` con array de valores en las consultas (nada de concatenar strings).
- Valida el body con zod antes de llegar al controller.
- Los middlewares van entre la ruta y el controlador (`validate`) o como manejo global de errores.