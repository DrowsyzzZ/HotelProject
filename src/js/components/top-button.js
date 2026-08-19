class TopButton extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <button class="top-button" type="button" aria-label="페이지 최상단으로 이동">
        <i class="fa-solid fa-arrow-up" aria-hidden="true"></i>
      </button>
    `;

    this.button = this.querySelector('.top-button');
    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.handleClick = this.handleClick.bind(this);

    this.button.addEventListener('click', this.handleClick);
  }

  disconnectedCallback() {
    this.button?.removeEventListener('click', this.handleClick);
  }

  handleClick() {
    window.scrollTo({
      top: 0,
      behavior: this.reduceMotion.matches ? 'auto' : 'smooth',
    });
  }
}

if (!customElements.get('top-button')) {
  customElements.define('top-button', TopButton);
}
