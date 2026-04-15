import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
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
  TextField,
  Typography
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import type { HomeCarouselSlide } from '../types';

type ImageMode = 'url' | 'file';

interface SlideForm {
  title: string;
  subtitle: string;
  sortOrder: number;
  active: boolean;
  imageMode: ImageMode;
  imageUrl: string;
  imageFile: File | null;
  removeImage: boolean;
}

const emptyForm: SlideForm = {
  title: '',
  subtitle: '',
  sortOrder: 0,
  active: true,
  imageMode: 'url',
  imageUrl: '',
  imageFile: null,
  removeImage: false
};

export function AdminCarouselPage() {
  const [slides, setSlides] = useState<HomeCarouselSlide[]>([]);
  const [selectedSlide, setSelectedSlide] = useState<HomeCarouselSlide | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState<SlideForm>(emptyForm);
  const [previewUrl, setPreviewUrl] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [movingSlideId, setMovingSlideId] = useState<number | null>(null);

  async function loadSlides() {
    const response = await api.get<HomeCarouselSlide[]>('/carousel/admin');
    setSlides(response.data);
  }

  useEffect(() => {
    loadSlides();
  }, []);

  useEffect(() => {
    if (form.removeImage) {
      setPreviewUrl('');
      return;
    }

    if (form.imageMode === 'file' && form.imageFile) {
      const objectUrl = URL.createObjectURL(form.imageFile);
      setPreviewUrl(objectUrl);

      return () => URL.revokeObjectURL(objectUrl);
    }

    if (form.imageMode === 'url') {
      setPreviewUrl(form.imageUrl.trim());
      return;
    }

    setPreviewUrl(selectedSlide?.imageUrl || '');
  }, [form.imageMode, form.imageFile, form.imageUrl, form.removeImage, selectedSlide]);

  const openCreate = () => {
    setSelectedSlide(null);
    setForm(emptyForm);
    setPreviewUrl('');
    setError(null);
    setMessage(null);
    setOpenForm(true);
  };

  const openEdit = (slide: HomeCarouselSlide) => {
    setSelectedSlide(slide);
    setForm({
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      sortOrder: slide.sortOrder,
      active: slide.active,
      imageMode: 'url',
      imageUrl: slide.imageUrl,
      imageFile: null,
      removeImage: false
    });
    setPreviewUrl(slide.imageUrl);
    setError(null);
    setMessage(null);
    setOpenForm(true);
  };

  const buildFormData = () => {
    const data = new FormData();

    data.append('title', form.title);
    data.append('subtitle', form.subtitle);
    data.append('sortOrder', String(form.sortOrder));
    data.append('active', String(form.active));
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

  const saveSlide = async () => {
    setError(null);
    setMessage(null);

    try {
      const payload = buildFormData();

      if (selectedSlide) {
        await api.put(`/carousel/admin/${selectedSlide.id}`, payload);
        setMessage('Slide actualizado correctamente.');
      } else {
        await api.post('/carousel/admin', payload);
        setMessage('Slide creado correctamente.');
      }

      setOpenForm(false);
      setForm(emptyForm);
      setPreviewUrl('');
      await loadSlides();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No fue posible guardar el slide.');
    }
  };

  const deleteSlide = async (slide: HomeCarouselSlide) => {
    if (!window.confirm(`¿Eliminar el slide "${slide.title || 'Sin título'}"?`)) return;

    setError(null);
    setMessage(null);

    try {
      await api.delete(`/carousel/admin/${slide.id}`);
      setMessage('Slide eliminado correctamente.');
      await loadSlides();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No fue posible eliminar el slide.');
    }
  };

  const moveSlide = async (slideId: number, direction: 'up' | 'down') => {
    setError(null);
    setMessage(null);
    setMovingSlideId(slideId);

    try {
      const response = await api.patch(`/carousel/admin/${slideId}/move`, {
        direction
      });

      setSlides(response.data.slides);
      setMessage(response.data.message || 'Orden actualizado.');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No fue posible mover el slide.');
    } finally {
      setMovingSlideId(null);
    }
  };

  const activeSlidesCount = useMemo(
    () => slides.filter((slide) => slide.active).length,
    [slides]
  );

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ md: 'center' }}
      >
        <Stack>
          <Typography variant="h3">Carrusel principal</Typography>
          <Typography color="text.secondary">
            Sube imágenes para mostrarlas en la portada de la tienda.
          </Typography>
        </Stack>

        <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={openCreate}>
          Nuevo slide
        </Button>
      </Stack>

      {message && <Alert severity="success">{message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Total slides
              </Typography>
              <Typography variant="h5" fontWeight={800}>
                {slides.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Slides activos
              </Typography>
              <Typography variant="h5" fontWeight={800}>
                {activeSlidesCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {slides.map((slide, index) => (
          <Grid item xs={12} md={6} lg={4} key={slide.id}>
            <Card sx={{ height: '100%' }}>
              <Box
                component="img"
                src={slide.imageUrl}
                alt={slide.title || 'Slide'}
                sx={{ width: '100%', height: 220, objectFit: 'cover' }}
              />

              <CardContent>
                <Stack spacing={1.2}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip
                      label={slide.active ? 'Activo' : 'Inactivo'}
                      color={slide.active ? 'success' : 'default'}
                    />
                    <Chip label={`Orden: ${index + 1}`} variant="outlined" />
                  </Stack>

                  <Typography variant="h6">
                    {slide.title || 'Sin título'}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    {slide.subtitle || 'Sin subtítulo'}
                  </Typography>

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => openEdit(slide)}
                    >
                      Editar
                    </Button>

                    <Button
                      color="error"
                      variant="outlined"
                      startIcon={<DeleteIcon />}
                      onClick={() => deleteSlide(slide)}
                    >
                      Eliminar
                    </Button>
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    <IconButton
                      color="primary"
                      onClick={() => moveSlide(slide.id, 'up')}
                      disabled={index === 0 || movingSlideId === slide.id}
                    >
                      <ArrowUpwardIcon />
                    </IconButton>

                    <IconButton
                      color="primary"
                      onClick={() => moveSlide(slide.id, 'down')}
                      disabled={index === slides.length - 1 || movingSlideId === slide.id}
                    >
                      <ArrowDownwardIcon />
                    </IconButton>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedSlide ? 'Editar slide' : 'Crear slide'}</DialogTitle>

        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              fullWidth
              label="Título"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <TextField
              fullWidth
              label="Subtítulo"
              multiline
              minRows={2}
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
              }
              label="Activo"
            />

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

            {selectedSlide?.imageUrl && (
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
                  width: '100%',
                  maxHeight: 380,
                  objectFit: 'cover',
                  borderRadius: 1,
                  border: '1px solid #ddd'
                }}
              />
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Cancelar</Button>
          <Button variant="contained" onClick={saveSlide}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}