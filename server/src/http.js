export class HttpError extends Error {
  constructor(status, message, code = 'REQUEST_ERROR') {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}

export function sendJson(response, status, body, headers = {}) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  });
  response.end(JSON.stringify(body));
}

export async function readJsonBody(request, maxBytes = 24 * 1024) {
  const contentType = request.headers['content-type'] || '';
  if (!contentType.includes('application/json')) {
    throw new HttpError(415, 'JSON 형식으로 요청해 주세요.', 'UNSUPPORTED_MEDIA_TYPE');
  }

  const chunks = [];
  let receivedBytes = 0;

  for await (const chunk of request) {
    receivedBytes += chunk.length;
    if (receivedBytes > maxBytes) {
      throw new HttpError(413, '요청 내용이 너무 깁니다.', 'PAYLOAD_TOO_LARGE');
    }
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, '요청 형식이 올바르지 않습니다.', 'INVALID_JSON');
  }
}

export function getCorsHeaders(request, allowedOrigins) {
  const origin = request.headers.origin?.replace(/\/$/, '');
  if (!origin || !allowedOrigins.includes(origin)) return {};

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}
