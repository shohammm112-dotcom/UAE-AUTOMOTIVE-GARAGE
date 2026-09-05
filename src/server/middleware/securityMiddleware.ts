import helmet from 'helmet';
import cors from 'cors';
import { Request, Response, NextFunction } from 'express';

export function createSecurityMiddleware() {
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

      if (process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }

      return callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
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
