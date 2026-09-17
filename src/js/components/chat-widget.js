import { requestChatReply } from '../chat-api.js';

const BOT_NAME = 'AI 상담사';
const CHAT_STORAGE_KEY = 'hotel-chat-conversation';
const MAX_CONVERSATION_MESSAGES = 12;

class ChatWidget extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <section class="chat-widget" aria-label="호텔 AI 상담" data-open="false">
        <div class="chat-widget__panel" role="dialog" aria-modal="false" aria-labelledby="chat-widget-title" hidden>
          <header class="chat-widget__header">
            <div>
              <strong id="chat-widget-title">CONCIERGE</strong>
              <span>AI 상담 안내</span>
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
    this.submitButton = this.form.querySelector('button[type="submit"]');
    this.hasStarted = false;
    this.isWaitingForReply = false;
    this.loadingMessage = null;

    this.handleToggle = this.handleToggle.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    this.toggleButton.addEventListener('click', this.handleToggle);
    this.closeButton.addEventListener('click', this.handleClose);
    this.form.addEventListener('submit', this.handleSubmit);
    this.restoreConversation();
  }

  disconnectedCallback() {
    this.toggleButton?.removeEventListener('click', this.handleToggle);
    this.closeButton?.removeEventListener('click', this.handleClose);
    this.form?.removeEventListener('submit', this.handleSubmit);
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

  }

  close() {
    this.panel.hidden = true;
    this.toggleButton.setAttribute('aria-expanded', 'false');
    this.toggleButton.setAttribute('aria-label', 'AI 상담창 열기');
    this.querySelector('.chat-widget').dataset.open = 'false';
    this.toggleButton.focus();
  }

  async handleSubmit(event) {
    event.preventDefault();

    const question = this.input.value.trim();
    if (!question || this.isWaitingForReply) return;

    this.addMessage('user', question, false);
    this.input.value = '';
    this.setPendingState(true);
    this.showLoadingMessage();

    try {
      const reply = await requestChatReply(this.getConversationForRequest());
      this.removeLoadingMessage();
      this.addMessage('bot', reply, false);
      this.saveConversation();
    } catch (error) {
      this.removeLoadingMessage();
      this.addMessage(
        'bot',
        error instanceof Error && error.message
          ? error.message
          : 'AI 상담 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
        false,
      );
    } finally {
      this.setPendingState(false);
      this.input.focus();
    }
  }

  setPendingState(isPending) {
    this.isWaitingForReply = isPending;
    this.input.disabled = isPending;
    this.submitButton.disabled = isPending;
    this.form.setAttribute('aria-busy', String(isPending));
  }

  showLoadingMessage() {
    this.removeLoadingMessage();
    this.loadingMessage = this.createMessage('bot', '답변을 준비하고 있습니다.', true);
    this.loadingMessage.classList.add('chat-widget__message--loading');
    this.messages.appendChild(this.loadingMessage);
    this.messages.scrollTop = this.messages.scrollHeight;
  }

  removeLoadingMessage() {
    this.loadingMessage?.remove();
    this.loadingMessage = null;
  }

  getConversationForRequest() {
    return [...this.messages.querySelectorAll('.chat-widget__message:not(.chat-widget__message--loading)')]
      .slice(-MAX_CONVERSATION_MESSAGES)
      .map(message => ({
        role: message.classList.contains('chat-widget__message--bot') ? 'assistant' : 'user',
        content: message.querySelector('p')?.textContent ?? '',
      }));
  }

  addMessage(sender, text, shouldSave = true) {
    const message = this.createMessage(sender, text);
    this.messages.appendChild(message);
    this.messages.scrollTop = this.messages.scrollHeight;

    if (shouldSave) {
      this.saveConversation();
    }
  }

  createMessage(sender, text, isLive = false) {
    const message = document.createElement('div');
    message.className = `chat-widget__message chat-widget__message--${sender}`;

    if (isLive) message.setAttribute('aria-live', 'polite');

    const senderName = document.createElement('span');
    senderName.className = 'chat-widget__sender';
    senderName.textContent = sender === 'bot' ? BOT_NAME : '고객';

    const content = document.createElement('p');
    content.textContent = text;

    message.append(senderName, content);
    return message;
  }

  saveConversation() {
    const conversation = [...this.messages.querySelectorAll('.chat-widget__message')].map((message) => ({
      sender: message.classList.contains('chat-widget__message--bot') ? 'bot' : 'user',
      text: message.querySelector('p')?.textContent ?? '',
    }));

    sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(conversation.slice(-50)));
  }

  restoreConversation() {
    let conversation = [];

    try {
      conversation = JSON.parse(sessionStorage.getItem(CHAT_STORAGE_KEY) ?? '[]');
    } catch {
      sessionStorage.removeItem(CHAT_STORAGE_KEY);
    }

    if (!Array.isArray(conversation)) return;

    conversation.forEach((item) => {
      if ((item?.sender === 'bot' || item?.sender === 'user') && typeof item.text === 'string') {
        this.addMessage(item.sender, item.text, false);
      }
    });

    this.hasStarted = conversation.length > 0;

  }
}

if (!customElements.get('chat-widget')) {
  customElements.define('chat-widget', ChatWidget);
}

if (!document.querySelector('chat-widget')) {
  document.body.appendChild(document.createElement('chat-widget'));
}
