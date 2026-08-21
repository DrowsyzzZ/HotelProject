const API_ORIGIN = 'http://localhost:3000';

export class ApiError extends Error {
  constructor(message, code, status = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

async function requestJson(resource, options, label) {
  let response;

  try {
    response = await fetch(`${API_ORIGIN}/${resource}`, options);
  } catch {
    throw new ApiError(`${label} 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.`, 'NETWORK');
  }

  if (!response.ok) {
    throw new ApiError(`${label} 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.`, 'HTTP', response.status);
  }

  try {
    return await response.json();
  } catch {
    throw new ApiError(`${label} 응답 형식이 올바르지 않습니다.`, 'INVALID_RESPONSE', response.status);
  }
}

export async function fetchCollection(resource, label = '데이터') {
  const data = await requestJson(resource, undefined, label);
  if (!Array.isArray(data)) throw new ApiError(`${label} 형식이 올바르지 않습니다.`, 'INVALID_DATA');
  return data;
}

export function getApiErrorMessage(error, fallback) {
  return error instanceof ApiError ? error.message : fallback;
}

export const getRooms = () => fetchCollection('rooms', '객실 정보');
export const getRoom = async roomId => {
  try {
    const room = await requestJson(`rooms/${roomId}`, undefined, '객실 정보');
    if (!room || typeof room !== 'object' || Array.isArray(room)) {
      throw new ApiError('객실 정보 형식이 올바르지 않습니다.', 'INVALID_DATA');
    }
    return room;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
};
export const getSeasons = () => fetchCollection('season', '시즌 정보');
export const getPrices = () => fetchCollection('price', '요금 정보');
export const getHolidays = () => fetchCollection('holiday', '공휴일 정보');
export const getReservations = async roomId => {
  const reservations = await fetchCollection('reservation', '예약 정보');
  return reservations.filter(reservation => Number(reservation.room_id) === Number(roomId));
};
export async function createReservation(reservation) {
  const createdReservation = await requestJson('reservation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reservation),
  }, '예약 등록');

  if (!createdReservation || typeof createdReservation !== 'object' || Array.isArray(createdReservation)) {
    throw new ApiError('예약 등록 결과를 확인할 수 없습니다.', 'INVALID_RESPONSE');
  }
  return createdReservation;
}
