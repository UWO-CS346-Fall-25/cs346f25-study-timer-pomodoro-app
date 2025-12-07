/**
 * Motivation Controller
 *
 * Fetches motivational quotes from the motivationService and renders
 * the Study Motivation page. Includes refresh logic and error fallbacks.
 */

const motivationService = require('../services/motivationService');
const logger = require('../utils/logger');

/**
 * Helper: fetchQuote
 * Purpose: Wraps motivationService.getQuote() with error handling and logging.
 * Input: options.force (boolean) to bypass cache
 * Output: { quote, error }
 */
async function fetchQuote(options = {}) {
  logger.info('MotivationController#fetchQuote', 'Fetching quote', options);
  try {
    const quote = await motivationService.getQuote(options);
    logger.info('MotivationController#fetchQuote', 'Quote fetch success');
    return { quote, error: null };
  } catch (error) {
    logger.error('MotivationController#fetchQuote', 'Failed to fetch quote', {
      error: error.message,
    });
    return {
      quote: null,
      error:
        'We could not reach the motivation service right now. Try again in a moment or refresh the page.',
    };
  }
}

/**
 * Controller: getMotivation
 * Purpose: Displays the main motivation page with an initial quote.
 * Input: No params; reads req.csrfToken().
 * Output: Renders "motivation" EJS.
 */
exports.getMotivation = async (req, res) => {
  logger.info('MotivationController#getMotivation', 'Rendering motivation page');
  const { quote, error } = await fetchQuote();

  res.render('motivation', {
    title: 'Study Motivation',
    quote,
    error,
    csrfToken: req.csrfToken(),
    flash: res.locals.flash || null,
  });
};

/**
 * Controller: postRefreshMotivation
 * Purpose: Generates a new quote on POST request, updating flash messages.
 * Input: POST body unused; uses fetchQuote({ force: true })
 * Output: Redirect to /motivation OR renders page with error.
 */
exports.postRefreshMotivation = async (req, res) => {
  logger.info('MotivationController#postRefreshMotivation', 'Refreshing quote on demand');
  const { quote, error } = await fetchQuote({ force: true });

  if (!error) {
    req.session.flash = {
      type: 'success',
      heading: 'Here is a fresh dose of motivation ✨',
    };
    return res.redirect('/motivation');
  }

  logger.error('MotivationController#postRefreshMotivation', 'Failed to refresh quote', {
    error,
  });

  res.render('motivation', {
    title: 'Study Motivation',
    quote,
    error,
    csrfToken: req.csrfToken(),
    flash: res.locals.flash || null,
  });
};
