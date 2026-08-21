import { getHolidays, getPrices, getRoom, getSeasons } from './api.js';
import { calculateReservationPrice } from './reservation-pricing.js';

const detail = document.querySelector('#room-detail');
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

function createExtraGuestOptions(maxExtraGuests) {
  return Array.from({ length: maxExtraGuests + 1 }, (_, count) => `
    <option value="${count}">${count === 0 ? '없음' : `${count}명`}</option>
  `).join('');
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
          <button class="booking-panel__submit" type="button">예약하기</button>
        </div>
      </aside>
    </div>
  `;

  detail.querySelector('room-gallery').room = room;
  detail.querySelector('reservation-calendar').roomId = room.id;
  detail.querySelector('.booking-panel__cancel').addEventListener('click', () => {
    detail.querySelector('reservation-calendar').clearSelection();
  });

  initializePriceCalculation(room);
}

async function initializePriceCalculation(room) {
  const calendar = detail.querySelector('reservation-calendar');
  const extraGuestSelect = detail.querySelector('#extra-people');
  const totalPrice = detail.querySelector('.booking-panel__total-price');
  let stayDates = [];
  let pricingData;

  function updateTotal() {
    if (!pricingData || stayDates.length === 0) {
      totalPrice.textContent = '0';
      return;
    }

    try {
      const result = calculateReservationPrice({
        roomId: room.id,
        stayDates,
        extraGuests: Number(extraGuestSelect.value),
        ...pricingData,
      });
      totalPrice.textContent = result.totalPrice.toLocaleString('ko-KR');
    } catch (error) {
      console.error(error);
      totalPrice.textContent = '계산 불가';
    }
  }

  calendar.addEventListener('date-range-change', event => {
    stayDates = event.detail.stayDates;
    updateTotal();
  });
  extraGuestSelect.addEventListener('change', updateTotal);
  detail.querySelector('.booking-panel__cancel').addEventListener('click', () => {
    extraGuestSelect.value = '0';
    stayDates = [];
    updateTotal();
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
    console.error(error);
    totalPrice.textContent = '계산 불가';
  }
}

async function initializeRoomDetail() {
  if (!roomIdValue || !Number.isInteger(roomId) || roomId < 1) {
    renderError('올바른 객실을 다시 선택해주세요.');
    return;
  }

  try {
    const room = await getRoom(roomId);
    if (!room) {
      renderError(`객실 ID ${roomId}에 해당하는 데이터가 없습니다.`);
      return;
    }

    renderRoom(room);
  } catch (error) {
    console.error(error);
    renderError('객실 데이터를 불러오지 못했습니다. JSON Server를 확인해주세요.');
  }
}

initializeRoomDetail();
