import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import InventoryIcon from '@mui/icons-material/Inventory';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import type { Product } from '../types';

interface ProductForm {
  name: string;
  description: string;
  category: string;
  brand: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
  imageUrl: string;
  active: boolean;
  requiresAgeCheck: boolean;
}

const emptyForm: ProductForm = {
  name: '',
  description: '',
  category: '',
  brand: '',
  price: 0,
  stock: 0,
  lowStockThreshold: 5,
  imageUrl: '',
  active: true,
  requiresAgeCheck: false
};

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [openStock, setOpenStock] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [stockAdjustment, setStockAdjustment] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))), [products]);

  async function loadProducts() {
    const response = await api.get<Product[]>('/admin/products');
    setProducts(response.data);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const openCreate = () => {
    setSelectedProduct(null);
    setForm(emptyForm);
    setOpenForm(true);
  };

  const openEdit = (product: Product) => {
    setSelectedProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      category: product.category,
      brand: product.brand || '',
      price: product.price,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold,
      imageUrl: product.imageUrl || '',
      active: product.active,
      requiresAgeCheck: product.requiresAgeCheck
    });
    setOpenForm(true);
  };

  const saveProduct = async () => {
    setError(null);
    setMessage(null);
    try {
      if (selectedProduct) {
        await api.put(`/admin/products/${selectedProduct.id}`, form);
        setMessage('Producto actualizado correctamente.');
      } else {
        await api.post('/admin/products', form);
        setMessage('Producto creado correctamente.');
      }
      setOpenForm(false);
      await loadProducts();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No fue posible guardar el producto.');
    }
  };

  const adjustStock = async () => {
    if (!selectedProduct) return;
    setError(null);
    setMessage(null);
    try {
      await api.patch(`/admin/products/${selectedProduct.id}/stock`, {
        quantity: stockAdjustment,
        note: 'Ajuste desde frontend admin'
      });
      setOpenStock(false);
      setStockAdjustment(0);
      setMessage('Stock actualizado correctamente.');
      await loadProducts();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No fue posible actualizar el stock.');
    }
  };

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }}>
        <Stack>
          <Typography variant="h3">Productos</Typography>
          <Typography color="text.secondary">Crea productos, edítalos y ajusta stock manualmente.</Typography>
        </Stack>
        <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={openCreate}>
          Nuevo producto
        </Button>
      </Stack>

      {message && <Alert severity="success">{message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={2}>
        {categories.map((category) => (
          <Grid item xs={12} sm={6} lg={3} key={category}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Categoría</Typography>
                <Typography variant="h6">{category}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Producto</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>Precio</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id} hover>
                  <TableCell>
                    <Stack>
                      <Typography fontWeight={700}>{product.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{product.brand || 'Sin marca'}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>${product.price.toLocaleString('es-CL')}</TableCell>
                  <TableCell>
                    <Chip
                      label={product.stock}
                      color={product.stock <= product.lowStockThreshold ? 'warning' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip label={product.active ? 'Activo' : 'Inactivo'} color={product.active ? 'success' : 'default'} />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => openEdit(product)}><EditIcon /></IconButton>
                    <IconButton
                      onClick={() => {
                        setSelectedProduct(product);
                        setOpenStock(true);
                      }}
                    >
                      <InventoryIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedProduct ? 'Editar producto' : 'Crear producto'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="Descripción" multiline minRows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <TextField label="Categoría" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <TextField label="Marca" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField type="number" label="Precio" fullWidth value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField type="number" label="Stock" fullWidth value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField type="number" label="Stock mínimo" fullWidth value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: Number(e.target.value) })} />
              </Grid>
            </Grid>
            <TextField label="URL imagen" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
            <Stack direction="row" spacing={3}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Switch checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                <Typography>Activo</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Switch checked={form.requiresAgeCheck} onChange={(e) => setForm({ ...form, requiresAgeCheck: e.target.checked })} />
                <Typography>Requiere +18</Typography>
              </Stack>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Cancelar</Button>
          <Button variant="contained" onClick={saveProduct}>Guardar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openStock} onClose={() => setOpenStock(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Ajustar stock</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Typography>
              Producto: <strong>{selectedProduct?.name}</strong>
            </Typography>
            <TextField
              type="number"
              label="Cantidad a sumar/restar"
              value={stockAdjustment}
              onChange={(e) => setStockAdjustment(Number(e.target.value))}
              helperText="Usa positivo para sumar y negativo para descontar."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStock(false)}>Cancelar</Button>
          <Button variant="contained" onClick={adjustStock}>Actualizar</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
