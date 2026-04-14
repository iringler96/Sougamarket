import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secreto-cambiar';

export function generateToken(payload: { userId: number; role: Role; email: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as { userId: number; role: Role; email: string };
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
