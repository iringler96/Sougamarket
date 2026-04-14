import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

export function CartPage() {
  const { items, total, increase, decrease, remove, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState('Av. Alemania 100, Temuco');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkout = async () => {
    if (!user) {
      navigate('/login', { state: { from: '/carrito' } });
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post('/orders', {
        shippingAddress: address,
        items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity }))
      });
      clearCart();
      setSuccess('Compra registrada correctamente. Revisa “Mis órdenes”.');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No fue posible generar la orden.');
    } finally {
      setLoading(false);
    }
  };

  if (!items.length) {
    return (
      <Stack spacing={2} alignItems="flex-start">
        <Typography variant="h2">Tu carrito está vacío</Typography>
        <Typography color="text.secondary">Agrega productos del catálogo para comenzar una compra.</Typography>
        <Button component={RouterLink} to="/catalogo" variant="contained">
          Ir al catálogo
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h2">Carrito de compra</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} alignItems="flex-start">
        <Stack spacing={2} flex={1} width="100%">
          {items.map((item) => (
            <Card key={item.product.id}>
              <CardContent>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ sm: 'center' }}>
                  <Stack>
                    <Typography variant="h6">{item.product.name}</Typography>
                    <Typography color="text.secondary">${item.product.price.toLocaleString('es-CL')} cada uno</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Button variant="outlined" onClick={() => decrease(item.product.id)}>-</Button>
                    <Typography fontWeight={700}>{item.quantity}</Typography>
                    <Button variant="outlined" onClick={() => increase(item.product.id)}>+</Button>
                    <IconButton color="error" onClick={() => remove(item.product.id)}>
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>

        <Card sx={{ width: '100%', maxWidth: 420 }}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h5" fontWeight={800}>Resumen</Typography>
              <TextField
                label="Dirección de despacho"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                multiline
                minRows={2}
              />
              <Divider />
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Subtotal</Typography>
                <Typography>${total.toLocaleString('es-CL')}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Despacho</Typography>
                <Typography>$2.990</Typography>
              </Stack>
              <Divider />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="h6">Total</Typography>
                <Typography variant="h6" color="primary.main">${(total + 2990).toLocaleString('es-CL')}</Typography>
              </Stack>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Demo: la orden se marca como pagada para mostrar el flujo completo. La integración real con Webpay queda lista para la siguiente fase.
                </Typography>
              </Box>
              <Button variant="contained" size="large" onClick={checkout} disabled={loading}>
                {loading ? 'Procesando...' : 'Finalizar compra'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Stack>
  );
}
