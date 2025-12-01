const util = require('util');

function formatMeta(meta) {
  if (!meta) return '';
  try {
    if (typeof meta === 'string') return meta;
    return util.inspect(meta, { depth: 2, breakLength: Infinity });
  } catch {
    return '[unserializable meta]';
  }
}

function log(level, context, message, meta) {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level}] [${context}] ${message}`;
  const tail = meta ? ` | ${formatMeta(meta)}` : '';
  if (level === 'ERROR') {
    console.error(base + tail);
  } else if (level === 'WARN') {
    console.warn(base + tail);
  } else {
    console.log(base + tail);
  }
}

module.exports = {
  info: (context, message, meta) => log('INFO', context, message, meta),
  warn: (context, message, meta) => log('WARN', context, message, meta),
  error: (context, message, meta) => log('ERROR', context, message, meta),
};
