import { HttpError } from '../http.js';

export function createRateLimiter({ windowMs, maxRequests }) {
  const clients = new Map();

  return request => {
    const now = Date.now();
    const clientKey = request.socket.remoteAddress || 'unknown';
    const current = clients.get(clientKey);

    if (!current || current.resetAt <= now) {
      clients.set(clientKey, { count: 1, resetAt: now + windowMs });
      return;
    }

    current.count += 1;
    if (current.count > maxRequests) {
      throw new HttpError(429, '잠시 후 다시 문의해 주세요.', 'RATE_LIMITED');
    }
  };
}
