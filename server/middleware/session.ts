import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

interface SessionData {
  id: string;
  createdAt: number;
  lastAccessed: number;
}

const sessions = new Map<string, SessionData>();
const SESSION_TIMEOUT = 30 * 60 * 1000;

function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex');
}

function cleanExpiredSessions(): void {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.lastAccessed > SESSION_TIMEOUT) {
      sessions.delete(sessionId);
    }
  }
}

setInterval(cleanExpiredSessions, 5 * 60 * 1000);

export function sessionMiddleware(req: Request, res: Response, next: NextFunction): void {
  let sessionId = req.cookies.sessionId;

  if (!sessionId || !sessions.has(sessionId)) {
    sessionId = generateSessionId();
    const sessionData: SessionData = {
      id: sessionId,
      createdAt: Date.now(),
      lastAccessed: Date.now()
    };
    sessions.set(sessionId, sessionData);

    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_TIMEOUT
    });
  } else {
    const session = sessions.get(sessionId)!;
    session.lastAccessed = Date.now();
    sessions.set(sessionId, session);
  }

  (req as any).sessionId = sessionId;
  next();
}
