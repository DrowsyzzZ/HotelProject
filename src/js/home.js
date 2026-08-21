import Swiper from 'https://cdn.jsdelivr.net/npm/swiper@12/swiper-bundle.min.mjs';

const heroSlider = new Swiper('.hero-slider', {
  loop: true,
  speed: 800,
  autoplay: {
    delay: 5000,
    disableOnInteraction: false,
  },
  pagination: {
    el: '.hero-slider .swiper-pagination',
    clickable: true,
  },
  keyboard: {
    enabled: true,
  },
});

const roomModal = document.querySelector('.room-modal');
const roomModalImage = roomModal?.querySelector('.room-modal__image');
const roomButtons = document.querySelectorAll('.rooms-list__item');
const horizontalScrollAreas = document.querySelectorAll('.horizontal-scroll');

horizontalScrollAreas.forEach((scrollArea) => {
  let startX = 0;
  let startScrollLeft = 0;
  let isDragging = false;
  let blockClick = false;

  scrollArea.addEventListener('dragstart', (event) => event.preventDefault());

  scrollArea.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;

    startX = event.clientX;
    startScrollLeft = scrollArea.scrollLeft;
    isDragging = true;
    blockClick = false;
  });

  scrollArea.addEventListener('pointermove', (event) => {
    if (!isDragging) return;

    const distance = event.clientX - startX;

    if (Math.abs(distance) > 5) {
      blockClick = true;
      scrollArea.classList.add('is-dragging');

      if (!scrollArea.hasPointerCapture(event.pointerId)) {
        scrollArea.setPointerCapture(event.pointerId);
      }
    }

    if (blockClick) scrollArea.scrollLeft = startScrollLeft - distance;
  });

  const stopDragging = (event) => {
    if (!isDragging) return;

    isDragging = false;
    scrollArea.classList.remove('is-dragging');

    if (scrollArea.hasPointerCapture(event.pointerId)) {
      scrollArea.releasePointerCapture(event.pointerId);
    }
  };

  scrollArea.addEventListener('pointerup', stopDragging);
  scrollArea.addEventListener('pointercancel', stopDragging);
  scrollArea.addEventListener(
    'click',
    (event) => {
      if (!blockClick) return;

      event.preventDefault();
      event.stopPropagation();
      blockClick = false;
    },
    true,
  );
});

roomButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const image = button.querySelector('img');

    if (!roomModal || !roomModalImage || !image) return;

    roomModalImage.src = image.src;
    roomModalImage.alt = image.alt;
    roomModal.showModal();
  });
});

roomModal?.addEventListener('click', (event) => {
  if (event.target === roomModal) roomModal.close();
});

roomModal?.addEventListener('close', () => {
  if (!roomModalImage) return;

  roomModalImage.src = '';
  roomModalImage.alt = '';
});
