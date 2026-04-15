import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import StorefrontIcon from '@mui/icons-material/Storefront';
import {
  AppBar,
  Badge,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Typography
} from '@mui/material';
import { Link as RouterLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

export function StoreLayout() {
  const { items } = useCart();
  const { user, logout } = useAuth();
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <Box minHeight="100vh" bgcolor="background.default">
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid #eceff5' }}>
        <Toolbar>
          <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <StorefrontIcon color="primary" />
              <Typography variant="h6" fontWeight={800}>
                SOUGAMARK
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button component={RouterLink} to="/" color="inherit">
                Inicio
              </Button>
              <Button component={RouterLink} to="/catalogo" color="inherit">
                Catálogo
              </Button>
              {user && (
                <Button component={RouterLink} to="/mis-ordenes" color="inherit">
                  Mis órdenes
                </Button>
              )}
              {user?.role === 'ADMIN' && (
                <Button component={RouterLink} to="/admin" color="inherit" startIcon={<AdminPanelSettingsIcon />}>
                  Admin
                </Button>
              )}
              <Button component={RouterLink} to="/carrito" color="inherit" startIcon={
                <Badge badgeContent={itemCount} color="secondary">
                  <ShoppingCartIcon />
                </Badge>
              }>
                Carrito
              </Button>
              {!user ? (
                <>
                  <Button component={RouterLink} to="/login" color="inherit">
                    Ingresar
                  </Button>
                  <Button component={RouterLink} to="/registro" variant="contained">
                    Crear cuenta
                  </Button>
                </>
              ) : (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2">Hola, {user.name}</Typography>
                  <Button variant="outlined" onClick={logout}>
                    Salir
                  </Button>
                </Stack>
              )}
            </Stack>
          </Container>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
