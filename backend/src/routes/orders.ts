import { Router } from 'express';
import { OrderStatus, InventoryMovementType, NotificationType } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const createOrderSchema = z.object({
  shippingAddress: z.string().min(5, 'La dirección es obligatoria.'),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive()
      })
    )
    .min(1, 'Debes agregar al menos un producto.')
});

function getEffectivePrice(product: {
  price: number;
  offerPrice?: number | null;
  offerEnabled?: boolean;
}) {
  if (
    product.offerEnabled &&
    product.offerPrice &&
    product.offerPrice > 0 &&
    product.offerPrice < product.price
  ) {
    return product.offerPrice;
  }

  return product.price;
}

router.use(authenticate);

router.get('/', async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.userId },
    include: {
      items: {
        include: { product: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json(orders);
});

router.post('/', async (req, res) => {
  const parsed = createOrderSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Datos inválidos.' });
  }

  const { items, shippingAddress } = parsed.data;
  const productIds = items.map((item) => item.productId);

  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true }
  });

  if (products.length !== productIds.length) {
    return res.status(400).json({ message: 'Uno o más productos ya no están disponibles.' });
  }

  for (const item of items) {
    const product = products.find((entry) => entry.id === item.productId)!;

    if (product.stock < item.quantity) {
      return res.status(400).json({ message: `Stock insuficiente para ${product.name}.` });
    }
  }

  const total = items.reduce((acc, item) => {
    const product = products.find((entry) => entry.id === item.productId)!;
    return acc + getEffectivePrice(product) * item.quantity;
  }, 0);

  const code = `ORD-${Date.now()}`;

  const order = await prisma.$transaction(async (tx) => {
    const createdOrder = await tx.order.create({
      data: {
        code,
        shippingAddress,
        total,
        status: OrderStatus.PAID,
        userId: req.user!.userId,
        items: {
          create: items.map((item) => {
            const product = products.find((entry) => entry.id === item.productId)!;

            return {
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: getEffectivePrice(product),
              originalPrice: product.price
            };
          })
        }
      },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    for (const item of items) {
      const product = products.find((entry) => entry.id === item.productId)!;
      const newStock = product.stock - item.quantity;

      await tx.product.update({
        where: { id: product.id },
        data: { stock: newStock }
      });

      await tx.inventoryMovement.create({
        data: {
          productId: product.id,
          type: InventoryMovementType.SALE,
          quantity: item.quantity,
          note: `Venta por orden ${code}`
        }
      });

      if (newStock <= product.lowStockThreshold) {
        await tx.notification.create({
          data: {
            title: 'Stock bajo',
            message: `${product.name} quedó con ${newStock} unidades disponibles.`,
            type: NotificationType.STOCK_LOW
          }
        });
      }
    }

    await tx.notification.create({
      data: {
        title: 'Nueva venta',
        message: `Se registró la orden ${code} por un total de $${total}.`,
        type: NotificationType.ORDER_CREATED
      }
    });

    return createdOrder;
  });

  res.status(201).json(order);
});

export default router;