import { CHAT_API_BASE_URL } from './runtime-config.js';

const REQUEST_TIMEOUT_MS = 35000;

export class ChatApiError extends Error {
  constructor(message, code = 'CHAT_API_ERROR') {
    super(message);
    this.name = 'ChatApiError';
    this.code = code;
  }
}

function getChatEndpoint() {
  if (!CHAT_API_BASE_URL) {
    throw new ChatApiError('AI 상담 서비스가 아직 연결되지 않았습니다. 잠시 후 다시 시도해 주세요.', 'CHAT_NOT_CONFIGURED');
  }

  try {
    return new URL('/api/chat', `${CHAT_API_BASE_URL.replace(/\/$/, '')}/`).href;
  } catch {
    throw new ChatApiError('AI 상담 서비스 주소 설정이 올바르지 않습니다.', 'INVALID_CHAT_ENDPOINT');
  }
}

export async function requestChatReply(messages) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(getChatEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ messages }),
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      // The generic error below is intentionally shown instead of exposing server details.
    }

    if (!response.ok) {
      throw new ChatApiError(
        payload?.error?.message || 'AI 상담 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
        payload?.error?.code,
      );
    }

    if (typeof payload?.reply !== 'string' || !payload.reply.trim()) {
      throw new ChatApiError('AI 상담 응답을 받지 못했습니다. 잠시 후 다시 시도해 주세요.', 'INVALID_CHAT_RESPONSE');
    }

    return payload.reply.trim();
  } catch (error) {
    if (error instanceof ChatApiError) throw error;
    if (error.name === 'AbortError') {
      throw new ChatApiError('AI 상담 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.', 'CHAT_TIMEOUT');
    }
    throw new ChatApiError('AI 상담 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.', 'CHAT_NETWORK_ERROR');
  } finally {
    window.clearTimeout(timeout);
  }
}
