import {
  Card,
  CardContent,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Order, OrderStatus } from '../types';

const statuses: OrderStatus[] = ['PAID', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  async function loadOrders() {
    const response = await api.get<Order[]>('/admin/orders');
    setOrders(response.data);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const updateStatus = async (orderId: number, status: OrderStatus) => {
    await api.patch(`/admin/orders/${orderId}/status`, { status });
    await loadOrders();
  };

  return (
    <Stack spacing={3}>
      <Stack>
        <Typography variant="h3">Órdenes</Typography>
        <Typography color="text.secondary">Revisa compras, cliente, total y cambia el estado de despacho.</Typography>
      </Stack>

      <Card>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Detalle</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell>{order.code}</TableCell>
                  <TableCell>
                    <Stack>
                      <Typography fontWeight={700}>{order.user?.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{order.user?.email}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleString('es-CL')}</TableCell>
                  <TableCell>${order.total.toLocaleString('es-CL')}</TableCell>
                  <TableCell>
                    <TextField
                      select
                      size="small"
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                    >
                      {statuses.map((status) => (
                        <MenuItem key={status} value={status}>
                          {status}
                        </MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                  <TableCell>
                    {order.items.map((item) => `${item.product.name} x${item.quantity}`).join(', ')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Stack>
  );
}
