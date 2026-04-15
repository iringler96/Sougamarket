import { Box, Button, Chip, IconButton, Stack, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Link as RouterLink } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import type { HomeCarouselSlide } from '../types';

export function HomePage() {
  const [slides, setSlides] = useState<HomeCarouselSlide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    async function loadSlides() {
      try {
        const response = await api.get<HomeCarouselSlide[]>('/carousel');
        setSlides(response.data);
      } catch (error) {
        console.error(error);
      }
    }

    loadSlides();
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;

    const interval = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4500);

    return () => window.clearInterval(interval);
  }, [slides]);

  const activeSlide = useMemo(() => slides[currentSlide], [slides, currentSlide]);

  if (!slides.length) {
    return (
      <Stack spacing={4}>
        <Box
          sx={{
            width: '100%',
            maxWidth: 1500,
            mx: 'auto',
            background:
              'linear-gradient(135deg, rgba(123,31,162,1) 0%, rgba(255,152,0,0.95) 100%)',
            color: 'white',
            p: { xs: 4, md: 6 },
            borderRadius: 6,
            overflow: 'hidden',
            minHeight: { xs: 360, md: 520 },
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Stack spacing={2} maxWidth={720}>
            <Chip
              label="Sougamarket"
              sx={{
                bgcolor: 'rgba(255,255,255,0.16)',
                color: 'white',
                width: 'fit-content',
                fontWeight: 700
              }}
            />
            <Typography variant="h1">Tienda online lista para alcoholes y abarrotes</Typography>
            <Typography variant="h6" sx={{ opacity: 0.92 }}>
              Base profesional con React, TypeScript, Material UI, Node.js, PostgreSQL y panel admin.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} pt={1}>
              <Button
                component={RouterLink}
                to="/catalogo"
                variant="contained"
                color="secondary"
                size="large"
              >
                Ver catálogo
              </Button>
              <Button
                component={RouterLink}
                to="/admin"
                variant="outlined"
                size="large"
                sx={{ color: 'white', borderColor: 'white' }}
              >
                Ir al admin
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 1500,
          mx: 'auto',
          borderRadius: 6,
          overflow: 'hidden',
          minHeight: { xs: 360, sm: 440, md: 560, lg: 620 },
          boxShadow: '0 20px 50px rgba(25, 25, 25, 0.12)'
        }}
      >
        <Box
          component="img"
          src={activeSlide.imageUrl}
          alt={activeSlide.title || 'Slide principal'}
          sx={{
            width: '100%',
            height: { xs: 360, sm: 440, md: 560, lg: 620 },
            objectFit: 'cover',
            objectPosition: 'center center',
            display: 'block'
          }}
        />

        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.22) 50%, rgba(0,0,0,0.08) 100%)'
          }}
        />

        <Stack
          spacing={2}
          sx={{
            position: 'absolute',
            left: { xs: 24, md: 40 },
            bottom: { xs: 28, md: 40 },
            maxWidth: { xs: '88%', md: 620 },
            color: 'white'
          }}
        >
          <Chip
            label="Sougamarket"
            sx={{
              bgcolor: 'rgba(255,255,255,0.18)',
              color: 'white',
              width: 'fit-content',
              fontWeight: 700
            }}
          />

          {activeSlide.title && (
            <Typography
              variant="h2"
              sx={{
                color: 'white',
                fontWeight: 800,
                lineHeight: 1.1
              }}
            >
              {activeSlide.title}
            </Typography>
          )}

          {activeSlide.subtitle && (
            <Typography
              variant="h6"
              sx={{
                color: 'rgba(255,255,255,0.94)'
              }}
            >
              {activeSlide.subtitle}
            </Typography>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} pt={1}>
            <Button
              component={RouterLink}
              to="/catalogo"
              variant="contained"
              color="secondary"
              size="large"
            >
              Ver catálogo
            </Button>
            <Button
              component={RouterLink}
              to="/admin"
              variant="outlined"
              size="large"
              sx={{ color: 'white', borderColor: 'white' }}
            >
              Ir al admin
            </Button>
          </Stack>
        </Stack>

        {slides.length > 1 && (
          <>
            <IconButton
              onClick={() =>
                setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
              }
              sx={{
                position: 'absolute',
                top: '50%',
                left: { xs: 10, md: 18 },
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(0,0,0,0.35)',
                color: 'white',
                width: { xs: 40, md: 48 },
                height: { xs: 40, md: 48 },
                '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' }
              }}
            >
              <ChevronLeftIcon />
            </IconButton>

            <IconButton
              onClick={() =>
                setCurrentSlide((prev) => (prev + 1) % slides.length)
              }
              sx={{
                position: 'absolute',
                top: '50%',
                right: { xs: 10, md: 18 },
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(0,0,0,0.35)',
                color: 'white',
                width: { xs: 40, md: 48 },
                height: { xs: 40, md: 48 },
                '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' }
              }}
            >
              <ChevronRightIcon />
            </IconButton>

            <Stack
              direction="row"
              spacing={1}
              sx={{
                position: 'absolute',
                bottom: 18,
                right: 24
              }}
            >
              {slides.map((slide, index) => (
                <Box
                  key={slide.id}
                  onClick={() => setCurrentSlide(index)}
                  sx={{
                    width: index === currentSlide ? 28 : 10,
                    height: 10,
                    borderRadius: 999,
                    bgcolor: index === currentSlide ? 'white' : 'rgba(255,255,255,0.55)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                />
              ))}
            </Stack>
          </>
        )}
      </Box>
    </Stack>
  );
}