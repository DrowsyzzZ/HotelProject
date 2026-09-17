import { env } from '../../config/env.js';

export class LlmServiceError extends Error {
  constructor(message, { cause } = {}) {
    super(message, { cause });
    this.name = 'LlmServiceError';
  }
}

function getCompletionContent(payload) {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new LlmServiceError('LLM 응답 형식이 올바르지 않습니다.');
  }
  return content.trim();
}

export async function createChatCompletion(messages) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.llmRequestTimeoutMs);
  const headers = { 'Content-Type': 'application/json' };

  if (env.llmApiKey) headers.Authorization = `Bearer ${env.llmApiKey}`;

  try {
    const response = await fetch(`${env.llmBaseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: env.llmModel,
        messages,
        temperature: env.llmTemperature,
        max_tokens: env.llmMaxTokens,
        stream: false,
      }),
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      // A non-JSON upstream response is handled below as a generic service error.
    }

    if (!response.ok) {
      throw new LlmServiceError(payload?.error?.message || 'LLM 서버가 요청을 처리하지 못했습니다.');
    }

    return getCompletionContent(payload);
  } catch (error) {
    if (error instanceof LlmServiceError) throw error;
    if (error.name === 'AbortError') {
      throw new LlmServiceError('LLM 응답 시간이 초과되었습니다.', { cause: error });
    }
    throw new LlmServiceError('LLM 서버에 연결할 수 없습니다.', { cause: error });
  } finally {
    clearTimeout(timeout);
  }
}
