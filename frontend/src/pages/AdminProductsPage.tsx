import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import InventoryIcon from '@mui/icons-material/Inventory';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
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

type ImageMode = 'url' | 'file';

interface ProductForm {
  name: string;
  description: string;
  category: string;
  brand: string;
  price: number;
  offerPrice: number | '';
  offerEnabled: boolean;
  stock: number;
  lowStockThreshold: number;
  imageMode: ImageMode;
  imageUrl: string;
  imageFile: File | null;
  removeImage: boolean;
  active: boolean;
  requiresAgeCheck: boolean;
}

const emptyForm: ProductForm = {
  name: '',
  description: '',
  category: '',
  brand: '',
  price: 0,
  offerPrice: '',
  offerEnabled: false,
  stock: 0,
  lowStockThreshold: 5,
  imageMode: 'url',
  imageUrl: '',
  imageFile: null,
  removeImage: false,
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
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const [selectedCategoryForBulkOffer, setSelectedCategoryForBulkOffer] = useState('');
  const [bulkOfferLoading, setBulkOfferLoading] = useState(false);

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))),
    [products]
  );

  async function loadProducts() {
    const response = await api.get<Product[]>('/admin/products');
    setProducts(response.data);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (form.removeImage) {
      setPreviewUrl('');
      return;
    }

    if (form.imageMode === 'file' && form.imageFile) {
      const objectUrl = URL.createObjectURL(form.imageFile);
      setPreviewUrl(objectUrl);

      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }

    if (form.imageMode === 'url') {
      setPreviewUrl(form.imageUrl.trim());
      return;
    }

    setPreviewUrl(selectedProduct?.imageUrl || '');
  }, [form.imageMode, form.imageFile, form.imageUrl, form.removeImage, selectedProduct]);

  const openCreate = () => {
    setSelectedProduct(null);
    setForm(emptyForm);
    setPreviewUrl('');
    setError(null);
    setMessage(null);
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
      offerPrice: product.offerPrice ?? '',
      offerEnabled: product.offerEnabled,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold,
      imageMode: 'url',
      imageUrl: product.imageUrl || '',
      imageFile: null,
      removeImage: false,
      active: product.active,
      requiresAgeCheck: product.requiresAgeCheck
    });
    setPreviewUrl(product.imageUrl || '');
    setError(null);
    setMessage(null);
    setOpenForm(true);
  };

  const buildFormData = () => {
    const data = new FormData();

    data.append('name', form.name);
    data.append('description', form.description);
    data.append('category', form.category);
    data.append('brand', form.brand);
    data.append('price', String(form.price));
    data.append('offerPrice', form.offerPrice === '' ? '' : String(form.offerPrice));
    data.append('offerEnabled', String(form.offerEnabled));
    data.append('stock', String(form.stock));
    data.append('lowStockThreshold', String(form.lowStockThreshold));
    data.append('active', String(form.active));
    data.append('requiresAgeCheck', String(form.requiresAgeCheck));
    data.append('imageMode', form.imageMode);
    data.append('removeImage', String(form.removeImage));

    if (form.imageMode === 'url') {
      data.append('imageUrl', form.imageUrl);
    }

    if (form.imageMode === 'file' && form.imageFile) {
      data.append('imageFile', form.imageFile);
    }

    return data;
  };

  const saveProduct = async () => {
    setError(null);
    setMessage(null);

    try {
      const payload = buildFormData();

      if (selectedProduct) {
        await api.put(`/admin/products/${selectedProduct.id}`, payload);
        setMessage('Producto actualizado correctamente.');
      } else {
        await api.post('/admin/products', payload);
        setMessage('Producto creado correctamente.');
      }

      setOpenForm(false);
      setForm(emptyForm);
      setPreviewUrl('');
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

  const toggleCategoryOffer = async (enabled: boolean) => {
    if (!selectedCategoryForBulkOffer) {
      setError('Debes seleccionar una categoría.');
      return;
    }

    setError(null);
    setMessage(null);
    setBulkOfferLoading(true);

    try {
      const response = await api.patch('/admin/products/category-offer', {
        category: selectedCategoryForBulkOffer,
        enabled
      });

      setMessage(response.data.message || 'Cambio aplicado correctamente.');
      await loadProducts();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'No fue posible actualizar la oferta de la categoría.'
      );
    } finally {
      setBulkOfferLoading(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ md: 'center' }}
      >
        <Stack>
          <Typography variant="h3">Productos</Typography>
          <Typography color="text.secondary">
            Crea productos, edítalos, ajusta stock y controla ofertas por producto o categoría.
          </Typography>
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
                <Typography variant="body2" color="text.secondary">
                  Categoría
                </Typography>
                <Typography variant="h6">{category}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">Ofertas por categoría</Typography>
            <Typography color="text.secondary">
              Activa o desactiva el precio oferta en todos los productos de una categoría.
            </Typography>

            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Categoría</InputLabel>
                  <Select
                    value={selectedCategoryForBulkOffer}
                    label="Categoría"
                    onChange={(e) => setSelectedCategoryForBulkOffer(e.target.value)}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <Button
                  fullWidth
                  variant="contained"
                  color="error"
                  disabled={!selectedCategoryForBulkOffer || bulkOfferLoading}
                  onClick={() => toggleCategoryOffer(true)}
                >
                  {bulkOfferLoading ? 'Procesando...' : 'Activar ofertas categoría'}
                </Button>
              </Grid>

              <Grid item xs={12} md={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  disabled={!selectedCategoryForBulkOffer || bulkOfferLoading}
                  onClick={() => toggleCategoryOffer(false)}
                >
                  {bulkOfferLoading ? 'Procesando...' : 'Desactivar ofertas categoría'}
                </Button>
              </Grid>
            </Grid>
          </Stack>
        </CardContent>
      </Card>

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
              {products.map((product) => {
                const hasOffer =
                  !!product.offerEnabled &&
                  !!product.offerPrice &&
                  product.offerPrice > 0 &&
                  product.offerPrice < product.price;

                return (
                  <TableRow key={product.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={2} alignItems="center">
                        {product.imageUrl && (
                          <Box
                            component="img"
                            src={product.imageUrl}
                            alt={product.name}
                            sx={{
                              width: 56,
                              height: 56,
                              objectFit: 'cover',
                              borderRadius: 2,
                              border: '1px solid #eee'
                            }}
                          />
                        )}

                        <Stack>
                          <Typography fontWeight={700}>{product.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {product.brand || 'Sin marca'}
                          </Typography>
                        </Stack>
                      </Stack>
                    </TableCell>

                    <TableCell>{product.category}</TableCell>

                    <TableCell>
                      {hasOffer ? (
                        <Stack spacing={0.2}>
                          <Typography
                            variant="body2"
                            sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
                          >
                            ${product.price.toLocaleString('es-CL')}
                          </Typography>
                          <Typography color="error.main" fontWeight={700}>
                            ${product.offerPrice!.toLocaleString('es-CL')}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography>${product.price.toLocaleString('es-CL')}</Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={product.stock}
                        color={product.stock <= product.lowStockThreshold ? 'warning' : 'default'}
                      />
                    </TableCell>

                    <TableCell>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip
                          label={product.active ? 'Activo' : 'Inactivo'}
                          color={product.active ? 'success' : 'default'}
                        />
                        <Chip
                          label={product.offerEnabled ? 'Oferta activa' : 'Oferta inactiva'}
                          color={product.offerEnabled ? 'error' : 'default'}
                          variant={product.offerEnabled ? 'filled' : 'outlined'}
                        />
                      </Stack>
                    </TableCell>

                    <TableCell align="right">
                      <IconButton onClick={() => openEdit(product)}>
                        <EditIcon />
                      </IconButton>
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
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedProduct ? 'Editar producto' : 'Crear producto'}</DialogTitle>

        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Nombre"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <TextField
              label="Descripción"
              multiline
              minRows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Categoría"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Marca"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Precio normal"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Precio oferta"
                  value={form.offerPrice}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      offerPrice: e.target.value === '' ? '' : Number(e.target.value)
                    })
                  }
                  helperText="Opcional. Debe ser menor al precio normal."
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.offerEnabled}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          offerEnabled: e.target.checked
                        })
                      }
                    />
                  }
                  label="Oferta activa"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Stock"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Stock mínimo"
                  value={form.lowStockThreshold}
                  onChange={(e) => setForm({ ...form, lowStockThreshold: Number(e.target.value) })}
                />
              </Grid>
            </Grid>

            <FormControl fullWidth>
              <InputLabel>Tipo de imagen</InputLabel>
              <Select
                value={form.imageMode}
                label="Tipo de imagen"
                onChange={(e) =>
                  setForm({
                    ...form,
                    imageMode: e.target.value as ImageMode,
                    imageFile: null
                  })
                }
              >
                <MenuItem value="url">URL</MenuItem>
                <MenuItem value="file">Archivo</MenuItem>
              </Select>
            </FormControl>

            {form.imageMode === 'url' ? (
              <TextField
                fullWidth
                label="URL de imagen"
                value={form.imageUrl}
                onChange={(e) =>
                  setForm({
                    ...form,
                    imageUrl: e.target.value,
                    removeImage: false
                  })
                }
              />
            ) : (
              <Button variant="outlined" component="label">
                Seleccionar imagen
                <input
                  hidden
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      imageFile: e.target.files?.[0] ?? null,
                      removeImage: false
                    })
                  }
                />
              </Button>
            )}

            {selectedProduct?.imageUrl && (
              <FormControlLabel
                control={
                  <Switch
                    checked={form.removeImage}
                    onChange={(e) => setForm({ ...form, removeImage: e.target.checked })}
                  />
                }
                label="Quitar imagen actual"
              />
            )}

            {previewUrl && (
              <Box
                component="img"
                src={previewUrl}
                alt="Vista previa"
                sx={{
                  width: 180,
                  height: 180,
                  objectFit: 'cover',
                  borderRadius: 2,
                  border: '1px solid #ddd'
                }}
              />
            )}

            <Stack direction="row" spacing={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  />
                }
                label="Activo"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={form.requiresAgeCheck}
                    onChange={(e) => setForm({ ...form, requiresAgeCheck: e.target.checked })}
                  />
                }
                label="Requiere +18"
              />
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Cancelar</Button>
          <Button variant="contained" onClick={saveProduct}>
            Guardar
          </Button>
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
          <Button variant="contained" onClick={adjustStock}>
            Actualizar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}