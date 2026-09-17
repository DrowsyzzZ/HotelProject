import { HttpError } from '../http.js';
import { createToolAwareChatCompletion, LlmServiceError } from './llm/lm-studio-client.js';
import { HOTEL_READ_TOOLS, hasHotelReadTools, runHotelReadTool } from './hotel-data/hotel-tools.js';
import { getHotelChatSystemPrompt } from './llm/system-prompt.js';

const ALLOWED_ROLES = new Set(['user', 'assistant']);
const MAX_MESSAGE_COUNT = 12;
const MAX_MESSAGE_LENGTH = 1600;
const MAX_TOOL_ROUNDS = 2;

function normalizeMessage(message) {
  if (!message || typeof message !== 'object' || !ALLOWED_ROLES.has(message.role)) {
    throw new HttpError(400, '대화 메시지 형식이 올바르지 않습니다.', 'INVALID_MESSAGE');
  }

  if (typeof message.content !== 'string') {
    throw new HttpError(400, '대화 내용은 텍스트여야 합니다.', 'INVALID_MESSAGE_CONTENT');
  }

  const content = message.content.trim();
  if (!content || content.length > MAX_MESSAGE_LENGTH) {
    throw new HttpError(400, `문의 내용은 1~${MAX_MESSAGE_LENGTH}자로 입력해 주세요.`, 'INVALID_MESSAGE_LENGTH');
  }

  return { role: message.role, content };
}

export function getConversationMessages(payload) {
  if (!Array.isArray(payload?.messages) || payload.messages.length === 0) {
    throw new HttpError(400, '문의 내용을 입력해 주세요.', 'EMPTY_CONVERSATION');
  }

  if (payload.messages.length > MAX_MESSAGE_COUNT) {
    throw new HttpError(400, `최근 ${MAX_MESSAGE_COUNT}개 메시지만 전송할 수 있습니다.`, 'TOO_MANY_MESSAGES');
  }

  const messages = payload.messages.map(normalizeMessage);
  if (messages.at(-1).role !== 'user') {
    throw new HttpError(400, '마지막 메시지는 사용자 문의여야 합니다.', 'INVALID_CONVERSATION_ORDER');
  }

  return messages;
}

export async function answerConversation(messages) {
  const hasLiveHotelData = hasHotelReadTools();
  const tools = hasLiveHotelData ? HOTEL_READ_TOOLS : [];
  const completionMessages = [
    { role: 'system', content: getHotelChatSystemPrompt({ hasLiveHotelData }) },
    ...messages,
  ];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const completion = await createToolAwareChatCompletion(completionMessages, {
      tools,
      toolChoice: tools.length > 0 ? 'auto' : undefined,
    });

    if (completion.toolCalls.length === 0) {
      return { reply: completion.content };
    }

    completionMessages.push({
      role: 'assistant',
      content: completion.content || null,
      tool_calls: completion.toolCalls,
    });

    const toolMessages = await Promise.all(completion.toolCalls.map(async toolCall => {
      let argumentsObject;

      try {
        argumentsObject = JSON.parse(toolCall.function.arguments);
      } catch {
        return {
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify({ ok: false, error: '조회 요청 형식이 올바르지 않습니다.' }),
        };
      }

      return {
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(await runHotelReadTool(toolCall.function.name, argumentsObject)),
      };
    }));

    completionMessages.push(...toolMessages);
  }

  const finalCompletion = await createToolAwareChatCompletion(completionMessages, {
    tools,
    toolChoice: 'none',
  });

  if (finalCompletion.toolCalls.length > 0 || !finalCompletion.content) {
    throw new LlmServiceError('호텔 정보 조회 결과를 정리하지 못했습니다.');
  }

  return { reply: finalCompletion.content };
}
