import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import session, { Store } from 'express-session';
import { SESSION_STORE_KEY } from './redis/redis.module';

@Injectable()
export class SessionMiddleware implements NestMiddleware {
  constructor(
    @Inject(SESSION_STORE_KEY) private readonly sessionStore: session.Store,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    session({
      store: this.sessionStore,
      secret: process.env.SESSION_SECRET || 'your-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30000, // 30 seconds, adjust as needed
      },
    })(req, res, next);
  }
}
