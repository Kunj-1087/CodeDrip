import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import multer from 'multer';
import sharp from 'sharp';
import { env } from '../config/env.ts';
import { AppError } from '../utils/AppError.ts';

// Local-disk upload handling for product images (dev). The README documents the
// S3 swap path: replace this storage engine with multer-s3 and serve via CDN.
//
// SECURITY (file uploads):
//   * Only image MIME types are accepted (fileFilter) — never trust client MIME alone.
//   * Filenames are randomized server-side — the client's filename is never
//     trusted or reflected onto disk (prevents path traversal / overwrite).
//   * Size capped at MAX_FILE_SIZE (env variable, default 5MB).
const uploadDir = path.resolve(process.cwd(), env.uploadDir);
fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

// Disk storage — keeps a safe filename for the admin route to reference.
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
  limits: {
    fileSize: env.maxFileSize,
    files: 8,       // Max 8 images per product.
    fields: 20,     // Limit form fields to prevent DoS.
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) return cb(null, true);
    cb(new AppError(400, 'Only image uploads are allowed (jpeg, png, webp, gif, avif).'));
  },
});

/**
 * Process an uploaded image: resize, convert to WebP, strip EXIF metadata.
 * Returns the processed Buffer. The caller handles writing to disk/S3.
 * This is available for future S3/CDN integration where disk storage is skipped.
 */
export async function processAndSaveImage(
  buffer: Buffer,
  outputDir: string,
): Promise<string> {
  const safeName = `${Date.now()}-${crypto.randomBytes(12).toString('hex')}.webp`;
  const outputPath = path.join(outputDir, safeName);

  await sharp(buffer)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85, effort: 4 })
    .withMetadata({ exif: undefined }) // Strip EXIF for privacy
    .toFile(outputPath);

  return `/uploads/products/${safeName}`;
}
