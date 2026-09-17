export class SupabaseReadError extends Error {
  constructor(message, { cause } = {}) {
    super(message, { cause });
    this.name = 'SupabaseReadError';
  }
}

function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/$/, '');
}

function ensureRows(payload) {
  if (!Array.isArray(payload)) {
    throw new SupabaseReadError('호텔 데이터 응답 형식이 올바르지 않습니다.');
  }

  return payload;
}

export function createSupabaseReadClient({ baseUrl, publishableKey, requestTimeoutMs }, { fetchImpl = fetch } = {}) {
  const restBaseUrl = `${normalizeBaseUrl(baseUrl)}/rest/v1`;

  async function getRows(table, query) {
    const url = new URL(`${restBaseUrl}/${table}`);
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

    try {
      const response = await fetchImpl(url, {
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${publishableKey}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      let payload = null;
      try {
        payload = await response.json();
      } catch {
        // The safe generic error below is used when Supabase returns non-JSON data.
      }

      if (!response.ok) {
        throw new SupabaseReadError('호텔 데이터를 조회하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      }

      return ensureRows(payload);
    } catch (error) {
      if (error instanceof SupabaseReadError) throw error;
      if (error?.name === 'AbortError') {
        throw new SupabaseReadError('호텔 데이터 조회 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.', { cause: error });
      }
      throw new SupabaseReadError('호텔 데이터 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.', { cause: error });
    } finally {
      clearTimeout(timeout);
    }
  }

  return Object.freeze({
    getRooms: () => getRows('rooms', {
      select: 'id,name,name_eng,area,min,capacity,description',
      order: 'id.asc',
    }),
    getSeasons: () => getRows('seasons', {
      select: 'id,name,ranges',
      order: 'id.asc',
    }),
    getPrices: () => getRows('prices', {
      select: 'room_id,season_id,weekday_price,weekend_price,holiday_price',
      order: 'id.asc',
    }),
    getHolidays: () => getRows('holidays', {
      select: 'holiday_name,holiday_date',
      order: 'holiday_date.asc',
    }),
    getReservationsForStay: (roomId, checkInDate, checkOutDate) => getRows('reservations', {
      select: 'room_id,check_in_date,check_out_date',
      room_id: `eq.${roomId}`,
      check_in_date: `lt.${checkOutDate}`,
      check_out_date: `gt.${checkInDate}`,
    }),
    getReservationsForAllRoomsStay: (checkInDate, checkOutDate) => getRows('reservations', {
      select: 'room_id,check_in_date,check_out_date',
      check_in_date: `lt.${checkOutDate}`,
      check_out_date: `gt.${checkInDate}`,
    }),
  });
}
