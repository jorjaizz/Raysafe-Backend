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