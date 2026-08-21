import { getRoom } from './api.js';

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

function renderRoom(room) {
  const calendarDays = [
    ['27', 'is-muted is-sunday'], ['28', 'is-muted'], ['29', 'is-muted'], ['30', 'is-muted'],
    ['1', 'is-muted'], ['2', 'is-muted'], ['3', 'is-muted'], ['4', 'is-muted is-sunday'],
    ['5', 'is-muted'], ['6', 'is-muted'], ['7', 'is-muted'], ['8', 'is-muted'],
    ['9', 'is-muted'], ['10', 'is-muted'], ['11', 'is-muted is-sunday'],
    ['12', 'is-muted'], ['13', 'is-muted'], ['14', ''], ['15', 'is-selected is-check-in', '입실'],
    ['16', 'is-selected'], ['17', 'is-selected is-check-out', '퇴실'], ['18', 'is-sunday'],
    ['19', ''], ['20', 'is-booked', '예약완료'], ['21', 'is-booked', '예약완료'],
    ['22', ''], ['23', ''], ['24', ''], ['25', 'is-sunday'], ['26', ''], ['27', ''],
    ['28', ''], ['29', 'is-booked', '예약완료'], ['30', 'is-booked', '예약완료'],
    ['31', 'is-booked', '예약완료'], ['1', 'is-sunday'], ['2', ''],
    ['3', ''], ['4', ''], ['5', ''], ['6', ''], ['7', '']
  ];
  const calendarCells = calendarDays.map(([day, className, status = '']) => `
    <div class="booking-calendar__day ${className}">
      <span>${day}</span>${status ? `<small>${status}</small>` : ''}
    </div>
  `).join('');

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
        <div class="booking-calendar">
          <div class="booking-calendar__header">
            <div class="booking-calendar__navigation">
              <button type="button" aria-label="이전 달" aria-disabled="true">‹</button>
              <strong>
                <span class="booking-calendar__date-value">2025</span><span class="booking-calendar__date-unit">년</span>
                <span class="booking-calendar__date-value">05</span><span class="booking-calendar__date-unit">월</span>
              </strong>
              <button type="button" aria-label="다음 달" aria-disabled="true">›</button>
            </div>
          </div>
          <div class="booking-calendar__weekdays" aria-hidden="true">
            <span>일</span><span>월</span><span>화</span><span>수</span>
            <span>목</span><span>금</span><span>토</span>
          </div>
          <div class="booking-calendar__days">${calendarCells}</div>
        </div>

        <div class="booking-panel__people">
          <label for="extra-people">추가 인원</label>
          <select id="extra-people" aria-label="추가 인원">
            <option>없음</option>
            <option>1명</option>
          </select>
          <p>기준 인원 ${room.min}명, 추가 시 한 명당 객실 가격의 20%</p>
        </div>

        <div class="booking-panel__total">
          <span>총 합계</span>
          <strong>150,000 <small>원</small></strong>
        </div>

        <div class="booking-panel__actions">
          <button class="booking-panel__cancel" type="button">취소</button>
          <button class="booking-panel__submit" type="button">예약하기</button>
        </div>
      </aside>
    </div>
  `;

  detail.querySelector('room-gallery').room = room;
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
