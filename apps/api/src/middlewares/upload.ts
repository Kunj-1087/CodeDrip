import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import multer from 'multer';
import { env } from '../config/env.ts';
import { AppError } from '../utils/AppError.ts';

// Local-disk upload handling for product images (dev). The README documents the
// S3 swap path: replace this storage engine with multer-s3 and serve via CDN.
//
// SECURITY (file uploads):
//   * Only image MIME types are accepted (fileFilter).
//   * Filenames are randomized server-side — the client's filename is never
//     trusted or reflected onto disk (prevents path traversal / overwrite).
//   * Size capped at MAX_FILE_SIZE.
const uploadDir = path.resolve(process.cwd(), env.uploadDir);
fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
    const safeExt = /^\.(jpe?g|png|webp|gif|avif)$/.test(ext) ? ext : '.img';
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExt}`);
  },
});

export const uploadImages = multer({
  storage,
  limits: { fileSize: env.maxFileSize, files: 8 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) return cb(null, true);
    cb(new AppError(400, 'Only image uploads are allowed (jpeg, png, webp, gif, avif).'));
  },
});
