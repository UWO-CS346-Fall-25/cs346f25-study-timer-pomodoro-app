const { wantsJson } = require('../utils/requestFormat');

function requireAuth(req, res, next) {
  if (req.session?.user) {
    return next();
  }

  const respondJson = wantsJson(req);

  if (respondJson) {
    return res.status(401).json({
      ok: false,
      error: 'AUTH_REQUIRED',
      message: 'You need to be logged in to do that.',
    });
  }

  req.session.redirectTo = req.originalUrl;
  req.session.flash = {
    type: 'error',
    heading: 'Please log in to continue.',
  };
  return res.redirect('/auth/login');
}

function redirectIfAuthenticated(req, res, next) {
  if (req.session?.user) {
    return res.redirect('/focus');
  }
  return next();
}

module.exports = {
  requireAuth,
  redirectIfAuthenticated,
};
