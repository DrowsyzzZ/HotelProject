import { createServer } from 'node:http';
import { env } from './config/env.js';
import { getCorsHeaders, sendJson } from './http.js';
import { createRateLimiter } from './middleware/rate-limit.js';
import { handleChat } from './routes/chat.js';

const rateLimit = createRateLimiter({
  windowMs: env.rateLimitWindowMs,
  maxRequests: env.rateLimitMaxRequests,
});

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  const corsHeaders = getCorsHeaders(request, env.allowedOrigins);

  if (request.method === 'OPTIONS') {
    response.writeHead(204, corsHeaders);
    response.end();
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/health') {
    sendJson(response, 200, { status: 'ok' }, corsHeaders);
    return;
  }

  if (request.method === 'POST' && requestUrl.pathname === '/api/chat') {
    await handleChat(request, response, corsHeaders, rateLimit);
    return;
  }

  sendJson(response, 404, {
    error: { code: 'NOT_FOUND', message: '요청한 API를 찾을 수 없습니다.' },
  }, corsHeaders);
});

server.listen(env.port, env.host, () => {
  console.log(`Hotel chat API is listening on http://${env.host}:${env.port}`);
});

function stopServer(signal) {
  console.log(`${signal} received. Stopping Hotel chat API...`);
  server.close(error => {
    if (error) {
      console.error('Hotel chat API did not stop cleanly:', error);
      process.exitCode = 1;
    }
    process.exit();
  });

  setTimeout(() => process.exit(1), 10000).unref();
}

process.once('SIGINT', () => stopServer('SIGINT'));
process.once('SIGTERM', () => stopServer('SIGTERM'));
