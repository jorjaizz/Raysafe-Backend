/**
 * @file uploads.ts
 * @capa Config (Configuración)
 * @descripcion Configuración de multer para guardar evidencias en disco
 *               (carpeta uploads/evidence/) y servirlas por /uploads.
 *
 * Paquetes usados:
 * - multer -> recibe multipart/form-data y guarda el archivo en el servidor.
 */
import { mkdirSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import multer from 'multer';

export const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const EVIDENCE_DIR = path.join(UPLOADS_DIR, 'evidence');

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILE_COUNT = 1;

// Extensiones permitidas por mimetype (evita depender del nombre original).
const extensionByMimetype: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'audio/mpeg': '.mp3',
  'audio/ogg': '.ogg',
  'audio/wav': '.wav',
  'application/pdf': '.pdf',
  'text/plain': '.txt',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};

mkdirSync(EVIDENCE_DIR, { recursive: true });

const isTypeAllowed = (mimetype: string): boolean =>
  Object.prototype.hasOwnProperty.call(extensionByMimetype, mimetype);

export const fileTypeFromMimetype = (mimetype: string): string => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  return 'document';
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, EVIDENCE_DIR),
  filename: (_req, file, cb) => {
    // Nombre aleatorio: nunca usamos el nombre original (evita path traversal).
    const ext = extensionByMimetype[file.mimetype] ?? '.bin';
    cb(null, `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`);
  },
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (!isTypeAllowed(file.mimetype)) {
    return cb(new Error('Tipo de archivo no permitido (imagen, video, audio o documento)'));
  }

  return cb(null, true);
};

export const uploadEvidence = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILE_COUNT,
  },
  fileFilter,
});

export const fileUrlFor = (filename: string): string => `/uploads/evidence/${filename}`;

export const removeStoredFile = async (filename: string): Promise<void> => {
  await unlink(path.join(EVIDENCE_DIR, filename));
};