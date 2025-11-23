/* global fetch */
const DEFAULT_API_BASE = process.env.ZEN_QUOTES_API_URL || 'https://zenquotes.io/api';
const CACHE_TTL_MS = Number.parseInt(process.env.MOTIVATION_CACHE_TTL_MS || '', 10) || 1000 * 60 * 10;

let cache = {
  quote: null,
  expiresAt: 0,
};

function normalizeQuote(entry) {
  if (!entry) {
    return null;
  }

  return {
    text: entry.q || entry.quote || '',
    author: entry.a || entry.author || 'Unknown',
    source: entry.h || '',
  };
}

async function requestQuote() {
  const endpoint = `${DEFAULT_API_BASE.replace(/\/$/, '')}/today`;
  const response = await fetch(endpoint);
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`ZenQuotes API request failed with ${response.status}: ${body?.slice(0, 120)}`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error('ZenQuotes API returned an unexpected response shape.');
  }

  const quote = normalizeQuote(payload[0]);
  if (!quote?.text) {
    throw new Error('ZenQuotes API did not include a quote.');
  }
  return quote;
}

async function getQuote({ force = false } = {}) {
  const now = Date.now();
  if (!force && cache.quote && cache.expiresAt > now) {
    return cache.quote;
  }

  const quote = await requestQuote();
  cache = {
    quote,
    expiresAt: now + CACHE_TTL_MS,
  };
  return quote;
}

module.exports = {
  getQuote,
};
