const srcRoot = new URL('../../', import.meta.url);

const ENABLE_DESKTOP_HOVER = true;

const NAV_ITEMS = [
  { key: 'about', label: 'ABOUT', children: [
    { label: '호텔 소개', href: 'index.html#about' },
    { label: '오시는길', href: 'index.html#location' },
  ] },
  { key: 'rooms', label: 'ROOMS', children: [
    { label: 'ROOM 1', href: 'html/room-detail.html?roomId=1' },
    { label: 'ROOM 2', href: 'html/room-detail.html?roomId=2' },
    { label: 'ROOM 3', href: 'html/room-detail.html?roomId=3' },
    { label: 'ROOM 4', href: 'html/room-detail.html?roomId=4' },
  ] },
  { key: 'reservation', label: 'RESERVATION', children: [
    { label: '예약 안내', href: 'html/reservation-guide.html', enabled: true },
    { label: '실시간 예약', href: 'html/room-select.html', enabled: true },
  ] },
  { key: 'community', label: 'COMMUNITY', children: [
    { label: '공지사항', href: 'index.html#notice' },
    { label: '이벤트', href: 'index.html#event' },
    { label: 'FAQ', href: 'index.html#faq' },
  ] },
];

class AppHeader extends HTMLElement {
  connectedCallback() {
    this.activeKey = null;
    this.desktopMedia = window.matchMedia('(min-width: 1001px)');
    this.render();
    this.bindEvents();

    if (!ENABLE_DESKTOP_HOVER && this.desktopMedia.matches) {
      this.openMenu('about');
    }
  }

  disconnectedCallback() {
    document.removeEventListener('click', this.handleDocumentClick);
    document.removeEventListener('keydown', this.handleKeydown);
    this.desktopMedia?.removeEventListener('change', this.handleBreakpointChange);
  }

  render() {
    const currentPath = window.location.pathname;
    const items = NAV_ITEMS.map(item => {
      const isCurrent = currentPath.includes(item.key);
      const children = item.children.map(child => `
        <li class="site-header__submenu-item">
          <a class="site-header__submenu-link" href="${new URL(child.href, srcRoot).href}"
            ${child.enabled ? '' : 'aria-disabled="true"'}>${child.label}</a>
        </li>
      `).join('');

      return `
        <li class="site-header__item" data-menu="${item.key}">
          <button class="site-header__link${isCurrent ? ' is-current' : ''}" type="button"
            aria-expanded="false" aria-controls="submenu-${item.key}">${item.label}</button>
          <ul class="site-header__submenu" id="submenu-${item.key}" aria-label="${item.label} 하위 메뉴">
            ${children}
          </ul>
        </li>
      `;
    }).join('');

    this.innerHTML = `
      <header class="site-header">
        <div class="site-header__inner">
          <a class="site-header__logo" href="${new URL('index.html', srcRoot).href}" aria-label="호텔 메인 페이지">H</a>
          <nav class="site-header__nav" aria-label="주요 메뉴">
            <ul class="site-header__menu">${items}</ul>
          </nav>
        </div>
      </header>
    `;
  }

  bindEvents() {
    const logo = this.querySelector('.site-header__logo');

    logo.addEventListener('click', event => {
      const homeUrl = new URL(logo.href);

      if (window.location.pathname !== homeUrl.pathname) return;

      event.preventDefault();
      window.history.replaceState(null, '', homeUrl.pathname);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    this.querySelectorAll('.site-header__submenu-link[aria-disabled="true"]').forEach(link => {
      link.addEventListener('click', event => event.preventDefault());
    });

    this.querySelectorAll('.site-header__item').forEach(item => {
      const button = item.querySelector('.site-header__link');
      const key = item.dataset.menu;

      button.addEventListener('click', event => {
        event.stopPropagation();
        this.toggleMenu(key);
      });
      item.addEventListener('mouseenter', () => {
        if (ENABLE_DESKTOP_HOVER && this.desktopMedia.matches) this.openMenu(key);
      });
      item.addEventListener('mouseleave', () => {
        if (ENABLE_DESKTOP_HOVER && this.desktopMedia.matches) this.closeMenu();
      });
      item.addEventListener('focusin', () => {
        if (this.desktopMedia.matches) this.openMenu(key);
      });
    });

    this.handleDocumentClick = event => {
      if (!this.contains(event.target)) this.closeMenu();
    };
    this.handleKeydown = event => {
      if (event.key === 'Escape') {
        this.closeMenu();
        this.querySelector('.site-header__link:focus')?.blur();
      }
    };
    this.handleBreakpointChange = event => {
      this.closeMenu();
      if (!ENABLE_DESKTOP_HOVER && event.matches) this.openMenu('about');
    };

    document.addEventListener('click', this.handleDocumentClick);
    document.addEventListener('keydown', this.handleKeydown);
    this.desktopMedia.addEventListener('change', this.handleBreakpointChange);
  }

  toggleMenu(key) {
    if (this.activeKey === key) this.closeMenu();
    else this.openMenu(key);
  }

  openMenu(key) {
    this.activeKey = key;
    this.querySelectorAll('.site-header__item').forEach(item => {
      const isOpen = item.dataset.menu === key;
      item.classList.toggle('is-open', isOpen);
      item.querySelector('.site-header__link').setAttribute('aria-expanded', String(isOpen));
    });
  }

  closeMenu() {
    this.activeKey = null;
    this.querySelectorAll('.site-header__item').forEach(item => {
      item.classList.remove('is-open');
      item.querySelector('.site-header__link').setAttribute('aria-expanded', 'false');
    });
  }
}

if (!customElements.get('app-header')) customElements.define('app-header', AppHeader);
