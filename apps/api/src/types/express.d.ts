import { AdminRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: number;
        email: string;
        name: string;
        role: AdminRole;
      };
    }
  }
}

export {};
