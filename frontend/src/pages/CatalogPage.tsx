import SearchIcon from '@mui/icons-material/Search';
import {
  Alert,
  CircularProgress,
  Grid,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { ProductCard } from '../components/ProductCard';
import { useCart } from '../contexts/CartContext';
import type { Product } from '../types';

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
          Explora productos, filtra categorías y agrégalos al carrito con control de stock.
        </Typography>
      </Stack>

      {message && <Alert severity="success" onClose={() => setMessage(null)}>{message}</Alert>}

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
    </Stack>
  );
}
