import { Router } from 'express';
import { InventoryMovementType, OrderStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { slugify } from '../utils/slug.js';

const router = Router();

router.use(authenticate, requireAdmin);

const productSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(5),
  category: z.string().min(2),
  brand: z.string().optional().nullable(),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
  lowStockThreshold: z.number().int().nonnegative(),
  imageUrl: z.string().url().optional().or(z.literal('')).nullable(),
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

  const salesByProductMap = new Map<string, { productId: number; name: string; units: number; revenue: number }>();

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
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(products);
});

router.post('/products', async (req, res) => {
  const parsed = productSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Datos inválidos.' });
  }

  const data = parsed.data;
  const slug = slugify(data.name);

  const existing = await prisma.product.findUnique({ where: { slug } });
  if (existing) {
    return res.status(400).json({ message: 'Ya existe un producto con un nombre similar.' });
  }

  const product = await prisma.product.create({
    data: {
      ...data,
      brand: data.brand || null,
      imageUrl: data.imageUrl || null,
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

router.put('/products/:id', async (req, res) => {
  const productId = Number(req.params.id);
  const parsed = productSchema.safeParse(req.body);

  if (Number.isNaN(productId)) {
    return res.status(400).json({ message: 'Id inválido.' });
  }

  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Datos inválidos.' });
  }

  const data = parsed.data;
  const slug = slugify(data.name);

  const updated = await prisma.product.update({
    where: { id: productId },
    data: {
      ...data,
      brand: data.brand || null,
      imageUrl: data.imageUrl || null,
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
    return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Datos inválidos.' });
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });

  if (!product) {
    return res.status(404).json({ message: 'Producto no encontrado.' });
  }

  const newStock = product.stock + parsed.data.quantity;

  if (newStock < 0) {
    return res.status(400).json({ message: 'El stock no puede quedar negativo.' });
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
    return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Datos inválidos.' });
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
