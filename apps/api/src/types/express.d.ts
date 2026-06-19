// Augment Express's Request with the authenticated user attached by the
// authenticate middleware. Importing this type info happens automatically via
// tsconfig "include": src/**/*.ts.
import 'express';

export interface AuthUser {
  id: string;
  email: string;
  role: 'customer' | 'admin';
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
