import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ImageIcon from '@mui/icons-material/Image';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';

export function AdminLayout() {
  const location = useLocation();

  const links = [
    { label: 'Dashboard', to: '/admin', icon: <DashboardIcon /> },
    { label: 'Productos', to: '/admin/productos', icon: <InventoryIcon /> },
    { label: 'Carrusel', to: '/admin/carrusel', icon: <ImageIcon /> },
    { label: 'Órdenes', to: '/admin/ordenes', icon: <ReceiptLongIcon /> }
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
        <Paper sx={{ width: { xs: '100%', md: 280 }, p: 2, position: 'sticky', top: 96 }}>
          <Typography variant="h6" fontWeight={800} mb={2}>
            Panel administrador
          </Typography>

          <Stack spacing={1.5}>
            <Button component={RouterLink} to="/" startIcon={<ArrowBackIcon />} variant="text">
              Volver a tienda
            </Button>

            {links.map((item) => (
              <Button
                key={item.to}
                component={RouterLink}
                to={item.to}
                startIcon={item.icon}
                variant={location.pathname === item.to ? 'contained' : 'outlined'}
                sx={{ justifyContent: 'flex-start' }}
              >
                {item.label}
              </Button>
            ))}
          </Stack>
        </Paper>

        <Box flex={1} width="100%">
          <Outlet />
        </Box>
      </Stack>
    </Container>
  );
}