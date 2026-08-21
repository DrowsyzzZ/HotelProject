function parseDate(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function getMonthDay(dateKey) {
  return dateKey.slice(5);
}

function getSeasonId(dateKey, seasons) {
  const monthDay = getMonthDay(dateKey);
  const season = seasons.find(item => item.ranges.some(range => (
    monthDay >= range.start_month_day && monthDay <= range.end_month_day
  )));

  if (!season) throw new Error(`${dateKey}에 적용할 시즌 정보를 찾을 수 없습니다.`);
  return Number(season.id);
}

function getRateType(dateKey, holidayDates) {
  if (holidayDates.has(dateKey)) return 'holiday';

  const day = parseDate(dateKey).getDay();
  return day === 0 || day === 6 ? 'weekend' : 'weekday';
}

export function calculateReservationPrice({
  roomId,
  stayDates,
  extraGuests,
  seasons,
  prices,
  holidays,
}) {
  const holidayDates = new Set(holidays.map(holiday => holiday.holiday_date));
  const roomPrices = prices.filter(price => Number(price.room_id) === Number(roomId));

  const dailyPrices = stayDates.map(date => {
    const seasonId = getSeasonId(date, seasons);
    const price = roomPrices.find(item => Number(item.season_id) === seasonId);
    if (!price) throw new Error(`${date}에 적용할 객실 요금을 찾을 수 없습니다.`);

    const rateType = getRateType(date, holidayDates);
    const basePrice = Number(price[`${rateType}_price`]);
    const extraPrice = Math.round(basePrice * 0.2 * extraGuests);

    return {
      date,
      seasonId,
      rateType,
      basePrice,
      extraPrice,
      totalPrice: basePrice + extraPrice,
    };
  });

  return {
    dailyPrices,
    baseTotal: dailyPrices.reduce((sum, day) => sum + day.basePrice, 0),
    extraTotal: dailyPrices.reduce((sum, day) => sum + day.extraPrice, 0),
    totalPrice: dailyPrices.reduce((sum, day) => sum + day.totalPrice, 0),
  };
}
