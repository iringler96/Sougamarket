import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InsightsIcon from '@mui/icons-material/Insights';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { Box, Button, Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const highlights = [
  {
    title: 'Catálogo listo para vender',
    text: 'Alcoholes y abarrotes con carrito de compra, stock y experiencia móvil.',
    icon: <LocalShippingIcon color="primary" />
  },
  {
    title: 'Panel administrativo',
    text: 'Controla productos, inventario, órdenes y notificaciones en un solo lugar.',
    icon: <VerifiedUserIcon color="primary" />
  },
  {
    title: 'Dashboard comercial',
    text: 'Revisa ventas por productos, ticket promedio y alertas de stock bajo.',
    icon: <InsightsIcon color="primary" />
  }
];

export function HomePage() {
  return (
    <Stack spacing={4}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, rgba(123,31,162,1) 0%, rgba(255,152,0,0.95) 100%)',
          color: 'white',
          p: { xs: 4, md: 6 },
          borderRadius: 5,
          overflow: 'hidden'
        }}
      >
        <Stack spacing={2} maxWidth={700}>
          <Chip label="Starter full stack" sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: 'white', width: 'fit-content' }} />
          <Typography variant="h1">Tienda online lista para alcoholes y abarrotes</Typography>
          <Typography variant="h6" sx={{ opacity: 0.92 }}>
            Base profesional con React, TypeScript, Material UI, Node.js, PostgreSQL y panel admin.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} pt={1}>
            <Button component={RouterLink} to="/catalogo" variant="contained" color="secondary" size="large">
              Ver catálogo
            </Button>
            <Button component={RouterLink} to="/admin" variant="outlined" size="large" sx={{ color: 'white', borderColor: 'white' }}>
              Ir al admin
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {highlights.map((item) => (
          <Grid item xs={12} md={4} key={item.title}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack spacing={1.5}>
                  {item.icon}
                  <Typography variant="h6">{item.title}</Typography>
                  <Typography color="text.secondary">{item.text}</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
