import type { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        role: Role;
        email: string;
      };
    }
  }
}

export {};
