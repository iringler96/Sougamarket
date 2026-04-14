import SearchIcon from '@mui/icons-material/Search';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import {
  Alert,
  CircularProgress,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { ProductCard } from '../components/ProductCard';
import { useCart } from '../contexts/CartContext';
import type { Product } from '../types';

function hasValidOffer(product: Product) {
  return (
    !!product.offerEnabled &&
    !!product.offerPrice &&
    product.offerPrice > 0 &&
    product.offerPrice < product.price
  );
}

export function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);

      const [productsResponse, categoriesResponse] = await Promise.all([
        api.get<Product[]>('/products'),
        api.get<string[]>('/products/categories')
      ]);

      setProducts(productsResponse.data);
      setCategories(categoriesResponse.data);
      setLoading(false);
    }

    loadInitialData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = category ? product.category === category : true;
      const term = search.toLowerCase();

      const matchesSearch = term
        ? [product.name, product.description, product.category, product.brand || '']
            .join(' ')
            .toLowerCase()
            .includes(term)
        : true;

      return matchesCategory && matchesSearch;
    });
  }, [products, search, category]);

  const offersCount = useMemo(
    () => filteredProducts.filter((product) => hasValidOffer(product)).length,
    [filteredProducts]
  );

  if (loading) {
    return (
      <Stack minHeight="50vh" alignItems="center" justifyContent="center">
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography variant="h2">Catálogo</Typography>
        <Typography color="text.secondary">
          Explora productos, filtra categorías y aprovecha las ofertas disponibles.
        </Typography>
      </Stack>

      {message && (
        <Alert severity="success" onClose={() => setMessage(null)}>
          {message}
        </Alert>
      )}

      <Paper sx={{ p: 2.5, borderRadius: 4 }}>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ md: 'center' }}
            spacing={1.5}
          >
            <Stack>
              <Typography variant="h6">Resultados</Typography>
              <Typography variant="body2" color="text.secondary">
                {filteredProducts.length} productos encontrados
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <LocalOfferIcon color="error" fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                {offersCount} producto{offersCount !== 1 ? 's' : ''} en oferta
              </Typography>
            </Stack>
          </Stack>

          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="Buscar por nombre, marca o categoría"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Categoría"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {categories.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Stack>
      </Paper>

      {filteredProducts.length === 0 ? (
        <Paper sx={{ p: 4, borderRadius: 4 }}>
          <Stack spacing={1} alignItems="center">
            <Typography variant="h6">No se encontraron productos</Typography>
            <Typography color="text.secondary">
              Prueba con otro término de búsqueda o cambia la categoría.
            </Typography>
          </Stack>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredProducts.map((product) => (
            <Grid item xs={12} sm={6} lg={4} key={product.id}>
              <ProductCard
                product={product}
                onAdd={(selected) => {
                  addToCart(selected);
                  setMessage(`${selected.name} se agregó al carrito.`);
                }}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Stack>
  );
}