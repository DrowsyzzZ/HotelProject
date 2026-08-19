import './app-header.js';
import './app-footer.js';
import './top-button.js';

if (!document.querySelector('script[data-font-awesome-kit]')) {
  const fontAwesome = document.createElement('script');
  fontAwesome.src = 'https://kit.fontawesome.com/f920d5f092.js';
  fontAwesome.crossOrigin = 'anonymous';
  fontAwesome.dataset.fontAwesomeKit = '';
  document.head.append(fontAwesome);
}
