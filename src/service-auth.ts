import { timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { config } from './config.js';

export function requireServiceAuth(req: Request, res: Response, next: NextFunction): void {
  if (!config.FINTRACK_MCP_SERVICE_TOKEN) {
    res.status(503).json({
      error: {
        code: 'SERVICE_AUTH_NOT_CONFIGURED',
        message: 'MCP service authentication is not configured',
      },
    });
    return;
  }
  const auth = req.headers.authorization ?? '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : '';
  const header = req.headers['x-fintrack-service-token'];
  const token = compactSecret(bearer || (Array.isArray(header) ? header[0] : header) || '');
  if (!constantTimeEquals(token, config.FINTRACK_MCP_SERVICE_TOKEN)) {
    res.status(401).json({
      error: {
        code: 'SERVICE_UNAUTHENTICATED',
        message: 'Invalid MCP service credentials',
      },
    });
    return;
  }
  next();
}

function compactSecret(value: string): string {
  return value.replace(/\s+/g, '');
}

function constantTimeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
