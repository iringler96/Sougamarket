import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import ProductionQuantityLimitsIcon from '@mui/icons-material/ProductionQuantityLimits';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import {
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { DashboardData } from '../types';

const summaryCards = (data: DashboardData) => [
  {
    title: 'Ventas totales',
    value: `$${data.totalSales.toLocaleString('es-CL')}`,
    icon: <PointOfSaleIcon color="primary" />
  },
  {
    title: 'Órdenes',
    value: String(data.orderCount),
    icon: <ShoppingBagIcon color="primary" />
  },
  {
    title: 'Ticket promedio',
    value: `$${Math.round(data.averageTicket).toLocaleString('es-CL')}`,
    icon: <NotificationsActiveIcon color="primary" />
  },
  {
    title: 'Productos críticos',
    value: String(data.lowStockProducts.length),
    icon: <ProductionQuantityLimitsIcon color="primary" />
  }
];

export function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      const response = await api.get<DashboardData>('/admin/dashboard');
      setData(response.data);
    }

    loadDashboard();
  }, []);

  if (!data) {
    return (
      <Stack minHeight="50vh" alignItems="center" justifyContent="center">
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Stack>
        <Typography variant="h3">Dashboard de ventas</Typography>
        <Typography color="text.secondary">
          Vista general de ventas, alertas de stock y desempeño por producto.
        </Typography>
      </Stack>

      <Grid container spacing={2}>
        {summaryCards(data).map((card) => (
          <Grid item xs={12} sm={6} xl={3} key={card.title}>
            <Card>
              <CardContent>
                <Stack spacing={1.5}>
                  {card.icon}
                  <Typography color="text.secondary">{card.title}</Typography>
                  <Typography variant="h4" fontWeight={800}>{card.value}</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Ventas por producto</Typography>
              <Stack spacing={2}>
                {data.topProducts.map((product, index) => {
                  const maxUnits = data.topProducts[0]?.units || 1;
                  return (
                    <Stack key={product.productId} spacing={0.7}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography>{index + 1}. {product.name}</Typography>
                        <Typography fontWeight={700}>{product.units} un.</Typography>
                      </Stack>
                      <LinearProgress variant="determinate" value={(product.units / maxUnits) * 100} sx={{ height: 10, borderRadius: 10 }} />
                      <Typography variant="body2" color="text.secondary">
                        Ingresos: ${product.revenue.toLocaleString('es-CL')}
                      </Typography>
                    </Stack>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Notificaciones</Typography>
              <List disablePadding>
                {data.notifications.map((item) => (
                  <ListItem key={item.id} divider disableGutters>
                    <ListItemText
                      primary={item.title}
                      secondary={`${item.message} · ${new Date(item.createdAt).toLocaleString('es-CL')}`}
                    />
                    {!item.read && <Chip label="Nuevo" color="secondary" size="small" />}
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" mb={2}>Productos con stock bajo</Typography>
          <Grid container spacing={2}>
            {data.lowStockProducts.map((product) => (
              <Grid item xs={12} md={6} lg={4} key={product.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Stack spacing={1}>
                      <Typography fontWeight={700}>{product.name}</Typography>
                      <Typography color="text.secondary">{product.category}</Typography>
                      <Chip label={`Stock: ${product.stock}`} color="warning" sx={{ width: 'fit-content' }} />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  );
}
