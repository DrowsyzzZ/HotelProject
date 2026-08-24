import { getApiErrorMessage, getRooms } from './api.js';

const roomList = document.querySelector('#room-select-list');

function renderRooms(rooms) {
  roomList.replaceChildren();

  rooms.forEach(room => {
    const card = document.createElement('room-card');
    card.room = room;
    roomList.append(card);
  });
}

async function initializeRoomSelect() {
  try {
    const rooms = await getRooms();
    if (rooms.length === 0) {
      roomList.innerHTML = '<p class="room-page-message">현재 등록된 객실이 없습니다.</p>';
      return;
    }
    renderRooms(rooms);
  } catch (error) {
    const message = getApiErrorMessage(error, '객실 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
    roomList.innerHTML = `<p class="room-page-message room-page-message--error">${message}</p>`;
  }
}

initializeRoomSelect();
