/**
 * @file parseQueryInt.ts
 * @capa Utils (Utilidades)
 * @descripcion Parsea un parámetro de query (page, limit) y lo valida como
 *               entero positivo. Si viene vacío usa el valor por defecto; si
 *               no es un entero positivo devuelve null para que el controlador
 *               responda 400.
 */
export const parseQueryInt = (value: unknown, fallback: number): number | null => {
  if (value === undefined) {
    return fallback;
  }

  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }

  const n = Number(value);

  if (!Number.isInteger(n) || n < 1) {
    return null;
  }

  return n;
};

/**
 * Lee un parámetro de búsqueda de texto. Si no viene como string simple
 * (por ejemplo un array por query duplicada) devuelve undefined.
 */
export const parseSearch = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed === '' ? undefined : trimmed;
};
