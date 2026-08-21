import { getRooms } from './api.js';

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
    renderRooms(rooms);
  } catch (error) {
    console.error(error);
    roomList.innerHTML = '<p class="room-page-message room-page-message--error">객실 정보를 불러오지 못했습니다. JSON Server를 확인해주세요.</p>';
  }
}

initializeRoomSelect();
