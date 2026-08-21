const API_ORIGIN = 'http://localhost:3000';

export async function fetchCollection(resource) {
  const response = await fetch(`${API_ORIGIN}/${resource}`);

  if (!response.ok) {
    throw new Error(`${resource} 데이터를 불러오지 못했습니다. (${response.status})`);
  }

  return response.json();
}

export const getRooms = () => fetchCollection('rooms');
export const getRoom = async roomId => {
  const response = await fetch(`${API_ORIGIN}/rooms/${roomId}`);

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`객실 데이터를 불러오지 못했습니다. (${response.status})`);

  return response.json();
};
export const getSeasons = () => fetchCollection('season');
export const getPrices = () => fetchCollection('price');
export const getHolidays = () => fetchCollection('holiday');
export const getReservations = async roomId => {
  const reservations = await fetchCollection('reservation');
  return reservations.filter(reservation => Number(reservation.room_id) === Number(roomId));
};
