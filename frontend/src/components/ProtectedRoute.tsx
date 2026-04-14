import { CircularProgress, Stack } from '@mui/material';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';

export function ProtectedRoute({
  children,
  role
}: {
  children: JSX.Element;
  role?: UserRole;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Stack minHeight="60vh" alignItems="center" justifyContent="center">
        <CircularProgress />
      </Stack>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}
