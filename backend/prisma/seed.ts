import { PrismaClient, Role, InventoryMovementType, NotificationType, OrderStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('Admin123*', 10);
  const customerPassword = await bcrypt.hash('Cliente123*', 10);

  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      name: 'Administrador',
      email: 'admin@tienda.cl',
      passwordHash: adminPassword,
      role: Role.ADMIN
    }
  });

  const customer = await prisma.user.create({
    data: {
      name: 'Cliente Demo',
      email: 'cliente@tienda.cl',
      passwordHash: customerPassword,
      role: Role.CUSTOMER
    }
  });

  const products = await prisma.product.createMany({
    data: [
      {
        name: 'Whisky Black Reserve 750cc',
        slug: 'whisky-black-reserve-750cc',
        description: 'Whisky premium ideal para celebraciones y regalos.',
        category: 'Alcoholes',
        brand: 'Black Reserve',
        price: 24990,
        stock: 16,
        lowStockThreshold: 5,
        imageUrl: 'https://images.unsplash.com/photo-1582819509237-df6b4fffa8af?auto=format&fit=crop&w=800&q=80',
        requiresAgeCheck: true
      },
      {
        name: 'Vino Carménère Reserva 750cc',
        slug: 'vino-carmenere-reserva-750cc',
        description: 'Vino tinto reserva de excelente relación precio calidad.',
        category: 'Alcoholes',
        brand: 'Valle Sur',
        price: 8990,
        stock: 24,
        lowStockThreshold: 6,
        imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
        requiresAgeCheck: true
      },
      {
        name: 'Aceite Maravilla 1L',
        slug: 'aceite-maravilla-1l',
        description: 'Aceite para uso diario en cocina.',
        category: 'Abarrotes',
        brand: 'Cocina Plus',
        price: 3390,
        stock: 42,
        lowStockThreshold: 10,
        imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80',
        requiresAgeCheck: false
      },
      {
        name: 'Arroz Grado 2 1Kg',
        slug: 'arroz-grado-2-1kg',
        description: 'Arroz de grano largo para acompañar todas tus comidas.',
        category: 'Abarrotes',
        brand: 'Campos del Sur',
        price: 1890,
        stock: 50,
        lowStockThreshold: 10,
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31b?auto=format&fit=crop&w=800&q=80',
        requiresAgeCheck: false
      },
      {
        name: 'Fideos Espagueti 400g',
        slug: 'fideos-espagueti-400g',
        description: 'Pasta tradicional para almuerzos rápidos.',
        category: 'Abarrotes',
        brand: 'Trigo de Oro',
        price: 990,
        stock: 70,
        lowStockThreshold: 12,
        imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=800&q=80',
        requiresAgeCheck: false
      }
    ]
  });

  const allProducts = await prisma.product.findMany();

  for (const product of allProducts) {
    await prisma.inventoryMovement.create({
      data: {
        productId: product.id,
        type: InventoryMovementType.IN,
        quantity: product.stock,
        note: 'Carga inicial de inventario'
      }
    });
  }

  const sampleOrder = await prisma.order.create({
    data: {
      code: 'ORD-DEMO-1001',
      userId: customer.id,
      total: 33980,
      shippingAddress: 'Av. Siempre Viva 123, Temuco',
      status: OrderStatus.PAID,
      items: {
        create: [
          {
            productId: allProducts[0].id,
            quantity: 1,
            unitPrice: allProducts[0].price
          },
          {
            productId: allProducts[2].id,
            quantity: 1,
            unitPrice: allProducts[2].price
          },
          {
            productId: allProducts[3].id,
            quantity: 3,
            unitPrice: allProducts[3].price
          }
        ]
      }
    }
  });

  await prisma.notification.create({
    data: {
      title: 'Nueva venta registrada',
      message: `Se registró la orden ${sampleOrder.code} por $${sampleOrder.total}.`,
      type: NotificationType.ORDER_CREATED
    }
  });

  console.log('Seed completado.');
  console.log('Admin:', admin.email, ' / clave: Admin123*');
  console.log('Cliente:', customer.email, ' / clave: Cliente123*');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
