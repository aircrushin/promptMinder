import { ApiError } from '@/lib/api-error';

const READER_BASE_URL = 'https://r.jina.ai/';
const READER_ACCEPT_HEADER = 'text/plain, text/markdown;q=0.9, */*;q=0.1';
const MAX_CONTENT_LENGTH_BYTES = 5_000_000;
const MAX_CONTENT_CHARACTERS = 1_000_000;
const REQUEST_TIMEOUT_MS = 20_000;

function isPrivateIPv4(ip) {
  const parts = ip.split('.').map((part) => Number(part));

  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [a, b] = parts;

  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;

  return false;
}

function isIPv4(hostname) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
}

function isIPv6(hostname) {
  return hostname.includes(':');
}

function isBlockedHostname(hostname) {
  const normalized = hostname.trim().toLowerCase();

  if (!normalized) return true;
  if (normalized === 'localhost') return true;
  if (normalized.endsWith('.localhost')) return true;
  if (normalized.endsWith('.local')) return true;

  if (isIPv4(normalized)) {
    return isPrivateIPv4(normalized);
  }

  if (isIPv6(normalized)) {
    if (normalized === '::' || normalized === '::1') return true;
    if (normalized.startsWith('fe80:')) return true;
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  }

  return false;
}

function createApiError(status, code, message) {
  return new ApiError(status, message, { code });
}

function normalizeUrlForReading(input) {
  const raw = String(input || '').trim();

  if (!raw) {
    throw createApiError(400, 'URL_REQUIRED', 'URL is required');
  }

  const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(raw)
    ? raw
    : `https://${raw}`;

  let url;

  try {
    url = new URL(withScheme);
  } catch {
    throw createApiError(400, 'INVALID_URL_FORMAT', 'URL format is invalid');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw createApiError(400, 'UNSUPPORTED_PROTOCOL', 'Only http and https URLs are supported');
  }

  if (url.username || url.password) {
    throw createApiError(400, 'CREDENTIALS_NOT_ALLOWED', 'URLs with credentials are not supported');
  }

  if (isBlockedHostname(url.hostname)) {
    throw createApiError(400, 'BLOCKED_HOST', 'This host is not allowed');
  }

  return url;
}

function buildJinaReaderUrl(url) {
  return `${READER_BASE_URL}${url.href}`;
}

async function readUrlAsText(input, options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const url = normalizeUrlForReading(input);
  const jinaUrl = buildJinaReaderUrl(url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetchImpl(jinaUrl, {
      signal: controller.signal,
      headers: {
        accept: READER_ACCEPT_HEADER,
      },
    });

    if (!response.ok) {
      throw createApiError(
        502,
        'UPSTREAM_FETCH_FAILED',
        `Reader upstream request failed with status ${response.status}`
      );
    }

    const contentLength = Number(response.headers.get('content-length') || '0');

    if (contentLength && contentLength > MAX_CONTENT_LENGTH_BYTES) {
      throw createApiError(413, 'CONTENT_TOO_LARGE', 'The fetched content is too large');
    }

    const raw = await response.text();
    const cleaned = raw.replace(/\r\n/g, '\n').trim();
    const truncated = cleaned.length > MAX_CONTENT_CHARACTERS;
    const content = truncated
      ? `${cleaned.slice(0, MAX_CONTENT_CHARACTERS)}\n\n[content truncated]`
      : cleaned;

    return {
      sourceUrl: url.href,
      jinaUrl,
      content,
      truncated,
    };
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw createApiError(504, 'FETCH_TIMEOUT', 'Reader upstream request timed out');
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw createApiError(500, 'READER_REQUEST_FAILED', error?.message || 'Reader request failed');
  } finally {
    clearTimeout(timeout);
  }
}

export {
  buildJinaReaderUrl,
  normalizeUrlForReading,
  readUrlAsText,
};
