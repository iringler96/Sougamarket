import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  Stack,
  Typography
} from '@mui/material';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import type { Product } from '../types';

interface Props {
  product: Product;
  onAdd: (product: Product) => void;
}

export function ProductCard({ product, onAdd }: Props) {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardMedia
        component="img"
        height="220"
        image={product.imageUrl || 'https://via.placeholder.com/800x600?text=Producto'}
        alt={product.name}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack direction="row" spacing={1} mb={1} flexWrap="wrap" useFlexGap>
          <Chip label={product.category} size="small" color="primary" variant="outlined" />
          {product.requiresAgeCheck && (
            <Chip icon={<LocalBarIcon />} label="+18" size="small" color="secondary" />
          )}
        </Stack>
        <Typography variant="h6" gutterBottom>
          {product.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          {product.description}
        </Typography>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" color="primary.main" fontWeight={800}>
            ${product.price.toLocaleString('es-CL')}
          </Typography>
          <Chip
            icon={<Inventory2Icon />}
            label={`Stock: ${product.stock}`}
            size="small"
            color={product.stock <= product.lowStockThreshold ? 'warning' : 'default'}
          />
        </Stack>
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          variant="contained"
          fullWidth
          disabled={product.stock === 0}
          onClick={() => onAdd(product)}
        >
          {product.stock === 0 ? 'Sin stock' : 'Agregar al carrito'}
        </Button>
      </CardActions>
    </Card>
  );
}
