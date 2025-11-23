const motivationService = require('../services/motivationService');

async function fetchQuote(options = {}) {
  try {
    const quote = await motivationService.getQuote(options);
    return { quote, error: null };
  } catch (error) {
    console.error('Failed to fetch motivation quote', error);
    return {
      quote: null,
      error:
        'We could not reach the motivation service right now. Try again in a moment or refresh the page.',
    };
  }
}

exports.getMotivation = async (req, res) => {
  const { quote, error } = await fetchQuote();
  res.render('motivation', {
    title: 'Study Motivation',
    quote,
    error,
    csrfToken: req.csrfToken(),
    flash: res.locals.flash || null,
  });
};

exports.postRefreshMotivation = async (req, res) => {
  const { quote, error } = await fetchQuote({ force: true });

  if (!error) {
    req.session.flash = {
      type: 'success',
      heading: 'Here is a fresh dose of motivation ✨',
    };
    return res.redirect('/motivation');
  }

  res.render('motivation', {
    title: 'Study Motivation',
    quote,
    error,
    csrfToken: req.csrfToken(),
    flash: res.locals.flash || null,
  });
};
