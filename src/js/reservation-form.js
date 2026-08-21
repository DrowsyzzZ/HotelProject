import {
  createReservation,
  getHolidays,
  getPrices,
  getReservations,
  getRoom,
  getSeasons,
} from './api.js';
import { calculateReservationPrice } from './reservation-pricing.js';

const RESERVATION_DRAFT_KEY = 'hotelReservationDraft';
const form = document.querySelector('#reservation-form');
const status = document.querySelector('#reservation-form-status');
const submitButton = form.querySelector('.reservation-form__submit');
const cancelButton = form.querySelector('.reservation-form__cancel');
const nameInput = form.querySelector('#customer-name');
const phoneInput = form.querySelector('#phone-number');
const calendar = form.querySelector('reservation-calendar');
let draft;
let isSubmitting = false;

function parseDate(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, amount) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function readDraft() {
  try {
    return JSON.parse(sessionStorage.getItem(RESERVATION_DRAFT_KEY));
  } catch {
    return null;
  }
}

function isValidDraft(value) {
  if (!value || !Number.isInteger(Number(value.roomId))) return false;
  if (!value.checkIn || !value.checkOut || !Array.isArray(value.stayDates)) return false;
  if (value.stayDates.length < 1 || value.stayDates.length > 5) return false;
  if (Number(value.nights) !== value.stayDates.length || Number(value.totalPrice) <= 0) return false;

  const checkIn = parseDate(value.checkIn);
  const checkOut = parseDate(value.checkOut);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const datesAreContinuous = value.stayDates.every((dateKey, index) => (
    dateKey === toDateKey(addDays(checkIn, index))
  ));

  return checkIn >= today
    && checkIn < checkOut
    && Math.round((checkOut - checkIn) / 86400000) === value.stayDates.length
    && datesAreContinuous;
}

function setFieldError(input, message) {
  const output = document.querySelector(`#${input.id}-error`);
  input.classList.toggle('is-invalid', Boolean(message));
  input.setAttribute('aria-invalid', String(Boolean(message)));
  output.textContent = message;
}

function validateName() {
  const customerName = nameInput.value.trim();
  let message = '';

  if (!customerName) {
    message = '예약명을 입력해 주세요.';
  } else if (customerName.length < 2) {
    message = '예약명은 2자 이상 입력해 주세요.';
  } else if (customerName.length > 20) {
    message = '예약명은 20자 이하로 입력해 주세요.';
  } else if (!/^[가-힣a-zA-Z]+(?: [가-힣a-zA-Z]+)*$/.test(customerName)) {
    message = '예약명은 한글 또는 영문만 입력해 주세요.';
  }

  setFieldError(nameInput, message);
  return message ? null : customerName;
}

function validatePhone() {
  const phoneNumber = phoneInput.value.trim();
  let message = '';

  if (!phoneNumber) {
    message = '전화번호를 입력해 주세요.';
  } else if (!/^\d+$/.test(phoneNumber)) {
    message = '전화번호는 - 없이 숫자만 입력해 주세요.';
  } else if (!/^01[016789]/.test(phoneNumber)) {
    message = '휴대전화 번호 형식을 확인해 주세요.';
  } else if (
    (phoneNumber.startsWith('010') && phoneNumber.length !== 11)
    || (!phoneNumber.startsWith('010') && !/^01[16789]\d{7,8}$/.test(phoneNumber))
  ) {
    message = '휴대전화 번호는 10~11자리로 입력해 주세요.';
  }

  setFieldError(phoneInput, message);
  return message ? null : phoneNumber;
}

function validateForm() {
  const customerName = validateName();
  const phoneNumber = validatePhone();

  return customerName && phoneNumber ? { customerName, phoneNumber } : null;
}

function hasOverlap(reservations) {
  const checkIn = parseDate(draft.checkIn);
  const checkOut = parseDate(draft.checkOut);

  return reservations.some(reservation => (
    checkIn < parseDate(reservation.check_out_date)
    && checkOut > parseDate(reservation.check_in_date)
  ));
}

function renderDraft() {
  document.querySelector('#reservation-room').value = draft.roomNameEng.toUpperCase();
  document.querySelector('#reservation-extra-guests').value = String(draft.extraGuests);
  document.querySelector('#reservation-check-in').value = draft.checkIn;
  document.querySelector('#reservation-check-out').value = draft.checkOut;
  document.querySelector('#reservation-total-price').textContent = Number(draft.totalPrice).toLocaleString('ko-KR');

  calendar.readOnly = true;
  calendar.roomId = draft.roomId;
  calendar.setSelection(draft.checkIn, draft.checkOut);
}

async function handleSubmit(event) {
  event.preventDefault();
  if (isSubmitting || !draft) return;

  const customer = validateForm();
  if (!customer) return;

  isSubmitting = true;
  submitButton.disabled = true;
  submitButton.textContent = '예약 중...';
  status.textContent = '';

  try {
    const reservations = await getReservations(draft.roomId);
    if (hasOverlap(reservations)) {
      status.textContent = '선택한 기간에 다른 예약이 등록되었습니다. 객실과 날짜를 다시 선택해 주세요.';
      return;
    }

    await createReservation({
      room_id: Number(draft.roomId),
      check_in_date: draft.checkIn,
      check_out_date: draft.checkOut,
      total_price: Number(draft.totalPrice),
      number_of_guests: Number(draft.totalGuests),
      customer_name: customer.customerName,
      phone_number: customer.phoneNumber,
    });

    sessionStorage.removeItem(RESERVATION_DRAFT_KEY);
    status.classList.add('is-success');
    status.textContent = '예약이 완료되었습니다.';
    nameInput.disabled = true;
    phoneInput.disabled = true;
    submitButton.textContent = '예약 완료';
  } catch (error) {
    console.error(error);
    status.textContent = '예약을 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.';
  } finally {
    if (!status.classList.contains('is-success')) {
      isSubmitting = false;
      submitButton.disabled = false;
      submitButton.textContent = '예약하기';
    }
  }
}

async function initializeReservationForm() {
  draft = readDraft();
  if (!isValidDraft(draft)) {
    status.textContent = '예약 정보가 없습니다. 객실과 날짜를 다시 선택해 주세요.';
    submitButton.disabled = true;
    return;
  }

  try {
    const [room, seasons, prices, holidays] = await Promise.all([
      getRoom(draft.roomId),
      getSeasons(),
      getPrices(),
      getHolidays(),
    ]);
    const maxExtraGuests = room ? room.capacity - room.min : -1;
    if (!room || Number(draft.extraGuests) < 0 || Number(draft.extraGuests) > maxExtraGuests) {
      throw new Error('객실 또는 인원 정보가 올바르지 않습니다.');
    }
    const priceResult = calculateReservationPrice({
      roomId: room.id,
      stayDates: draft.stayDates,
      extraGuests: Number(draft.extraGuests),
      seasons,
      prices,
      holidays,
    });
    draft.roomName = room.name;
    draft.roomNameEng = room.name_eng;
    draft.totalGuests = room.min + Number(draft.extraGuests);
    draft.totalPrice = priceResult.totalPrice;
    renderDraft();
  } catch (error) {
    console.error(error);
    draft = null;
    status.textContent = '예약 정보를 확인할 수 없습니다. 객실을 다시 선택해 주세요.';
    submitButton.disabled = true;
  }
}

nameInput.addEventListener('input', () => setFieldError(nameInput, ''));
phoneInput.addEventListener('input', () => setFieldError(phoneInput, ''));
nameInput.addEventListener('blur', validateName);
phoneInput.addEventListener('blur', validatePhone);
cancelButton.addEventListener('click', () => {
  sessionStorage.removeItem(RESERVATION_DRAFT_KEY);
  window.location.href = draft
    ? new URL(`./room-detail.html?roomId=${draft.roomId}`, window.location.href).href
    : new URL('./room-select.html', window.location.href).href;
});
form.addEventListener('submit', handleSubmit);

initializeReservationForm();
