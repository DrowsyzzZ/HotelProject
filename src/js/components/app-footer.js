class AppFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer class="site-footer">
        <strong class="site-footer__logo" aria-hidden="true">H</strong>

        <div class="site-footer__socials" aria-label="소셜 미디어">
          <a class="site-footer__social-link" href="#" aria-label="인스타그램">
            <i class="fa-brands fa-instagram" aria-hidden="true"></i>
          </a>
          <a class="site-footer__social-link" href="#" aria-label="페이스북">
            <i class="fa-brands fa-facebook-f" aria-hidden="true"></i>
          </a>
          <a class="site-footer__social-link" href="#" aria-label="유튜브">
            <i class="fa-brands fa-youtube" aria-hidden="true"></i>
          </a>
        </div>

        <address class="site-footer__info">
          <p>경기 성남시 분당구 황새울로329번길 5 한국폴리텍대학 융합기술교육원</p>
          <div class="site-footer__info-address">
            <span>사업자등록번호 000-00-00000</span>
            <span>전화 012-345-6789</span>
            <span>팩스 01-234-5678</span>
          </div>
        </address>

        <div class="site-footer__links">
          <a href="#">이용약관</a>
          <a href="#">개인정보처리방침</a>
        </div>

        <p class="site-footer__copyright">Copyright © 2025 예약연습 All rights reserved.</p>
      </footer>
    `;
  }
}

if (!customElements.get('app-footer')) {
  customElements.define('app-footer', AppFooter);
}
