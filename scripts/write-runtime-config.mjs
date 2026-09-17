import { writeFile } from 'node:fs/promises';

const outputPath = new URL('../src/js/runtime-config.js', import.meta.url);
const configuredUrl = process.env.CHAT_API_BASE_URL?.trim();

if (!configuredUrl) {
  console.log('CHAT_API_BASE_URL is not configured. Keeping the local-safe runtime configuration.');
  process.exit(0);
}

const parsedUrl = new URL(configuredUrl);
if (parsedUrl.protocol !== 'https:') {
  throw new Error('CHAT_API_BASE_URL must use https for GitHub Pages deployment.');
}

const endpoint = configuredUrl.replace(/\/$/, '');
await writeFile(
  outputPath,
  `// Generated during GitHub Pages deployment. This URL is public and contains no credentials.\nexport const CHAT_API_BASE_URL = ${JSON.stringify(endpoint)};\n`,
);

console.log('Public Chat API runtime configuration generated.');
