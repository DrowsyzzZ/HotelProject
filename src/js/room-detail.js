import { getApiErrorMessage, getHolidays, getPrices, getRoom, getSeasons } from './api.js';
import { calculateReservationPrice } from './reservation-pricing.js';

const detail = document.querySelector('#room-detail');
const reservationFormPage = new URL('../html/reservation-form.html', import.meta.url);
const roomSelectPage = new URL('../html/room-select.html', import.meta.url);
const notFoundPage = new URL('../404.html', import.meta.url);
const RESERVATION_DRAFT_KEY = 'hotelReservationDraft';
const roomIdValue = new URLSearchParams(window.location.search).get('roomId');
const roomId = Number(roomIdValue);

function renderError(message) {
  detail.innerHTML = `
    <div class="room-detail-error" role="alert">
      <h2>객실 정보를 찾을 수 없습니다.</h2>
      <p>${message}</p>
      <a href="./room-select.html">객실 선택으로 돌아가기</a>
    </div>
  `;
}

function moveToNotFoundPage() {
  window.location.replace(notFoundPage.href);
}

function createExtraGuestOptions(maxExtraGuests) {
  return Array.from({ length: maxExtraGuests + 1 }, (_, count) => `
    <option value="${count}">${count === 0 ? '없음' : `${count}명`}</option>
  `).join('');
}

function isValidRoom(room) {
  return room
    && Number.isInteger(Number(room.id))
    && typeof room.name === 'string'
    && typeof room.name_eng === 'string'
    && Number.isFinite(Number(room.min))
    && Number.isFinite(Number(room.capacity))
    && Number(room.capacity) >= Number(room.min)
    && Array.isArray(room.images)
    && room.images.length > 0;
}

function renderRoom(room) {
  const maxExtraGuests = room.capacity - room.min;
  const extraGuestDescription = maxExtraGuests === 0
    ? `기준 인원 ${room.min}명, 추가 인원 없음`
    : `기준 인원 ${room.min}명, 아동 최대 ${maxExtraGuests}명 추가 가능 (1명당 객실 가격의 20%)`;

  document.title = `${room.name} 객실 | Hotel`;
  detail.innerHTML = `
    <h2 class="room-detail__title">${room.name_eng.toUpperCase()}</h2>
    <div class="room-detail__content">
      <div class="room-detail__visual">
        <room-gallery></room-gallery>
        <div class="room-detail__description">
          <p>${room.desc}</p>
          <p lang="en">${room.desc_eng}</p>
        </div>
      </div>

      <aside class="booking-panel" aria-label="예약 정보">
        <reservation-calendar></reservation-calendar>

        <div class="booking-panel__people">
          <label for="extra-people">추가 인원</label>
          <select id="extra-people" aria-label="추가 아동 인원"${maxExtraGuests === 0 ? ' disabled' : ''}>
            ${createExtraGuestOptions(maxExtraGuests)}
          </select>
          <p>${extraGuestDescription}</p>
        </div>

        <div class="booking-panel__total">
          <span>총 합계</span>
          <strong><span class="booking-panel__total-price">0</span><small>원</small></strong>
        </div>

        <div class="booking-panel__actions">
          <button class="booking-panel__cancel" type="button">취소</button>
          <button class="booking-panel__submit" type="button" disabled>예약하기</button>
        </div>
      </aside>
    </div>
  `;

  detail.querySelector('room-gallery').room = room;
  detail.querySelector('reservation-calendar').roomId = room.id;
  detail.querySelector('.booking-panel__cancel').addEventListener('click', () => {
    window.location.href = roomSelectPage.href;
  });

  initializePriceCalculation(room);
}

async function initializePriceCalculation(room) {
  const calendar = detail.querySelector('reservation-calendar');
  const extraGuestSelect = detail.querySelector('#extra-people');
  const totalPrice = detail.querySelector('.booking-panel__total-price');
  const submitButton = detail.querySelector('.booking-panel__submit');
  let stayDates = [];
  let selectedRange = { checkIn: null, checkOut: null, nights: 0 };
  let priceResult = null;
  let pricingData;

  function updateSubmitState() {
    submitButton.disabled = !(
      selectedRange.checkIn
      && selectedRange.checkOut
      && stayDates.length > 0
      && priceResult
    );
  }

  function updateTotal() {
    if (!pricingData || stayDates.length === 0) {
      priceResult = null;
      totalPrice.textContent = '0';
      updateSubmitState();
      return;
    }

    try {
      priceResult = calculateReservationPrice({
        roomId: room.id,
        stayDates,
        extraGuests: Number(extraGuestSelect.value),
        ...pricingData,
      });
      totalPrice.textContent = priceResult.totalPrice.toLocaleString('ko-KR');
    } catch (error) {
      priceResult = null;
      totalPrice.textContent = '계산 불가';
    }
    updateSubmitState();
  }

  calendar.addEventListener('date-range-change', event => {
    stayDates = event.detail.stayDates;
    selectedRange = event.detail;
    updateTotal();
  });
  extraGuestSelect.addEventListener('change', updateTotal);
  submitButton.addEventListener('click', () => {
    if (!selectedRange.checkIn || !selectedRange.checkOut || !priceResult) {
      calendar.showWarning('입실일과 퇴실일을 선택해 주세요.');
      return;
    }

    const extraGuests = Number(extraGuestSelect.value);
    sessionStorage.setItem(RESERVATION_DRAFT_KEY, JSON.stringify({
      roomId: room.id,
      roomName: room.name,
      roomNameEng: room.name_eng,
      baseGuests: room.min,
      extraGuests,
      totalGuests: room.min + extraGuests,
      checkIn: selectedRange.checkIn,
      checkOut: selectedRange.checkOut,
      nights: selectedRange.nights,
      stayDates,
      totalPrice: priceResult.totalPrice,
      createdAt: new Date().toISOString(),
    }));
    window.location.href = reservationFormPage.href;
  });

  try {
    const [seasons, prices, holidays] = await Promise.all([
      getSeasons(),
      getPrices(),
      getHolidays(),
    ]);
    pricingData = { seasons, prices, holidays };
    updateTotal();
  } catch (error) {
    totalPrice.textContent = '계산 불가';
    totalPrice.setAttribute('aria-label', getApiErrorMessage(
      error,
      '합계 금액을 계산하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    ));
    updateSubmitState();
  }
}

async function initializeRoomDetail() {
  if (!roomIdValue || !Number.isInteger(roomId) || roomId < 1) {
    moveToNotFoundPage();
    return;
  }

  try {
    const room = await getRoom(roomId);
    if (!room) {
      moveToNotFoundPage();
      return;
    }
    if (!isValidRoom(room)) {
      renderError('객실 정보가 올바르지 않습니다. 객실을 다시 선택해주세요.');
      return;
    }

    renderRoom(room);
  } catch (error) {
    renderError(getApiErrorMessage(
      error,
      '객실 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    ));
  }
}

initializeRoomDetail();
