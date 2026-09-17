import { HttpError, readJsonBody, sendJson } from '../http.js';
import { answerConversation, getConversationMessages } from '../services/chat-service.js';
import { LlmServiceError } from '../services/llm/lm-studio-client.js';

export async function handleChat(request, response, corsHeaders, rateLimit) {
  try {
    rateLimit(request);
    const payload = await readJsonBody(request);
    const messages = getConversationMessages(payload);
    const result = await answerConversation(messages);
    sendJson(response, 200, result, corsHeaders);
  } catch (error) {
    if (error instanceof HttpError) {
      sendJson(response, error.status, { error: { code: error.code, message: error.message } }, corsHeaders);
      return;
    }

    if (error instanceof LlmServiceError) {
      console.error('LLM chat request failed:', error.message);
      sendJson(response, 502, {
        error: {
          code: 'LLM_UNAVAILABLE',
          message: 'AI 상담 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.',
        },
      }, corsHeaders);
      return;
    }

    console.error('Unexpected chat API error:', error);
    sendJson(response, 500, {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'AI 상담 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      },
    }, corsHeaders);
  }
}
