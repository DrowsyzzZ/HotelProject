import { supabase } from './supabase-client.js';

export class ApiError extends Error {
  constructor(message, code, status = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

async function runQuery(query, label) {
  let result;
  try {
    result = await query;
  } catch {
    throw new ApiError(`${label} 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.`, 'NETWORK');
  }

  if (result.error) {
    const isUserMessage = result.error.code === 'P0001';
    throw new ApiError(
      isUserMessage
        ? result.error.message
        : `${label} 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.`,
      result.error.code || 'SUPABASE',
      result.status || null,
    );
  }

  return result.data;
}

function ensureCollection(data, label) {
  if (!Array.isArray(data)) throw new ApiError(`${label} 형식이 올바르지 않습니다.`, 'INVALID_DATA');
  return data;
}

function normalizeRoom(room) {
  if (!room) return null;
  return {
    ...room,
    desc: room.description,
    desc_eng: room.description_eng,
  };
}

export function getApiErrorMessage(error, fallback) {
  return error instanceof ApiError ? error.message : fallback;
}

export async function getRooms() {
  const data = await runQuery(
    supabase.from('rooms').select('*').order('id'),
    '객실 정보',
  );
  return ensureCollection(data, '객실 정보').map(normalizeRoom);
}

export const getRoom = async roomId => {
  const room = await runQuery(
    supabase.from('rooms').select('*').eq('id', Number(roomId)).maybeSingle(),
    '객실 정보',
  );
  if (room !== null && (typeof room !== 'object' || Array.isArray(room))) {
    throw new ApiError('객실 정보 형식이 올바르지 않습니다.', 'INVALID_DATA');
  }
  return normalizeRoom(room);
};

export async function getSeasons() {
  const data = await runQuery(
    supabase.from('seasons').select('*').order('id'),
    '시즌 정보',
  );
  return ensureCollection(data, '시즌 정보');
}

export async function getPrices() {
  const data = await runQuery(
    supabase.from('prices').select('*').order('id'),
    '요금 정보',
  );
  return ensureCollection(data, '요금 정보');
}

export async function getHolidays() {
  const data = await runQuery(
    supabase.from('holidays').select('*').order('holiday_date'),
    '공휴일 정보',
  );
  return ensureCollection(data, '공휴일 정보');
}

export const getReservations = async roomId => {
  const data = await runQuery(
    supabase
      .from('reservations')
      .select('id, room_id, check_in_date, check_out_date')
      .eq('room_id', Number(roomId))
      .order('check_in_date'),
    '예약 정보',
  );
  return ensureCollection(data, '예약 정보');
};

export async function createReservation(reservation) {
  const data = await runQuery(
    supabase.rpc('create_reservation', {
      p_room_id: Number(reservation.room_id),
      p_check_in_date: reservation.check_in_date,
      p_check_out_date: reservation.check_out_date,
      p_number_of_guests: Number(reservation.number_of_guests),
      p_customer_name: reservation.customer_name,
      p_phone_number: reservation.phone_number,
    }),
    '예약 등록',
  );

  const result = Array.isArray(data) ? data[0] : data;

  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    throw new ApiError('예약 등록 결과를 확인할 수 없습니다.', 'INVALID_RESPONSE');
  }

  return {
    ...reservation,
    id: result.id,
    total_price: Number(result.total_price),
  };
}
