function requiredText(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} 환경변수가 필요합니다.`);
  return value;
}

function optionalInteger(name, fallback, { min, max }) {
  const value = process.env[name]?.trim();
  if (!value) return fallback;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${name} 환경변수는 ${min}~${max} 사이의 정수여야 합니다.`);
  }
  return parsed;
}

function optionalNumber(name, fallback, { min, max }) {
  const value = process.env[name]?.trim();
  if (!value) return fallback;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(`${name} 환경변수는 ${min}~${max} 사이의 숫자여야 합니다.`);
  }
  return parsed;
}

function parseOrigins() {
  const origins = requiredText('CORS_ORIGINS')
    .split(',')
    .map(origin => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

  if (origins.length === 0) throw new Error('CORS_ORIGINS 환경변수에 허용할 출처를 입력해 주세요.');

  return origins;
}

function parseLlmBaseUrl() {
  const baseUrl = requiredText('LLM_BASE_URL').replace(/\/$/, '');
  let parsed;

  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new Error('LLM_BASE_URL 환경변수는 올바른 URL이어야 합니다.');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('LLM_BASE_URL 환경변수는 http 또는 https URL이어야 합니다.');
  }

  return baseUrl;
}

export const env = Object.freeze({
  port: optionalInteger('PORT', 3001, { min: 1, max: 65535 }),
  host: process.env.HOST?.trim() || '127.0.0.1',
  allowedOrigins: parseOrigins(),
  llmBaseUrl: parseLlmBaseUrl(),
  llmModel: requiredText('LLM_MODEL'),
  llmApiKey: process.env.LLM_API_KEY?.trim() || '',
  llmRequestTimeoutMs: optionalInteger('LLM_REQUEST_TIMEOUT_MS', 30000, { min: 1000, max: 120000 }),
  llmTemperature: optionalNumber('LLM_TEMPERATURE', 0.4, { min: 0, max: 2 }),
  llmMaxTokens: optionalInteger('LLM_MAX_TOKENS', 2048, { min: 64, max: 8192 }),
  rateLimitWindowMs: optionalInteger('CHAT_RATE_LIMIT_WINDOW_MS', 60000, { min: 1000, max: 3600000 }),
  rateLimitMaxRequests: optionalInteger('CHAT_RATE_LIMIT_MAX_REQUESTS', 30, { min: 1, max: 1000 }),
});
