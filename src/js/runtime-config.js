const localHosts = new Set(['localhost', '127.0.0.1']);
const isLiveServer = window.location.protocol === 'http:' && window.location.port === '5500';

// GitHub Pages deployment replaces this file with the public Chat API URL through
// the CHAT_API_BASE_URL repository variable. It must never contain the LLM URL or key.
export const CHAT_API_BASE_URL = localHosts.has(window.location.hostname)
  ? 'http://127.0.0.1:3001'
  : isLiveServer
    ? `http://${window.location.hostname}:3001`
    : '';
