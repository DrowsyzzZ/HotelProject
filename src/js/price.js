function toMonthDay(date) {
  if (typeof date === 'string') {
    const match = date.match(/^\d{4}-(\d{2}-\d{2})$/);
    if (match) return match[1];
  }

  const target = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(target.getTime())) {
    throw new TypeError('유효한 날짜를 입력해주세요.');
  }

  const month = String(target.getMonth() + 1).padStart(2, '0');
  const day = String(target.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}

export function getSeasonByDate(date, seasons) {
  const monthDay = toMonthDay(date);
  const season = seasons.find(item => item.ranges.some(range => (
    range.start_month_day <= monthDay && monthDay <= range.end_month_day
  )));

  if (!season) {
    throw new Error(`${monthDay}에 해당하는 시즌 정보가 없습니다.`);
  }

  return season;
}
