import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import { Alert, Avatar, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register(name, email, password);
      navigate('/catalogo');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudo crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
      <Paper sx={{ width: '100%', maxWidth: 460, p: 4 }}>
        <Stack alignItems="center" spacing={2} component="form" onSubmit={handleSubmit}>
          <Avatar sx={{ bgcolor: 'secondary.main' }}>
            <PersonAddAlt1Icon />
          </Avatar>
          <Typography variant="h4" fontWeight={800}>
            Crear cuenta
          </Typography>
          {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}
          <TextField fullWidth label="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField fullWidth label="Correo" value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField
            fullWidth
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
            {loading ? 'Creando...' : 'Crear cuenta'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
