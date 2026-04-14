import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { comparePassword, generateToken, hashPassword } from '../utils/auth.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio.'),
  email: z.string().email('Correo inválido.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.')
});

const loginSchema = z.object({
  email: z.string().email('Correo inválido.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.')
});

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Datos inválidos.' });
  }

  const { name, email, password } = parsed.data;
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    return res.status(400).json({ message: 'Ya existe un usuario con ese correo.' });
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password)
    }
  });

  const token = generateToken({ userId: user.id, role: user.role, email: user.email });

  res.status(201).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Datos inválidos.' });
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(401).json({ message: 'Credenciales inválidas.' });
  }

  const validPassword = await comparePassword(password, user.passwordHash);

  if (!validPassword) {
    return res.status(401).json({ message: 'Credenciales inválidas.' });
  }

  const token = generateToken({ userId: user.id, role: user.role, email: user.email });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

router.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true }
  });

  res.json(user);
});

export default router;
