import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import { z } from 'zod';
import { query } from '../../config/database.ts';
import { AppError } from '../../utils/AppError.ts';
import { asyncHandler } from '../../utils/asyncHandler.ts';
import { parseOrThrow } from '../../utils/validate.ts';
import { uploadImages } from '../../middlewares/upload.ts';
import { env } from '../../config/env.ts';

const router = Router();

const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// GET /api/admin/media - List all uploaded media files
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = parseOrThrow(listSchema, req.query);
    
    const { rows: countRows } = await query<{ total: string }>('SELECT count(*) total FROM media');
    const offset = (q.page - 1) * q.limit;
    
    const { rows } = await query(
      `SELECT id, url, filename, size, mime_type AS "mimeType", created_at AS "createdAt"
       FROM media
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [q.limit, offset]
    );

    res.json({
      media: rows,
      pagination: {
        page: q.page,
        limit: q.limit,
        total: Number(countRows[0].total),
        totalPages: Math.ceil(Number(countRows[0].total) / q.limit),
      },
    });
  }),
);

// POST /api/admin/media - Upload a new file to the media library
router.post(
  '/',
  uploadImages.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw AppError.badRequest('No file uploaded');

    const fileUrl = `/uploads/${req.file.filename}`;
    
    const { rows } = await query(
      `INSERT INTO media (url, filename, size, mime_type, uploaded_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, url, filename, size, mime_type AS "mimeType", created_at AS "createdAt"`,
      [fileUrl, req.file.filename, req.file.size, req.file.mimetype, req.user!.id]
    );

    res.status(201).json({ media: rows[0] });
  }),
);

// DELETE /api/admin/media/:id - Delete a file from disk and DB
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { rows } = await query<{ filename: string }>('SELECT filename FROM media WHERE id = $1', [req.params.id]);
    if (rows.length === 0) throw AppError.notFound('Media record not found');
    
    const filename = rows[0].filename;
    
    // Try to delete from disk
    const diskPath = path.resolve(process.cwd(), env.uploadDir, filename);
    try {
      if (fs.existsSync(diskPath)) {
        fs.unlinkSync(diskPath);
      }
    } catch (err) {
      console.error(`Failed to delete file from disk: ${diskPath}`, err);
    }

    const { rowCount } = await query('DELETE FROM media WHERE id = $1', [req.params.id]);
    if (rowCount === 0) throw AppError.notFound('Media record not found');

    res.json({ success: true, message: 'Media deleted successfully' });
  }),
);

export default router;
