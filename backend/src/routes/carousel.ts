import fs from 'node:fs';
import path from 'node:path';
import { Request, Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { carouselUpload } from '../middleware/upload.js';

const router = Router();

const slideSchema = z.object({
  title: z.string().max(120).nullable().optional(),
  subtitle: z.string().max(220).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  active: z.boolean(),
  sortOrder: z.number().int().nonnegative()
});

const moveSlideSchema = z.object({
  direction: z.enum(['up', 'down'])
});

function parseBoolean(value: unknown) {
  return value === true || value === 'true' || value === '1' || value === 'on';
}

function parseNullableString(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function buildUploadedFileUrl(req: Request, file: Express.Multer.File) {
  const host = req.get('host') ?? 'localhost:4000';
  return `${req.protocol}://${host}/uploads/carousel/${file.filename}`;
}

function deleteLocalImageIfNeeded(imageUrl: string | null | undefined) {
  if (!imageUrl) return;

  const marker = '/uploads/carousel/';
  const index = imageUrl.indexOf(marker);

  if (index === -1) return;

  const fileName = imageUrl.slice(index + marker.length);
  const filePath = path.resolve('uploads/carousel', fileName);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

function parseSlidePayload(req: Request) {
  return {
    title: parseNullableString(req.body.title),
    subtitle: parseNullableString(req.body.subtitle),
    imageMode: String(req.body.imageMode ?? 'url').trim(),
    imageUrl: parseNullableString(req.body.imageUrl),
    active: parseBoolean(req.body.active),
    sortOrder: Number(req.body.sortOrder ?? 0),
    removeImage: parseBoolean(req.body.removeImage)
  };
}

/**
 * Público: slides activos para home
 */
router.get('/', async (_req, res) => {
  const slides = await prisma.homeCarouselSlide.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
  });

  res.json(slides);
});

/**
 * Admin
 */
router.use('/admin', authenticate, requireAdmin);

router.get('/admin', async (_req, res) => {
  const slides = await prisma.homeCarouselSlide.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
  });

  res.json(slides);
});

router.post('/admin', carouselUpload.single('imageFile'), async (req, res) => {
  const raw = parseSlidePayload(req);

  const finalImageUrl =
    raw.imageMode === 'file' && req.file
      ? buildUploadedFileUrl(req, req.file)
      : raw.imageMode === 'url'
        ? raw.imageUrl
        : null;

  const parsed = slideSchema.safeParse({
    title: raw.title,
    subtitle: raw.subtitle,
    imageUrl: finalImageUrl,
    active: raw.active,
    sortOrder: raw.sortOrder
  });

  if (!parsed.success) {
    if (req.file) {
      deleteLocalImageIfNeeded(buildUploadedFileUrl(req, req.file));
    }

    return res.status(400).json({
      message: parsed.error.issues[0]?.message ?? 'Datos inválidos.'
    });
  }

  if (!finalImageUrl) {
    if (req.file) {
      deleteLocalImageIfNeeded(buildUploadedFileUrl(req, req.file));
    }

    return res.status(400).json({
      message: 'Debes cargar una imagen o ingresar una URL.'
    });
  }

  const count = await prisma.homeCarouselSlide.count();

  const slide = await prisma.homeCarouselSlide.create({
    data: {
      ...parsed.data,
      imageUrl: finalImageUrl,
      sortOrder: count
    }
  });

  res.status(201).json(slide);
});

router.put('/admin/:id', carouselUpload.single('imageFile'), async (req, res) => {
  const slideId = Number(req.params.id);

  if (Number.isNaN(slideId)) {
    if (req.file) {
      deleteLocalImageIfNeeded(buildUploadedFileUrl(req, req.file));
    }

    return res.status(400).json({ message: 'Id inválido.' });
  }

  const existingSlide = await prisma.homeCarouselSlide.findUnique({
    where: { id: slideId }
  });

  if (!existingSlide) {
    if (req.file) {
      deleteLocalImageIfNeeded(buildUploadedFileUrl(req, req.file));
    }

    return res.status(404).json({ message: 'Slide no encontrado.' });
  }

  const raw = parseSlidePayload(req);

  let finalImageUrl = existingSlide.imageUrl;

  if (raw.removeImage) {
    finalImageUrl = null;
  } else if (raw.imageMode === 'file' && req.file) {
    finalImageUrl = buildUploadedFileUrl(req, req.file);
  } else if (raw.imageMode === 'url') {
    finalImageUrl = raw.imageUrl;
  }

  const parsed = slideSchema.safeParse({
    title: raw.title,
    subtitle: raw.subtitle,
    imageUrl: finalImageUrl,
    active: raw.active,
    sortOrder: existingSlide.sortOrder
  });

  if (!parsed.success) {
    if (req.file) {
      deleteLocalImageIfNeeded(buildUploadedFileUrl(req, req.file));
    }

    return res.status(400).json({
      message: parsed.error.issues[0]?.message ?? 'Datos inválidos.'
    });
  }

  if (!finalImageUrl) {
    if (req.file) {
      deleteLocalImageIfNeeded(buildUploadedFileUrl(req, req.file));
    }

    return res.status(400).json({
      message: 'Debes dejar una imagen cargada o una URL.'
    });
  }

  if (
    existingSlide.imageUrl &&
    existingSlide.imageUrl !== finalImageUrl &&
    existingSlide.imageUrl.includes('/uploads/carousel/')
  ) {
    deleteLocalImageIfNeeded(existingSlide.imageUrl);
  }

  const updated = await prisma.homeCarouselSlide.update({
    where: { id: slideId },
    data: {
      ...parsed.data,
      imageUrl: finalImageUrl,
      sortOrder: existingSlide.sortOrder
    }
  });

  res.json(updated);
});

router.patch('/admin/:id/move', async (req, res) => {
  const slideId = Number(req.params.id);
  const parsed = moveSlideSchema.safeParse(req.body);

  if (Number.isNaN(slideId)) {
    return res.status(400).json({ message: 'Id inválido.' });
  }

  if (!parsed.success) {
    return res.status(400).json({
      message: parsed.error.issues[0]?.message ?? 'Datos inválidos.'
    });
  }

  const slides = await prisma.homeCarouselSlide.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
  });

  const currentIndex = slides.findIndex((slide) => slide.id === slideId);

  if (currentIndex === -1) {
    return res.status(404).json({ message: 'Slide no encontrado.' });
  }

  const targetIndex =
    parsed.data.direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  if (targetIndex < 0 || targetIndex >= slides.length) {
    return res.status(400).json({
      message:
        parsed.data.direction === 'up'
          ? 'El slide ya está en la primera posición.'
          : 'El slide ya está en la última posición.'
    });
  }

  const reordered = [...slides];
  const temp = reordered[currentIndex];
  reordered[currentIndex] = reordered[targetIndex];
  reordered[targetIndex] = temp;

  await prisma.$transaction(
    reordered.map((slide, index) =>
      prisma.homeCarouselSlide.update({
        where: { id: slide.id },
        data: { sortOrder: index }
      })
    )
  );

  const updatedSlides = await prisma.homeCarouselSlide.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
  });

  res.json({
    message:
      parsed.data.direction === 'up'
        ? 'Slide movido hacia arriba.'
        : 'Slide movido hacia abajo.',
    slides: updatedSlides
  });
});

router.delete('/admin/:id', async (req, res) => {
  const slideId = Number(req.params.id);

  if (Number.isNaN(slideId)) {
    return res.status(400).json({ message: 'Id inválido.' });
  }

  const existingSlide = await prisma.homeCarouselSlide.findUnique({
    where: { id: slideId }
  });

  if (!existingSlide) {
    return res.status(404).json({ message: 'Slide no encontrado.' });
  }

  if (existingSlide.imageUrl.includes('/uploads/carousel/')) {
    deleteLocalImageIfNeeded(existingSlide.imageUrl);
  }

  await prisma.homeCarouselSlide.delete({
    where: { id: slideId }
  });

  const remainingSlides = await prisma.homeCarouselSlide.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
  });

  await prisma.$transaction(
    remainingSlides.map((slide, index) =>
      prisma.homeCarouselSlide.update({
        where: { id: slide.id },
        data: { sortOrder: index }
      })
    )
  );

  res.json({ message: 'Slide eliminado correctamente.' });
});

export default router;