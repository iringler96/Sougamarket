import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

router.get('/', async (req, res) => {
  const search = String(req.query.search ?? '').trim();
  const category = String(req.query.category ?? '').trim();

  const products = await prisma.product.findMany({
    where: {
      active: true,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { category: { contains: search, mode: 'insensitive' } },
              { brand: { contains: search, mode: 'insensitive' } }
            ]
          }
        : {}),
      ...(category ? { category: { equals: category, mode: 'insensitive' } } : {})
    },
    orderBy: [{ createdAt: 'desc' }]
  });

  res.json(products);
});

router.get('/categories', async (_req, res) => {
  const categories = await prisma.product.findMany({
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' }
  });

  res.json(categories.map((item) => item.category));
});

router.get('/:id', async (req, res) => {
  const productId = Number(req.params.id);

  if (Number.isNaN(productId)) {
    return res.status(400).json({ message: 'Id de producto inválido.' });
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });

  if (!product) {
    return res.status(404).json({ message: 'Producto no encontrado.' });
  }

  res.json(product);
});

export default router;
