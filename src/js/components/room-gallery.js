const imageRoot = new URL('../../assets/images/', import.meta.url);

class RoomGallery extends HTMLElement {
  set room(value) {
    this._room = value;
    this.activeIndex = 0;
    this.render();
  }

  get room() {
    return this._room;
  }

  connectedCallback() {
    this.activeIndex = 0;
    this.render();
  }

  disconnectedCallback() {
    this.slider?.destroy(true, true);
  }

  render() {
    if (!this.isConnected || !this._room) return;

    const images = this._room.images.map(filename => new URL(filename, imageRoot).href);
    this.slider?.destroy(true, true);

    const slides = images.map((src, index) => `
      <div class="room-gallery__slide swiper-slide">
        <img src="${src}" alt="${this._room.name} 객실 이미지 ${index + 1}" />
      </div>
    `).join('');
    const thumbnails = images.map((src, index) => `
      <button class="room-gallery__thumbnail${index === this.activeIndex ? ' is-active' : ''}"
        type="button" data-index="${index}" aria-label="${this._room.name} 이미지 ${index + 1} 보기"
        aria-pressed="${index === this.activeIndex}">
        <img src="${src}" alt="" />
      </button>
    `).join('');

    this.innerHTML = `
      <div class="room-gallery">
        <div class="room-gallery__slider swiper" aria-label="${this._room.name} 객실 이미지 갤러리">
          <div class="swiper-wrapper">${slides}</div>
          <button class="room-gallery__prev" type="button" aria-label="이전 객실 이미지">‹</button>
          <button class="room-gallery__next" type="button" aria-label="다음 객실 이미지">›</button>
          <div class="room-gallery__pagination swiper-pagination" aria-label="객실 이미지 페이지"></div>
        </div>
        <div class="room-gallery__thumbnails" aria-label="객실 이미지 선택">${thumbnails}</div>
      </div>
    `;

    this.querySelectorAll('.room-gallery__thumbnail').forEach(button => {
      button.addEventListener('click', () => {
        this.slider?.slideTo(Number(button.dataset.index));
      });
    });

    this.initializeSlider();
  }

  async initializeSlider() {
    let Swiper;

    try {
      ({ default: Swiper } = await import('https://cdn.jsdelivr.net/npm/swiper@12/swiper-bundle.min.mjs'));
    } catch {
      this.querySelector('.room-gallery__slider')?.classList.add('is-unavailable');
      return;
    }
    if (!this.isConnected || !this._room) return;

    this.slider = new Swiper(this.querySelector('.room-gallery__slider'), {
      initialSlide: this.activeIndex,
      speed: 500,
      slidesPerView: 1,
      spaceBetween: 0,
      grabCursor: true,
      navigation: {
        prevEl: this.querySelector('.room-gallery__prev'),
        nextEl: this.querySelector('.room-gallery__next'),
      },
      pagination: {
        el: this.querySelector('.room-gallery__pagination'),
        clickable: true,
      },
      keyboard: {
        enabled: true,
      },
      on: {
        slideChange: slider => {
          this.activeIndex = slider.activeIndex;
          this.querySelectorAll('.room-gallery__thumbnail').forEach((thumbnail, index) => {
            const isActive = index === this.activeIndex;
            thumbnail.classList.toggle('is-active', isActive);
            thumbnail.setAttribute('aria-pressed', String(isActive));
          });
        },
      },
    });
  }
}

if (!customElements.get('room-gallery')) customElements.define('room-gallery', RoomGallery);
