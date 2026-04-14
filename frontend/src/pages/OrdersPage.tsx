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
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }}>
                <Stack>
                  <Typography variant="h6">{order.code}</Typography>
                  <Typography color="text.secondary">
                    {new Date(order.createdAt).toLocaleString('es-CL')}
                  </Typography>
                </Stack>
                <Chip label={order.status} color={statusMap[order.status]} />
              </Stack>
              <Divider />
              {order.items.map((item) => (
                <Stack key={item.id} direction="row" justifyContent="space-between">
                  <Typography>{item.product.name} x {item.quantity}</Typography>
                  <Typography>${(item.unitPrice * item.quantity).toLocaleString('es-CL')}</Typography>
                </Stack>
              ))}
              <Divider />
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
