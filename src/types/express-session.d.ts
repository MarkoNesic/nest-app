import session from 'express-session';

declare module 'express-session' {
  interface SessionData {
    user: { id: string; username: string; role: string }; // Customize according to your user object
  }
}

declare module 'express' {
  interface Request {
    session: session.Session & Partial<session.SessionData>;
  }
}
