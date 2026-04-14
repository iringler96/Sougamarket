import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import {
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Order } from '../types';

const statusMap: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  PENDING_PAYMENT: 'warning',
  PAID: 'info',
  PREPARING: 'warning',
  SHIPPED: 'info',
  DELIVERED: 'success',
  CANCELLED: 'error'
};

function hasDiscount(normalPrice: number, paidPrice: number) {
  return paidPrice > 0 && paidPrice < normalPrice;
}

function getDiscountPercentage(normalPrice: number, paidPrice: number) {
  return Math.round(((normalPrice - paidPrice) / normalPrice) * 100);
}

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      const response = await api.get<Order[]>('/orders');
      setOrders(response.data);
      setLoading(false);
    }

    loadOrders();
  }, []);

  if (loading) {
    return (
      <Stack minHeight="50vh" alignItems="center" justifyContent="center">
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h2">Mis órdenes</Typography>

      {orders.map((order) => (
        <Card key={order.id}>
          <CardContent>
            <Stack spacing={1.5}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ sm: 'center' }}
              >
                <Stack>
                  <Typography variant="h6">{order.code}</Typography>
                  <Typography color="text.secondary">
                    {new Date(order.createdAt).toLocaleString('es-CL')}
                  </Typography>
                </Stack>

                <Chip label={order.status} color={statusMap[order.status]} />
              </Stack>

              <Divider />

              {order.items.map((item) => {
                const normalPrice = item.originalPrice ?? item.product.price;
                const paidPrice = item.unitPrice;
                const discounted = hasDiscount(normalPrice, paidPrice);
                const discountPercentage = discounted
                  ? getDiscountPercentage(normalPrice, paidPrice)
                  : 0;

                return (
                  <Stack key={item.id} spacing={0.6}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Stack spacing={0.3}>
                        <Typography fontWeight={600}>
                          {item.product.name} x {item.quantity}
                        </Typography>

                        {discounted ? (
                          <Stack spacing={0.3}>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              flexWrap="wrap"
                              useFlexGap
                            >
                              <Typography
                                variant="body2"
                                sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
                              >
                                ${normalPrice.toLocaleString('es-CL')}
                              </Typography>

                              <Typography variant="body2" color="error.main" fontWeight={700}>
                                ${paidPrice.toLocaleString('es-CL')} c/u
                              </Typography>

                              <Chip
                                icon={<LocalOfferIcon />}
                                label={`-${discountPercentage}%`}
                                size="small"
                                color="error"
                              />
                            </Stack>

                            <Typography variant="caption" color="success.main" fontWeight={700}>
                              Ahorro por unidad: ${(normalPrice - paidPrice).toLocaleString('es-CL')}
                            </Typography>
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            ${paidPrice.toLocaleString('es-CL')} c/u
                          </Typography>
                        )}
                      </Stack>

                      <Typography fontWeight={700}>
                        ${(paidPrice * item.quantity).toLocaleString('es-CL')}
                      </Typography>
                    </Stack>

                    <Divider />
                  </Stack>
                );
              })}

              <Stack direction="row" justifyContent="space-between">
                <Typography fontWeight={700}>Total</Typography>
                <Typography fontWeight={700}>${order.total.toLocaleString('es-CL')}</Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}