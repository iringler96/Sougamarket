import {
  PrismaClient,
  Role,
  InventoryMovementType,
  NotificationType,
  OrderStatus
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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

  await prisma.product.createMany({
    data: [
      {
        name: 'Whisky Black Reserve 750cc',
        slug: 'whisky-black-reserve-750cc',
        description: 'Whisky premium ideal para celebraciones y regalos.',
        category: 'Alcoholes',
        brand: 'Black Reserve',
        price: 24990,
        offerPrice: 19990,
        offerEnabled: true,
        stock: 16,
        lowStockThreshold: 5,
        imageUrl:
          'https://images.unsplash.com/photo-1582819509237-df6b4fffa8af?auto=format&fit=crop&w=800&q=80',
        requiresAgeCheck: true
      },
      {
        name: 'Vino Carménère Reserva 750cc',
        slug: 'vino-carmenere-reserva-750cc',
        description: 'Vino tinto reserva de excelente relación precio calidad.',
        category: 'Alcoholes',
        brand: 'Valle Sur',
        price: 8990,
        offerPrice: 6990,
        offerEnabled: true,
        stock: 24,
        lowStockThreshold: 6,
        imageUrl:
          'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
        requiresAgeCheck: true
      },
      {
        name: 'Pisco Transparente 750cc',
        slug: 'pisco-transparente-750cc',
        description: 'Pisco tradicional para reuniones y preparaciones.',
        category: 'Alcoholes',
        brand: 'Pampa Clara',
        price: 10990,
        offerPrice: 9490,
        offerEnabled: false,
        stock: 18,
        lowStockThreshold: 5,
        imageUrl:
          'https://images.unsplash.com/photo-1596392301391-684b4f2d4d7f?auto=format&fit=crop&w=800&q=80',
        requiresAgeCheck: true
      },
      {
        name: 'Aceite Maravilla 1L',
        slug: 'aceite-maravilla-1l',
        description: 'Aceite para uso diario en cocina.',
        category: 'Abarrotes',
        brand: 'Cocina Plus',
        price: 3390,
        offerPrice: 2890,
        offerEnabled: false,
        stock: 42,
        lowStockThreshold: 10,
        imageUrl:
          'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80',
        requiresAgeCheck: false
      },
      {
        name: 'Arroz Grado 2 1Kg',
        slug: 'arroz-grado-2-1kg',
        description: 'Arroz de grano largo para acompañar todas tus comidas.',
        category: 'Abarrotes',
        brand: 'Campos del Sur',
        price: 1890,
        offerPrice: 1590,
        offerEnabled: true,
        stock: 50,
        lowStockThreshold: 10,
        imageUrl:
          'https://images.unsplash.com/photo-1586201375761-83865001e31b?auto=format&fit=crop&w=800&q=80',
        requiresAgeCheck: false
      },
      {
        name: 'Fideos Espagueti 400g',
        slug: 'fideos-espagueti-400g',
        description: 'Pasta tradicional para almuerzos rápidos.',
        category: 'Abarrotes',
        brand: 'Trigo de Oro',
        price: 990,
        offerPrice: 790,
        offerEnabled: true,
        stock: 70,
        lowStockThreshold: 12,
        imageUrl:
          'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=800&q=80',
        requiresAgeCheck: false
      },
      {
        name: 'Azúcar Granulada 1Kg',
        slug: 'azucar-granulada-1kg',
        description: 'Azúcar granulada para cocina y repostería.',
        category: 'Abarrotes',
        brand: 'Dulce Hogar',
        price: 1490,
        offerPrice: null,
        offerEnabled: false,
        stock: 36,
        lowStockThreshold: 8,
        imageUrl:
          'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=800&q=80',
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

  const whisky = allProducts.find((p) => p.slug === 'whisky-black-reserve-750cc');
  const aceite = allProducts.find((p) => p.slug === 'aceite-maravilla-1l');
  const arroz = allProducts.find((p) => p.slug === 'arroz-grado-2-1kg');

  if (!whisky || !aceite || !arroz) {
    throw new Error('No se encontraron productos necesarios para crear la orden demo.');
  }

  const whiskyPrice = getEffectivePrice(whisky);
  const aceitePrice = getEffectivePrice(aceite);
  const arrozPrice = getEffectivePrice(arroz);

  const sampleOrderTotal = whiskyPrice * 1 + aceitePrice * 1 + arrozPrice * 3;

  const sampleOrder = await prisma.order.create({
    data: {
      code: 'ORD-DEMO-1001',
      userId: customer.id,
      total: sampleOrderTotal,
      shippingAddress: 'Av. Siempre Viva 123, Temuco',
      status: OrderStatus.PAID,
      items: {
        create: [
          {
            productId: whisky.id,
            quantity: 1,
            unitPrice: whiskyPrice,
            originalPrice: whisky.price
          },
          {
            productId: aceite.id,
            quantity: 1,
            unitPrice: aceitePrice,
            originalPrice: aceite.price
          },
          {
            productId: arroz.id,
            quantity: 3,
            unitPrice: arrozPrice,
            originalPrice: arroz.price
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