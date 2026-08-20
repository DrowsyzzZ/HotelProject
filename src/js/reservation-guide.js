import { getPrices, getRooms } from './api.js';

const tableBody = document.querySelector('#price-table-body');
const tableScroll = document.querySelector('.price-table-scroll');
const currencyFormatter = new Intl.NumberFormat('ko-KR');

function initializeDragScroll() {
  let startX = 0;
  let startScrollLeft = 0;

  const updateScrollableState = () => {
    tableScroll.classList.toggle('is-scrollable', tableScroll.scrollWidth > tableScroll.clientWidth + 1);
  };

  tableScroll.addEventListener('pointerdown', event => {
    if (!tableScroll.classList.contains('is-scrollable') || event.pointerType !== 'mouse' || event.button !== 0) return;

    startX = event.clientX;
    startScrollLeft = tableScroll.scrollLeft;
    tableScroll.classList.add('is-dragging');
    tableScroll.setPointerCapture(event.pointerId);
  });

  tableScroll.addEventListener('pointermove', event => {
    if (!tableScroll.classList.contains('is-dragging')) return;

    event.preventDefault();
    tableScroll.scrollLeft = startScrollLeft - (event.clientX - startX);
  });

  const stopDragging = event => {
    if (!tableScroll.classList.contains('is-dragging')) return;

    tableScroll.classList.remove('is-dragging');
    if (tableScroll.hasPointerCapture(event.pointerId)) {
      tableScroll.releasePointerCapture(event.pointerId);
    }
  };

  tableScroll.addEventListener('pointerup', stopDragging);
  tableScroll.addEventListener('pointercancel', stopDragging);

  new ResizeObserver(updateScrollableState).observe(tableScroll);
  updateScrollableState();
}

function renderPriceRows(rooms, prices) {
  tableBody.innerHTML = rooms.map(room => {
    const roomPrices = prices.filter(price => price.room_id === room.id);
    const priceCells = [1, 2].flatMap(seasonId => {
      const current = roomPrices.find(price => price.season_id === seasonId);
      const values = current
        ? [current.weekday_price, current.weekend_price, current.holiday_price]
        : [null, null, null];

      return values.map(value => `<td>${value === null ? '-' : currencyFormatter.format(value)}</td>`).join('');
    }).join('');

    return `
      <tr>
        <th scope="row">${room.name}</th>
        <td>${room.area}㎡</td>
        <td>${room.min}/${room.capacity}</td>
        ${priceCells}
      </tr>
    `;
  }).join('');
}

async function initializePriceTable() {
  try {
    const [rooms, prices] = await Promise.all([
      getRooms(),
      getPrices(),
    ]);

    renderPriceRows(rooms, prices);
    requestAnimationFrame(() => {
      tableScroll.classList.toggle('is-scrollable', tableScroll.scrollWidth > tableScroll.clientWidth + 1);
    });
  } catch (error) {
    console.error(error);
    tableBody.innerHTML = `
      <tr class="price-table__message price-table__message--error">
        <td colspan="9">요금을 불러오지 못했습니다. JSON Server 실행 여부를 확인해주세요.</td>
      </tr>
    `;
  }
}

initializePriceTable();
initializeDragScroll();
