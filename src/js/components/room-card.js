const imageRoot = new URL('../../assets/images/', import.meta.url);
const detailPage = new URL('../../html/room-detail.html', import.meta.url);

class RoomCard extends HTMLElement {
  set room(value) {
    this._room = value;
    this.render();
  }

  get room() {
    return this._room;
  }

  connectedCallback() {
    this.render();
  }

  render() {
    if (!this.isConnected || !this._room) return;

    const url = new URL(detailPage);
    url.searchParams.set('roomId', this._room.id);
    const imageUrl = new URL(this._room.images[0], imageRoot).href;

    this.innerHTML = `
      <a class="room-card" href="${url.href}" aria-label="${this._room.name} 객실 상세 보기">
        <img class="room-card__image" src="${imageUrl}" alt="${this._room.name} 객실" />
        <span class="room-card__overlay" aria-hidden="true"></span>
        <span class="room-card__label">${this._room.name_eng.toUpperCase()}</span>
        <img class="room-card__arrow" src="${new URL('room-arrow.svg', imageRoot).href}" alt="" />
      </a>
    `;
  }
}

if (!customElements.get('room-card')) customElements.define('room-card', RoomCard);
