const BOT_NAME = 'AI 상담사';
const OFF_HOURS_MESSAGE = '네 고객님 지금은 업무시간이 아니니 업무시간에 문의하십시오.';

class ChatWidget extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <section class="chat-widget" aria-label="호텔 AI 상담" data-open="false">
        <div class="chat-widget__panel" role="dialog" aria-modal="false" aria-labelledby="chat-widget-title" hidden>
          <header class="chat-widget__header">
            <div>
              <strong id="chat-widget-title">호텔 상담</strong>
              <span>AI 상담사</span>
            </div>
            <button class="chat-widget__close" type="button" aria-label="상담창 닫기">×</button>
          </header>

          <div class="chat-widget__messages" aria-live="polite" aria-label="상담 메시지"></div>

          <form class="chat-widget__form">
            <label class="sr-only" for="chat-widget-input">문의 내용</label>
            <input id="chat-widget-input" type="text" placeholder="문의 내용을 입력하세요" autocomplete="off" />
            <button type="submit">전송</button>
          </form>
        </div>

        <button class="chat-widget__toggle" type="button" aria-label="AI 상담창 열기" aria-expanded="false">
          <i class="fa-regular fa-comments" aria-hidden="true"></i>
          <span>상담</span>
        </button>
      </section>
    `;

    this.panel = this.querySelector('.chat-widget__panel');
    this.toggleButton = this.querySelector('.chat-widget__toggle');
    this.closeButton = this.querySelector('.chat-widget__close');
    this.messages = this.querySelector('.chat-widget__messages');
    this.form = this.querySelector('.chat-widget__form');
    this.input = this.querySelector('#chat-widget-input');
    this.hasStarted = false;
    this.replyTimer = null;

    this.handleToggle = this.handleToggle.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    this.toggleButton.addEventListener('click', this.handleToggle);
    this.closeButton.addEventListener('click', this.handleClose);
    this.form.addEventListener('submit', this.handleSubmit);
  }

  disconnectedCallback() {
    this.toggleButton?.removeEventListener('click', this.handleToggle);
    this.closeButton?.removeEventListener('click', this.handleClose);
    this.form?.removeEventListener('submit', this.handleSubmit);
    window.clearTimeout(this.replyTimer);
  }

  handleToggle() {
    if (this.panel.hidden) {
      this.open();
    } else {
      this.close();
    }
  }

  handleClose() {
    this.close();
  }

  open() {
    this.panel.hidden = false;
    this.toggleButton.setAttribute('aria-expanded', 'true');
    this.toggleButton.setAttribute('aria-label', 'AI 상담창 닫기');
    this.querySelector('.chat-widget').dataset.open = 'true';

    if (!this.hasStarted) {
      this.addMessage('bot', `상대방은 ${BOT_NAME} 입니다.`);
      this.hasStarted = true;
    }

    window.requestAnimationFrame(() => this.input.focus());
  }

  close() {
    this.panel.hidden = true;
    this.toggleButton.setAttribute('aria-expanded', 'false');
    this.toggleButton.setAttribute('aria-label', 'AI 상담창 열기');
    this.querySelector('.chat-widget').dataset.open = 'false';
    this.toggleButton.focus();
  }

  handleSubmit(event) {
    event.preventDefault();

    const question = this.input.value.trim();
    if (!question) return;

    this.addMessage('user', question);
    this.input.value = '';
    this.input.disabled = true;

    window.clearTimeout(this.replyTimer);
    this.replyTimer = window.setTimeout(() => {
      this.addMessage('bot', OFF_HOURS_MESSAGE);
      this.input.disabled = false;
      this.input.focus();
    }, 500);
  }

  addMessage(sender, text) {
    const message = document.createElement('div');
    message.className = `chat-widget__message chat-widget__message--${sender}`;

    const senderName = document.createElement('span');
    senderName.className = 'chat-widget__sender';
    senderName.textContent = sender === 'bot' ? BOT_NAME : '고객';

    const content = document.createElement('p');
    content.textContent = text;

    message.append(senderName, content);
    this.messages.appendChild(message);
    this.messages.scrollTop = this.messages.scrollHeight;
  }
}

if (!customElements.get('chat-widget')) {
  customElements.define('chat-widget', ChatWidget);
}

if (!document.querySelector('chat-widget')) {
  document.body.appendChild(document.createElement('chat-widget'));
}
