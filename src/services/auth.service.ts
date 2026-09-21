/**
 * @file auth.service.ts
 * @capa Service (Lógica de negocio)
 * @descripcion Lógica de autenticación: valida credenciales, compara el hash
 *               con bcrypt y firma el JWT. No conoce MySQL ni HTTP.
 *
 * Paquetes usados:
 * - bcryptjs     -> comparar la contraseña contra su hash.
 * - jsonwebtoken -> firmar y emitir el token.
 */
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import * as userRepository from '../repositories/user.repository';
import { HttpError } from '../utils/HttpError';
import { env } from '../config/env';

export interface LoginResult {
  token: string;
  user: userRepository.PublicUser;
}

export const login = async (email: string, password: string): Promise<LoginResult> => {
  const user = await userRepository.findByEmail(email);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new HttpError(401, 'Credenciales inválidas');
  }

  const token = jwt.sign(
    { sub: user.id, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] },
  );

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
};

export const getMe = (id: number) => userRepository.findById(id);