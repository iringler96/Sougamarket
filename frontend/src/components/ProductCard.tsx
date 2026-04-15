import {
  Box,
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
import SellIcon from '@mui/icons-material/Sell';
import type { Product } from '../types';

interface Props {
  product: Product;
  onAdd: (product: Product) => void;
}

function hasValidOffer(product: Product) {
  return (
    !!product.offerEnabled &&
    !!product.offerPrice &&
    product.offerPrice > 0 &&
    product.offerPrice < product.price
  );
}

function getDiscountPercentage(price: number, offerPrice: number) {
  return Math.round(((price - offerPrice) / price) * 100);
}

function getSavings(price: number, offerPrice: number) {
  return price - offerPrice;
}

export function ProductCard({ product, onAdd }: Props) {
  const hasOffer = hasValidOffer(product);
  const discountPercentage = hasOffer ? getDiscountPercentage(product.price, product.offerPrice!) : 0;
  const savings = hasOffer ? getSavings(product.price, product.offerPrice!) : 0;

  return (
    <Card
      sx={{
        height: '100%',
        minHeight: 520,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: 1,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)'
        }
      }}
    >
      <CardMedia
        component="img"
        image={product.imageUrl || 'https://via.placeholder.com/800x600?text=Producto'}
        alt={product.name}
        sx={{
          height: 220,
          width: '100%',
          objectFit: 'cover',
          flexShrink: 0
        }}
      />

      <CardContent
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          p: 2
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          mb={1.2}
          flexWrap="wrap"
          useFlexGap
          sx={{ minHeight: 32, alignContent: 'flex-start' }}
        >
          <Chip label={product.category} size="small" color="primary" variant="outlined" />

          {product.requiresAgeCheck && (
            <Chip icon={<LocalBarIcon />} label="+18" size="small" color="secondary" />
          )}

          {hasOffer && (
            <Chip
              icon={<SellIcon />}
              label={`-${discountPercentage}%`}
              size="small"
              color="error"
            />
          )}
        </Stack>

        <Typography
          variant="h6"
          gutterBottom
          sx={{
            lineHeight: 1.2,
            minHeight: 58,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {product.name}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            minHeight: 48,
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {product.description}
        </Typography>

        <Box sx={{ minHeight: 62, mb: 1.5 }}>
          {hasOffer ? (
            <Stack spacing={0.6}>
              <Stack direction="row" spacing={1.2} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography
                  variant="body1"
                  sx={{
                    textDecoration: 'line-through',
                    color: 'text.secondary'
                  }}
                >
                  ${product.price.toLocaleString('es-CL')}
                </Typography>

                <Typography variant="h5" color="error.main" fontWeight={800}>
                  ${product.offerPrice!.toLocaleString('es-CL')}
                </Typography>
              </Stack>

              <Typography variant="body2" color="success.main" fontWeight={700}>
                Ahorras ${savings.toLocaleString('es-CL')}
              </Typography>
            </Stack>
          ) : (
            <Typography variant="h5" color="primary.main" fontWeight={800}>
              ${product.price.toLocaleString('es-CL')}
            </Typography>
          )}
        </Box>

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 'auto' }}>
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