import { getHolidays, getReservations } from '../api.js';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDate(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date, amount) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

class ReservationCalendar extends HTMLElement {
  constructor() {
    super();
    const today = startOfDay(new Date());
    this.today = today;
    this.visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.holidays = new Map();
    this.bookedDates = new Set();
    this.checkIn = null;
    this.checkOut = null;
    this.isLoading = false;
  }

  set roomId(value) {
    const nextRoomId = Number(value);
    if (!Number.isInteger(nextRoomId) || nextRoomId < 1 || nextRoomId === this._roomId) return;
    this._roomId = nextRoomId;
    this.loadAvailability();
  }

  get roomId() {
    return this._roomId;
  }

  set readOnly(value) {
    this._readOnly = Boolean(value);
    if (this.isConnected) this.render();
  }

  get readOnly() {
    return Boolean(this._readOnly);
  }

  setSelection(checkIn, checkOut) {
    this.checkIn = checkIn ? parseDate(checkIn) : null;
    this.checkOut = checkOut ? parseDate(checkOut) : null;

    if (this.checkIn) {
      this.visibleMonth = new Date(this.checkIn.getFullYear(), this.checkIn.getMonth(), 1);
    }
    if (this.isConnected) this.render();
  }

  connectedCallback() {
    this.render();
    if (this._roomId) this.loadAvailability();
  }

  async loadAvailability() {
    if (!this.isConnected || !this._roomId || this.isLoading) return;

    this.isLoading = true;
    this.render();

    try {
      const [holidays, reservations] = await Promise.all([
        getHolidays(),
        getReservations(this._roomId),
      ]);

      this.holidays = new Map(
        holidays.map(holiday => [holiday.holiday_date, holiday.holiday_name]),
      );
      this.bookedDates = this.createBookedDateSet(reservations);
      this.errorMessage = '';
    } catch (error) {
      console.error(error);
      this.errorMessage = '예약 정보를 불러오지 못했습니다.';
    } finally {
      this.isLoading = false;
      this.render();
    }
  }

  createBookedDateSet(reservations) {
    const dates = new Set();

    reservations.forEach(reservation => {
      const checkIn = parseDate(reservation.check_in_date);
      const checkOut = parseDate(reservation.check_out_date);

      for (let date = checkIn; date < checkOut; date = addDays(date, 1)) {
        dates.add(toDateKey(date));
      }
    });

    return dates;
  }

  render() {
    const year = this.visibleMonth.getFullYear();
    const month = this.visibleMonth.getMonth();
    const currentMonth = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
    const displayedMonth = new Date(year, month, 1);
    const canMoveToPreviousMonth = displayedMonth > currentMonth;
    const previousDisabled = this.readOnly || !canMoveToPreviousMonth;
    const previousAppearanceClass = this.readOnly && canMoveToPreviousMonth
      ? ' is-visually-active'
      : '';
    const nextAppearanceClass = this.readOnly ? ' is-visually-active' : '';

    this.innerHTML = `
      <div class="booking-calendar${this.isLoading ? ' is-loading' : ''}">
        <div class="booking-calendar__header">
          <div class="booking-calendar__navigation">
            <button class="booking-calendar__previous${previousAppearanceClass}" type="button" aria-label="이전 달"${previousDisabled ? ' disabled' : ''}>‹</button>
            <strong aria-live="polite">
              <span class="booking-calendar__date-value">${year}</span><span class="booking-calendar__date-unit">년</span>
              <span class="booking-calendar__date-value">${String(month + 1).padStart(2, '0')}</span><span class="booking-calendar__date-unit">월</span>
            </strong>
            <button class="booking-calendar__next${nextAppearanceClass}" type="button" aria-label="다음 달"${this.readOnly ? ' disabled' : ''}>›</button>
          </div>
        </div>
        <div class="booking-calendar__weekdays" aria-hidden="true">
          <span>일</span><span>월</span><span>화</span><span>수</span>
          <span>목</span><span>금</span><span>토</span>
        </div>
        <div class="booking-calendar__days">${this.renderDays()}</div>
        <p class="booking-calendar__message" aria-live="polite">${this.errorMessage || ''}</p>
      </div>
      <dialog class="booking-alert" aria-labelledby="booking-alert-message">
        <p id="booking-alert-message">6일 이상 예약하실 수 없습니다.</p>
        <form method="dialog">
          <button type="submit">확인</button>
        </form>
      </dialog>
    `;

    this.querySelector('.booking-calendar__previous').addEventListener('click', () => this.changeMonth(-1));
    this.querySelector('.booking-calendar__next').addEventListener('click', () => this.changeMonth(1));
    this.querySelectorAll('.booking-calendar__day:not(:disabled)').forEach(button => {
      button.addEventListener('click', () => this.selectDate(parseDate(button.dataset.date)));
    });
  }

  renderDays() {
    const year = this.visibleMonth.getFullYear();
    const month = this.visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const firstVisibleDate = addDays(firstDay, -firstDay.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const date = addDays(firstVisibleDate, index);
      const dateKey = toDateKey(date);
      const isPast = date < this.today;
      const isBooked = this.bookedDates.has(dateKey);
      const isHoliday = this.holidays.has(dateKey);
      const isOutsideMonth = date.getMonth() !== month;
      const isSunday = date.getDay() === 0;
      const isCheckIn = this.checkIn && dateKey === toDateKey(this.checkIn);
      const isCheckOut = this.checkOut && dateKey === toDateKey(this.checkOut);
      const isSelected = this.isInSelectedRange(date);
      const classes = ['booking-calendar__day'];

      if (isPast) classes.push('is-muted');
      if (isBooked) classes.push('is-booked');
      if (isHoliday) classes.push('is-holiday');
      if (isOutsideMonth) classes.push('is-outside-month');
      if (isSunday) classes.push('is-sunday');
      if (isSelected) classes.push('is-selected');
      if (isCheckIn) classes.push('is-check-in');
      if (isCheckOut) classes.push('is-check-out');

      const disabled = this.readOnly || isPast || isBooked || this.isLoading || Boolean(this.errorMessage);
      const status = isBooked ? '예약완료' : isCheckIn ? '입실' : isCheckOut ? '퇴실' : isHoliday ? '공휴일' : '';
      const holidayName = isHoliday ? `, ${this.holidays.get(dateKey)}` : '';
      const label = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일${holidayName}${isBooked ? ', 예약 완료' : ''}`;

      return `
        <button class="${classes.join(' ')}" type="button" data-date="${dateKey}"
          aria-label="${label}"${disabled ? ' disabled' : ''}${isSelected ? ' aria-pressed="true"' : ''}>
          <span>${date.getDate()}</span>${status ? `<small>${status}</small>` : ''}
        </button>
      `;
    }).join('');
  }

  isInSelectedRange(date) {
    if (!this.checkIn) return false;
    if (!this.checkOut) return toDateKey(date) === toDateKey(this.checkIn);
    return date >= this.checkIn && date <= this.checkOut;
  }

  selectDate(date) {
    if (this.checkIn && toDateKey(date) === toDateKey(this.checkIn)) {
      this.clearSelection();
      return;
    }

    if (!this.checkIn || this.checkOut || date <= this.checkIn) {
      this.checkIn = date;
      this.checkOut = null;
      this.render();
      this.emitDateRangeChange();
      return;
    }

    const nights = Math.round((date - this.checkIn) / DAY_IN_MS);
    if (nights >= 6) {
      this.rejectSelection('6일 이상 예약하실 수 없습니다.');
      return;
    }

    if (this.rangeContainsBookedDate(this.checkIn, date)) {
      this.rejectSelection('예약 완료된 날짜가 포함되어 예약하실 수 없습니다.');
      return;
    }

    this.checkOut = date;
    this.render();
    this.emitDateRangeChange();
  }

  rangeContainsBookedDate(checkIn, checkOut) {
    for (let date = checkIn; date < checkOut; date = addDays(date, 1)) {
      if (this.bookedDates.has(toDateKey(date))) return true;
    }
    return false;
  }

  changeMonth(amount) {
    const nextMonth = new Date(
      this.visibleMonth.getFullYear(),
      this.visibleMonth.getMonth() + amount,
      1,
    );
    const currentMonth = new Date(this.today.getFullYear(), this.today.getMonth(), 1);

    if (nextMonth < currentMonth) return;
    this.visibleMonth = nextMonth;
    this.render();
  }

  showWarning(message) {
    const dialog = this.querySelector('.booking-alert');
    if (!dialog) return;

    const output = dialog.querySelector('#booking-alert-message');
    if (output) output.textContent = message;

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  }

  rejectSelection(message) {
    this.checkIn = null;
    this.checkOut = null;
    this.render();
    this.emitDateRangeChange();
    this.showWarning(message);
  }

  clearSelection() {
    this.checkIn = null;
    this.checkOut = null;
    this.render();
    this.emitDateRangeChange();
  }

  emitDateRangeChange() {
    const stayDates = [];

    if (this.checkIn && this.checkOut) {
      for (let date = this.checkIn; date < this.checkOut; date = addDays(date, 1)) {
        stayDates.push(toDateKey(date));
      }
    }

    this.dispatchEvent(new CustomEvent('date-range-change', {
      bubbles: true,
      composed: true,
      detail: {
        checkIn: this.checkIn ? toDateKey(this.checkIn) : null,
        checkOut: this.checkOut ? toDateKey(this.checkOut) : null,
        nights: stayDates.length,
        stayDates,
      },
    }));
  }
}

if (!customElements.get('reservation-calendar')) {
  customElements.define('reservation-calendar', ReservationCalendar);
}
