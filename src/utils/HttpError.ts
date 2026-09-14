/**
 * @file HttpError.ts
 * @capa Utils (Utilidades)
 * @descripcion Error de dominio con un código de estado HTTP asociado.
 *               Los controladores lo detectan para responder con el status
 *               correspondiente en vez de un 500 genérico.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}