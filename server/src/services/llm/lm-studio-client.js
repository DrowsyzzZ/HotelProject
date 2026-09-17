import { env } from '../../config/env.js';

export class LlmServiceError extends Error {
  constructor(message, { cause } = {}) {
    super(message, { cause });
    this.name = 'LlmServiceError';
  }
}

function getAssistantMessage(payload) {
  const message = payload?.choices?.[0]?.message;
  if (!message || typeof message !== 'object') {
    throw new LlmServiceError('LLM 응답 형식이 올바르지 않습니다.');
  }

  return message;
}

function getCompletionContent(message) {
  const content = message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new LlmServiceError('LLM 응답 형식이 올바르지 않습니다.');
  }
  return content.trim();
}

function normalizeToolCalls(message) {
  if (!Array.isArray(message.tool_calls)) return [];

  return message.tool_calls
    .filter(toolCall => (
      toolCall?.type === 'function'
      && typeof toolCall.id === 'string'
      && typeof toolCall.function?.name === 'string'
      && typeof toolCall.function?.arguments === 'string'
    ))
    .map(toolCall => ({
      id: toolCall.id,
      type: 'function',
      function: {
        name: toolCall.function.name,
        arguments: toolCall.function.arguments,
      },
    }));
}

async function requestChatCompletion(messages, { tools = [], toolChoice } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.llmRequestTimeoutMs);
  const headers = { 'Content-Type': 'application/json' };

  if (env.llmApiKey) headers.Authorization = `Bearer ${env.llmApiKey}`;

  try {
    const requestBody = {
      model: env.llmModel,
      messages,
      temperature: env.llmTemperature,
      max_tokens: env.llmMaxTokens,
      stream: false,
    };

    if (tools.length > 0) requestBody.tools = tools;
    if (toolChoice) requestBody.tool_choice = toolChoice;

    const response = await fetch(`${env.llmBaseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify(requestBody),
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

    return getAssistantMessage(payload);
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

export async function createChatCompletion(messages) {
  return getCompletionContent(await requestChatCompletion(messages));
}

export async function createToolAwareChatCompletion(messages, options = {}) {
  const message = await requestChatCompletion(messages, options);
  const toolCalls = normalizeToolCalls(message);

  if (toolCalls.length === 0 && (typeof message.content !== 'string' || !message.content.trim())) {
    throw new LlmServiceError('LLM 응답 형식이 올바르지 않습니다.');
  }

  return {
    content: typeof message.content === 'string' ? message.content.trim() : '',
    toolCalls,
  };
}
