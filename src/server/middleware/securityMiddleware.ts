import helmet from 'helmet';
import cors from 'cors';
import { Request, Response, NextFunction } from 'express';
import { RuntimeEnvironment } from '../../infrastructure/config/RuntimeEnvironment.ts';

/**
 * Raised when an Origin is rejected by the CORS policy. Named so that
 * errorHandlerMiddleware can map it to 403; without it the generic `cors`
 * Error fell off the end of the handler's instanceof ladder and every
 * cross-origin browser request in production answered 500.
 */
class CorsOriginNotAllowedError extends Error {
  constructor(origin: string) {
    super(`CORS policy does not allow access from origin: ${origin}`);
    this.name = 'CorsOriginNotAllowedError';
  }
}

export function createSecurityMiddleware() {
  // Fail closed at startup rather than at first request. In production the
  // localhost defaults below match nothing a real browser will send - including
  // the app's own origin - so an unset ALLOWED_ORIGINS means every state-changing
  // request fails. Surfacing that at boot makes it a five-second diagnosis
  // instead of an intermittent-looking runtime fault.
  if (RuntimeEnvironment.isProduction() && !process.env.ALLOWED_ORIGINS?.trim()) {
    throw new Error(
      '[FATAL] Refusing to start: ALLOWED_ORIGINS must be set in production. ' +
        'Provide a comma-separated list of browser origins permitted to call this API.'
    );
  }

  const helmetMiddleware = helmet({
    contentSecurityPolicy: false, // Vite SPA in dev needs inline scripts; frontend serves separate headers
    crossOriginEmbedderPolicy: false,
  });

  const corsMiddleware = cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
        : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173'];

      if (!RuntimeEnvironment.isProduction() || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }

      return callback(new CorsOriginNotAllowedError(origin));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Lightweight in-memory rate limiting to protect sensitive endpoints from abuse
  const requestCounts = new Map<string, { count: number; resetAt: number }>();
  const rateLimitWindowMs = 60 * 1000; // 1 minute
  const maxRequestsPerWindow = 120; // 120 requests per minute per IP

  const rateLimiterMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    // Prevent unbounded memory growth
    if (requestCounts.size > 5000) {
      for (const [k, v] of requestCounts.entries()) {
        if (now > v.resetAt) {
          requestCounts.delete(k);
        }
      }
    }

    const clientRecord = requestCounts.get(ip);

    if (!clientRecord || now > clientRecord.resetAt) {
      requestCounts.set(ip, { count: 1, resetAt: now + rateLimitWindowMs });
      return next();
    }

    clientRecord.count++;
    if (clientRecord.count > maxRequestsPerWindow) {
      const retryAfterSec = Math.max(1, Math.ceil((clientRecord.resetAt - now) / 1000));
      res.setHeader('Retry-After', retryAfterSec.toString());
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please slow down and try again shortly.',
          retryAfterSeconds: retryAfterSec,
        },
      });
    }

    next();
  };

  return {
    helmetMiddleware,
    corsMiddleware,
    rateLimiterMiddleware,
  };
}
