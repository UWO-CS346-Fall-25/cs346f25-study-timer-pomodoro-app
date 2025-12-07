const LEVELS = {
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
};

const env = process.env.NODE_ENV || 'development';
const enableDebug = env !== 'production';

const serializeMeta = (meta) => {
  if (!meta || typeof meta !== 'object') {
    return '';
  }
  try {
    return JSON.stringify(meta);
  } catch (err) {
    return '';
  }
};

const log = (level, scope, message, meta) => {
  if (level === 'debug' && !enableDebug) {
    return;
  }

  const timestamp = new Date().toISOString();
  const payload = serializeMeta(meta);
  const line = `[${timestamp}] [${LEVELS[level]}]${scope ? ` (${scope})` : ''} ${message}${
    payload ? ` | ${payload}` : ''
  }`;

  // eslint-disable-next-line no-console
  console[level === 'debug' ? 'log' : level](line);
};

const logger = {
  debug(scope, message, meta) {
    log('debug', scope, message, meta);
  },
  info(scope, message, meta) {
    log('info', scope, message, meta);
  },
  warn(scope, message, meta) {
    log('warn', scope, message, meta);
  },
  error(scope, message, meta) {
    log('error', scope, message, meta);
  },
};

module.exports = logger;
