import fs from 'node:fs';
import path from 'node:path';
import { Request, Router } from 'express';
import { InventoryMovementType, OrderStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { productUpload } from '../middleware/upload.js';
import { slugify } from '../utils/slug.js';

const router = Router();

router.use(authenticate, requireAdmin);

const productSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(5),
  category: z.string().min(2),
  brand: z.string().nullable().optional(),
  price: z.number().positive(),
  offerPrice: z.number().positive().nullable().optional(),
  offerEnabled: z.boolean(),
  stock: z.number().int().nonnegative(),
  lowStockThreshold: z.number().int().nonnegative(),
  imageUrl: z.string().url().nullable().optional(),
  active: z.boolean(),
  requiresAgeCheck: z.boolean()
});

const stockSchema = z.object({
  quantity: z.number().int(),
  note: z.string().optional()
});

const statusSchema = z.object({
  status: z.nativeEnum(OrderStatus)
});

const categoryOfferToggleSchema = z.object({
  category: z.string().min(2, 'La categoría es obligatoria.'),
  enabled: z.boolean()
});

function parseBoolean(value: unknown) {
  return value === true || value === 'true' || value === '1' || value === 'on';
}

function parseNullableString(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseNullableNumber(value: unknown) {
  if (value === undefined || value === null || value === '') return null;
  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? null : numericValue;
}

function parseProductPayload(req: Request) {
  return {
    name: String(req.body.name ?? '').trim(),
    description: String(req.body.description ?? '').trim(),
    category: String(req.body.category ?? '').trim(),
    brand: parseNullableString(req.body.brand),
    price: Number(req.body.price),
    offerPrice: parseNullableNumber(req.body.offerPrice),
    offerEnabled: parseBoolean(req.body.offerEnabled),
    stock: Number(req.body.stock),
    lowStockThreshold: Number(req.body.lowStockThreshold),
    active: parseBoolean(req.body.active),
    requiresAgeCheck: parseBoolean(req.body.requiresAgeCheck),
    imageMode: String(req.body.imageMode ?? 'url').trim(),
    imageUrl: parseNullableString(req.body.imageUrl),
    removeImage: parseBoolean(req.body.removeImage)
  };
}

function buildUploadedFileUrl(req: Request, file: Express.Multer.File) {
  const host = req.get('host') ?? 'localhost:4000';
  return `${req.protocol}://${host}/uploads/products/${file.filename}`;
}

function deleteLocalImageIfNeeded(imageUrl: string | null | undefined) {
  if (!imageUrl) return;

  const marker = '/uploads/products/';
  const index = imageUrl.indexOf(marker);

  if (index === -1) return;

  const fileName = imageUrl.slice(index + marker.length);
  const filePath = path.resolve('uploads/products', fileName);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

function validateOfferPrice(
  price: number,
  offerPrice: number | null | undefined,
  offerEnabled: boolean
) {
  if (offerEnabled && !offerPrice) {
    return 'Debes ingresar un precio oferta para activarla.';
  }

  if (offerEnabled && offerPrice && offerPrice >= price) {
    return 'El precio oferta debe ser menor al precio normal.';
  }

  return null;
}

router.get('/dashboard', async (_req, res) => {
  const [products, orders, notifications] = await Promise.all([
    prisma.product.findMany({ orderBy: { stock: 'asc' } }),
    prisma.order.findMany({
      include: {
        items: {
          include: { product: true }
        },
        user: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 10 })
  ]);

  const totalSales = orders.reduce((acc, order) => acc + order.total, 0);
  const orderCount = orders.length;
  const lowStockProducts = products.filter((product) => product.stock <= product.lowStockThreshold);

  const salesByProductMap = new Map<
    string,
    { productId: number; name: string; units: number; revenue: number }
  >();

  for (const order of orders) {
    for (const item of order.items) {
      const current = salesByProductMap.get(item.product.name) ?? {
        productId: item.product.id,
        name: item.product.name,
        units: 0,
        revenue: 0
      };

      current.units += item.quantity;
      current.revenue += item.quantity * item.unitPrice;
      salesByProductMap.set(item.product.name, current);
    }
  }

  const topProducts = Array.from(salesByProductMap.values())
    .sort((a, b) => b.units - a.units)
    .slice(0, 5);

  res.json({
    totalSales,
    orderCount,
    averageTicket: orderCount ? totalSales / orderCount : 0,
    productCount: products.length,
    lowStockProducts,
    topProducts,
    recentOrders: orders.slice(0, 8),
    notifications
  });
});

router.get('/products', async (_req, res) => {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' }
  });

  res.json(products);
});

router.post('/products', productUpload.single('imageFile'), async (req, res) => {
  const raw = parseProductPayload(req);

  const finalImageUrl =
    raw.imageMode === 'file' && req.file
      ? buildUploadedFileUrl(req, req.file)
      : raw.imageMode === 'url'
        ? raw.imageUrl
        : null;

  const parsed = productSchema.safeParse({
    ...raw,
    imageUrl: finalImageUrl
  });

  if (!parsed.success) {
    if (req.file) {
      deleteLocalImageIfNeeded(buildUploadedFileUrl(req, req.file));
    }

    return res.status(400).json({
      message: parsed.error.issues[0]?.message ?? 'Datos inválidos.'
    });
  }

  const data = parsed.data;
  const offerPriceError = validateOfferPrice(data.price, data.offerPrice, data.offerEnabled);

  if (offerPriceError) {
    if (req.file) {
      deleteLocalImageIfNeeded(buildUploadedFileUrl(req, req.file));
    }

    return res.status(400).json({ message: offerPriceError });
  }

  const slug = slugify(data.name);
  const existing = await prisma.product.findUnique({ where: { slug } });

  if (existing) {
    if (req.file) {
      deleteLocalImageIfNeeded(buildUploadedFileUrl(req, req.file));
    }

    return res.status(400).json({
      message: 'Ya existe un producto con un nombre similar.'
    });
  }

  const product = await prisma.product.create({
    data: {
      ...data,
      slug
    }
  });

  await prisma.inventoryMovement.create({
    data: {
      productId: product.id,
      type: InventoryMovementType.IN,
      quantity: product.stock,
      note: 'Carga inicial desde panel admin'
    }
  });

  res.status(201).json(product);
});

router.put('/products/:id', productUpload.single('imageFile'), async (req, res) => {
  const productId = Number(req.params.id);

  if (Number.isNaN(productId)) {
    if (req.file) {
      deleteLocalImageIfNeeded(buildUploadedFileUrl(req, req.file));
    }

    return res.status(400).json({ message: 'Id inválido.' });
  }

  const existingProduct = await prisma.product.findUnique({
    where: { id: productId }
  });

  if (!existingProduct) {
    if (req.file) {
      deleteLocalImageIfNeeded(buildUploadedFileUrl(req, req.file));
    }

    return res.status(404).json({ message: 'Producto no encontrado.' });
  }

  const raw = parseProductPayload(req);

  let finalImageUrl = existingProduct.imageUrl;

  if (raw.removeImage) {
    finalImageUrl = null;
  } else if (raw.imageMode === 'file' && req.file) {
    finalImageUrl = buildUploadedFileUrl(req, req.file);
  } else if (raw.imageMode === 'url') {
    finalImageUrl = raw.imageUrl;
  }

  const parsed = productSchema.safeParse({
    ...raw,
    imageUrl: finalImageUrl
  });

  if (!parsed.success) {
    if (req.file) {
      deleteLocalImageIfNeeded(buildUploadedFileUrl(req, req.file));
    }

    return res.status(400).json({
      message: parsed.error.issues[0]?.message ?? 'Datos inválidos.'
    });
  }

  const data = parsed.data;
  const offerPriceError = validateOfferPrice(data.price, data.offerPrice, data.offerEnabled);

  if (offerPriceError) {
    if (req.file) {
      deleteLocalImageIfNeeded(buildUploadedFileUrl(req, req.file));
    }

    return res.status(400).json({ message: offerPriceError });
  }

  const slug = slugify(data.name);

  const repeatedSlug = await prisma.product.findFirst({
    where: {
      slug,
      id: { not: productId }
    }
  });

  if (repeatedSlug) {
    if (req.file) {
      deleteLocalImageIfNeeded(buildUploadedFileUrl(req, req.file));
    }

    return res.status(400).json({
      message: 'Ya existe un producto con un nombre similar.'
    });
  }

  if (
    existingProduct.imageUrl &&
    existingProduct.imageUrl !== finalImageUrl &&
    existingProduct.imageUrl.includes('/uploads/products/')
  ) {
    deleteLocalImageIfNeeded(existingProduct.imageUrl);
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data: {
      ...data,
      slug
    }
  });

  res.json(updated);
});

router.patch('/products/:id/stock', async (req, res) => {
  const productId = Number(req.params.id);
  const parsed = stockSchema.safeParse(req.body);

  if (Number.isNaN(productId)) {
    return res.status(400).json({ message: 'Id inválido.' });
  }

  if (!parsed.success) {
    return res.status(400).json({
      message: parsed.error.issues[0]?.message ?? 'Datos inválidos.'
    });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId }
  });

  if (!product) {
    return res.status(404).json({ message: 'Producto no encontrado.' });
  }

  const newStock = product.stock + parsed.data.quantity;

  if (newStock < 0) {
    return res.status(400).json({
      message: 'El stock no puede quedar negativo.'
    });
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data: { stock: newStock }
  });

  await prisma.inventoryMovement.create({
    data: {
      productId,
      type: parsed.data.quantity >= 0 ? InventoryMovementType.IN : InventoryMovementType.ADJUSTMENT,
      quantity: Math.abs(parsed.data.quantity),
      note: parsed.data.note || 'Ajuste manual de stock'
    }
  });

  res.json(updated);
});

router.patch('/products/category-offer', async (req, res) => {
  const parsed = categoryOfferToggleSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: parsed.error.issues[0]?.message ?? 'Datos inválidos.'
    });
  }

  const { category, enabled } = parsed.data;

  const products = await prisma.product.findMany({
    where: {
      category: {
        equals: category.trim(),
        mode: 'insensitive'
      }
    },
    select: {
      id: true,
      name: true,
      category: true,
      price: true,
      offerPrice: true,
      offerEnabled: true
    }
  });

  if (!products.length) {
    return res.status(404).json({
      message: 'No se encontraron productos en esa categoría.'
    });
  }

  let targetProducts: typeof products = [];

  if (enabled) {
    targetProducts = products.filter(
      (product) =>
        !!product.offerPrice &&
        product.offerPrice > 0 &&
        product.offerPrice < product.price
    );

    if (!targetProducts.length) {
      return res.status(400).json({
        message: 'No hay productos con precio oferta válido dentro de esa categoría.'
      });
    }
  } else {
    targetProducts = products.filter((product) => product.offerEnabled);

    if (!targetProducts.length) {
      return res.status(400).json({
        message: 'No hay ofertas activas en esa categoría.'
      });
    }
  }

  const result = await prisma.product.updateMany({
    where: {
      id: {
        in: targetProducts.map((product) => product.id)
      }
    },
    data: {
      offerEnabled: enabled
    }
  });

  res.json({
    message: enabled
      ? `Se activaron las ofertas en ${result.count} producto(s) de la categoría ${category}.`
      : `Se desactivaron las ofertas en ${result.count} producto(s) de la categoría ${category}.`,
    updatedCount: result.count
  });
});

router.get('/orders', async (_req, res) => {
  const orders = await prisma.order.findMany({
    include: {
      user: true,
      items: {
        include: { product: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json(orders);
});

router.patch('/orders/:id/status', async (req, res) => {
  const orderId = Number(req.params.id);
  const parsed = statusSchema.safeParse(req.body);

  if (Number.isNaN(orderId)) {
    return res.status(400).json({ message: 'Id inválido.' });
  }

  if (!parsed.success) {
    return res.status(400).json({
      message: parsed.error.issues[0]?.message ?? 'Datos inválidos.'
    });
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: parsed.data.status }
  });

  res.json(updated);
});

router.get('/notifications', async (_req, res) => {
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  res.json(notifications);
});

router.patch('/notifications/:id/read', async (req, res) => {
  const notificationId = Number(req.params.id);

  if (Number.isNaN(notificationId)) {
    return res.status(400).json({ message: 'Id inválido.' });
  }

  const notification = await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true }
  });

  res.json(notification);
});

export default router;