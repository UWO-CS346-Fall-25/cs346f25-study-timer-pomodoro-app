/* global fetch */
const logger = require('../utils/logger');

// Base API URL
const DEFAULT_API_BASE =
  process.env.ZEN_QUOTES_API_URL || 'https://zenquotes.io/api';

// Cache TTL (default: 10 minutes)
const CACHE_TTL_MS =
  Number.parseInt(process.env.MOTIVATION_CACHE_TTL_MS || '', 10) ||
  1000 * 60 * 10;

// In-memory simple cache
let cache = {
  quote: null,
  expiresAt: 0,
};

function normalizeQuote(entry) {
  if (!entry) return null;

  return {
    text: entry.q || entry.quote || '',
    author: entry.a || entry.author || 'Unknown',
    source: entry.h || '',
  };
}

async function requestQuote() {
  const endpoint = `${DEFAULT_API_BASE.replace(/\/$/, '')}/today`;
  logger.info('MotivationService.requestQuote', 'Fetching daily quote', { endpoint });
  try {
    const response = await fetch(endpoint);

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      logger.error('MotivationService.requestQuote', 'Non-200 response', {
        status: response.status,
      });
      throw new Error(
        `ZenQuotes API request failed with status ${response.status}: ${body?.slice(0, 120)}`
      );
    }

    const payload = await response.json();

    if (!Array.isArray(payload) || payload.length === 0) {
      logger.error('MotivationService.requestQuote', 'Unexpected payload shape');
      throw new Error('ZenQuotes API returned an unexpected or empty response payload.');
    }

    const quote = normalizeQuote(payload[0]);

    if (!quote?.text) {
      logger.error('MotivationService.requestQuote', 'Quote payload missing text');
      throw new Error('ZenQuotes API did not include a quote text.');
    }

    logger.info('MotivationService.requestQuote', 'Quote fetch success', { author: quote.author });
    return quote;
  } catch (err) {
    logger.error('MotivationService.requestQuote', 'API error', { error: err.message });
    throw err;
  }
}

async function getQuote({ force = false } = {}) {
  const now = Date.now();

  if (!force && cache.quote && cache.expiresAt > now) {
    logger.info('MotivationService.getQuote', 'Returning cached quote');
    return cache.quote;
  }

  logger.info('MotivationService.getQuote', force ? 'Force refreshing quote' : 'Refreshing quote');
  try {
    const quote = await requestQuote();

    cache = {
      quote,
      expiresAt: now + CACHE_TTL_MS,
    };

    return quote;
  } catch (err) {
    logger.error('MotivationService.getQuote', 'Failed to refresh quote', {
      error: err.message,
    });
    throw err;
  }
}

module.exports = {
  getQuote,
};
