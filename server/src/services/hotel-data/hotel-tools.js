import { env } from '../../config/env.js';
import { createHotelReadService, toSafeHotelToolError } from './hotel-read-service.js';

const hotelReadService = env.supabase
  ? createHotelReadService({ ...env.supabase, requestTimeoutMs: env.supabaseRequestTimeoutMs })
  : null;

export const HOTEL_READ_TOOLS = Object.freeze([
  {
    type: 'function',
    function: {
      name: 'list_room_types',
      description: '현재 호텔에 등록된 객실 종류와 정원, 면적을 조회한다. 객실 종류를 묻는 질문에 사용한다.',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_room_details',
      description: '특정 객실의 면적, 기준/최대 인원, 설명을 조회한다. 객실 이름 또는 영어 이름이 필요하다.',
      parameters: {
        type: 'object',
        properties: {
          room_name: {
            type: 'string',
            description: '예: 스탠다드, 디럭스, 프리미엄, 스위트',
          },
        },
        required: ['room_name'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_room_availability',
      description: '특정 객실이 지정한 입실일~퇴실일 기간에 예약 가능한지 확인한다. 날짜는 YYYY-MM-DD 형식이며, 퇴실일은 숙박일에 포함하지 않는다.',
      parameters: {
        type: 'object',
        properties: {
          room_name: { type: 'string', description: '객실 이름' },
          check_in_date: { type: 'string', description: '입실일, YYYY-MM-DD' },
          check_out_date: { type: 'string', description: '퇴실일, YYYY-MM-DD' },
        },
        required: ['room_name', 'check_in_date', 'check_out_date'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_reservation_quote',
      description: '특정 객실의 지정 기간 예상 요금과 현재 예약 가능 여부를 함께 조회한다. 요금이나 예약 가능 여부를 묻는 질문에 반드시 사용한다.',
      parameters: {
        type: 'object',
        properties: {
          room_name: { type: 'string', description: '객실 이름' },
          check_in_date: { type: 'string', description: '입실일, YYYY-MM-DD' },
          check_out_date: { type: 'string', description: '퇴실일, YYYY-MM-DD' },
          extra_guests: {
            type: 'integer',
            description: '기준 인원 외 추가 아동 인원. 없으면 0.',
            minimum: 0,
            maximum: 2,
          },
        },
        required: ['room_name', 'check_in_date', 'check_out_date'],
        additionalProperties: false,
      },
    },
  },
]);

export function hasHotelReadTools() {
  return hotelReadService !== null;
}

function ensureArguments(argumentsObject) {
  if (!argumentsObject || typeof argumentsObject !== 'object' || Array.isArray(argumentsObject)) {
    throw new Error('조회 도구의 요청 형식이 올바르지 않습니다.');
  }

  return argumentsObject;
}

export async function runHotelReadTool(name, rawArguments) {
  if (!hotelReadService) {
    return { ok: false, error: '현재 실시간 호텔 데이터 조회를 사용할 수 없습니다.' };
  }

  try {
    const args = ensureArguments(rawArguments);
    let data;

    switch (name) {
      case 'list_room_types':
        data = await hotelReadService.listRooms();
        break;
      case 'get_room_details':
        data = await hotelReadService.getRoomDetails(args.room_name);
        break;
      case 'check_room_availability':
        data = await hotelReadService.getAvailability(
          args.room_name,
          args.check_in_date,
          args.check_out_date,
        );
        break;
      case 'get_reservation_quote':
        data = await hotelReadService.getQuote(
          args.room_name,
          args.check_in_date,
          args.check_out_date,
          args.extra_guests,
        );
        break;
      default:
        return { ok: false, error: '허용되지 않은 호텔 조회 요청입니다.' };
    }

    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: toSafeHotelToolError(error) };
  }
}
