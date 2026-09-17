import { createSupabaseReadClient, SupabaseReadError } from './supabase-rest-client.js';

export class HotelReadError extends Error {
  constructor(message, { cause } = {}) {
    super(message, { cause });
    this.name = 'HotelReadError';
  }
}

function normalizeRoomName(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s_-]/g, '')
    .replace(/(객실|룸|room)$/u, '');
}

function parseDateKey(value, label) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new HotelReadError(`${label}은 YYYY-MM-DD 형식으로 입력해 주세요.`);
  }

  const [year, month, day] = value.split('-').map(Number);
  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);

  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    throw new HotelReadError(`${label}이 올바른 날짜가 아닙니다.`);
  }

  return { key: value, timestamp };
}

function getKoreanToday() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function getStayDates(checkIn, checkOut) {
  const dates = [];
  for (let timestamp = checkIn.timestamp; timestamp < checkOut.timestamp; timestamp += 86_400_000) {
    dates.push(new Date(timestamp).toISOString().slice(0, 10));
  }
  return dates;
}

function getNextDateKey(dateKey) {
  const date = parseDateKey(dateKey, '입실일');
  return new Date(date.timestamp + 86_400_000).toISOString().slice(0, 10);
}

function resolveCheckOutDate(checkInDate, checkOutDate) {
  if (checkOutDate === undefined || checkOutDate === null || checkOutDate === '') {
    return { checkOutDate: getNextDateKey(checkInDate), assumedOneNight: true };
  }

  return { checkOutDate, assumedOneNight: false };
}

function validateStay(checkInDate, checkOutDate) {
  const checkIn = parseDateKey(checkInDate, '입실일');
  const checkOut = parseDateKey(checkOutDate, '퇴실일');
  const stayNights = Math.round((checkOut.timestamp - checkIn.timestamp) / 86_400_000);

  if (stayNights <= 0) {
    throw new HotelReadError('퇴실일은 입실일보다 늦어야 합니다.');
  }

  if (stayNights > 5) {
    throw new HotelReadError('이 호텔은 최대 5박까지 예약할 수 있습니다.');
  }

  if (checkIn.key < getKoreanToday()) {
    throw new HotelReadError('오늘 이전 날짜는 조회할 수 없습니다.');
  }

  return { checkIn, checkOut, stayDates: getStayDates(checkIn, checkOut), stayNights };
}

function getSeasonId(dateKey, seasons) {
  const monthDay = dateKey.slice(5);
  const season = seasons.find(item => Array.isArray(item.ranges) && item.ranges.some(range => (
    monthDay >= range.start_month_day && monthDay <= range.end_month_day
  )));

  if (!season) throw new HotelReadError(`${dateKey}에 적용할 시즌 정보를 찾을 수 없습니다.`);
  return Number(season.id);
}

function getRateType(dateKey, holidayDates) {
  if (holidayDates.has(dateKey)) return 'holiday';
  const day = new Date(`${dateKey}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6 ? 'weekend' : 'weekday';
}

function getExtraGuests(value, room) {
  if (value === undefined || value === null || value === '') return 0;
  const extraGuests = Number(value);
  const maximumExtraGuests = Number(room.capacity) - Number(room.min);

  if (!Number.isInteger(extraGuests) || extraGuests < 0 || extraGuests > maximumExtraGuests) {
    throw new HotelReadError(`${room.name} 객실은 추가 인원을 0~${maximumExtraGuests}명까지 선택할 수 있습니다.`);
  }

  return extraGuests;
}

function toRoomSummary(room) {
  return {
    id: Number(room.id),
    name: room.name,
    name_eng: room.name_eng,
    area_m2: Number(room.area),
    standard_guests: Number(room.min),
    maximum_guests: Number(room.capacity),
    description: room.description,
  };
}

export function createHotelReadService(supabaseConfig) {
  const client = createSupabaseReadClient(supabaseConfig);

  async function findRoom(roomName) {
    const normalizedName = normalizeRoomName(roomName);
    if (!normalizedName) throw new HotelReadError('객실명을 알려주세요.');

    const rooms = await client.getRooms();
    const room = rooms.find(item => (
      normalizeRoomName(item.name) === normalizedName
      || normalizeRoomName(item.name_eng) === normalizedName
      || normalizeRoomName(item.name_eng).includes(normalizedName)
      || normalizeRoomName(item.name).includes(normalizedName)
    ));

    if (!room) {
      throw new HotelReadError('해당 객실을 찾지 못했습니다. 스탠다드, 디럭스, 프리미엄, 스위트 중에서 알려주세요.');
    }

    return room;
  }

  async function getAvailability(roomName, checkInDate, checkOutDate) {
    const [room, stay] = await Promise.all([
      findRoom(roomName),
      Promise.resolve(validateStay(checkInDate, checkOutDate)),
    ]);
    const overlappingReservations = await client.getReservationsForStay(
      Number(room.id),
      stay.checkIn.key,
      stay.checkOut.key,
    );

    return {
      room: toRoomSummary(room),
      check_in_date: stay.checkIn.key,
      check_out_date: stay.checkOut.key,
      nights: stay.stayNights,
      available: overlappingReservations.length === 0,
    };
  }

  async function getAvailableRooms(checkInDate, requestedCheckOutDate) {
    const { checkOutDate, assumedOneNight } = resolveCheckOutDate(checkInDate, requestedCheckOutDate);
    const stay = validateStay(checkInDate, checkOutDate);
    const [rooms, overlappingReservations] = await Promise.all([
      client.getRooms(),
      client.getReservationsForAllRoomsStay(stay.checkIn.key, stay.checkOut.key),
    ]);
    const occupiedRoomIds = new Set(overlappingReservations.map(reservation => Number(reservation.room_id)));
    const roomsWithAvailability = rooms.map(room => ({
      room: toRoomSummary(room),
      available: !occupiedRoomIds.has(Number(room.id)),
    }));

    return {
      check_in_date: stay.checkIn.key,
      check_out_date: stay.checkOut.key,
      nights: stay.stayNights,
      assumed_one_night: assumedOneNight,
      rooms: roomsWithAvailability,
      available_rooms: roomsWithAvailability
        .filter(item => item.available)
        .map(item => item.room),
    };
  }

  async function getQuote(roomName, checkInDate, checkOutDate, requestedExtraGuests) {
    const [room, stay, seasons, prices, holidays] = await Promise.all([
      findRoom(roomName),
      Promise.resolve(validateStay(checkInDate, checkOutDate)),
      client.getSeasons(),
      client.getPrices(),
      client.getHolidays(),
    ]);
    const extraGuests = getExtraGuests(requestedExtraGuests, room);
    const overlappingReservations = await client.getReservationsForStay(
      Number(room.id),
      stay.checkIn.key,
      stay.checkOut.key,
    );
    const holidayDates = new Set(holidays.map(holiday => holiday.holiday_date));
    const roomPrices = prices.filter(price => Number(price.room_id) === Number(room.id));

    const nightly_breakdown = stay.stayDates.map(date => {
      const seasonId = getSeasonId(date, seasons);
      const price = roomPrices.find(item => Number(item.season_id) === seasonId);
      if (!price) throw new HotelReadError(`${date}에 적용할 객실 요금을 찾을 수 없습니다.`);

      const rateType = getRateType(date, holidayDates);
      const basePrice = Number(price[`${rateType}_price`]);
      const extraPrice = Math.round(basePrice * 0.2 * extraGuests);

      return {
        date,
        rate_type: rateType,
        base_price: basePrice,
        extra_guest_price: extraPrice,
        total_price: basePrice + extraPrice,
      };
    });

    return {
      room: toRoomSummary(room),
      check_in_date: stay.checkIn.key,
      check_out_date: stay.checkOut.key,
      nights: stay.stayNights,
      extra_guests: extraGuests,
      available: overlappingReservations.length === 0,
      currency: 'KRW',
      base_total: nightly_breakdown.reduce((sum, day) => sum + day.base_price, 0),
      extra_guest_total: nightly_breakdown.reduce((sum, day) => sum + day.extra_guest_price, 0),
      total_price: nightly_breakdown.reduce((sum, day) => sum + day.total_price, 0),
      nightly_breakdown,
    };
  }

  return Object.freeze({
    listRooms: async () => (await client.getRooms()).map(toRoomSummary),
    getRoomDetails: async roomName => toRoomSummary(await findRoom(roomName)),
    getAvailability,
    getAvailableRooms,
    getQuote,
  });
}

export function toSafeHotelToolError(error) {
  if (error instanceof HotelReadError || error instanceof SupabaseReadError) {
    return error.message;
  }

  return '호텔 정보를 조회하지 못했습니다. 잠시 후 다시 시도해 주세요.';
}
