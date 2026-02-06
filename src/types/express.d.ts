// Extension des types Express pour inclure l'utilisateur authentifié

import { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        customRoleId?: string | null;
      };
    }
  }
}

export {};
