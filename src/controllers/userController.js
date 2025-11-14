/**
 * User Controller
 *
 * Handles user-related operations:
 * - Registration
 * - Login/Logout
 * - Profile management
 * - Authentication
 */

const bcrypt = require('bcrypt');
const userStore = require('../models/userStore');
const { wantsJson } = require('../utils/requestFormat');

const BCRYPT_ROUNDS = Number.parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'focusflow.sid';

function buildRegisterErrors({ username, email, password, passwordConfirm }) {
  const errors = {};
  const trimmedUsername = (username || '').trim();
  const trimmedEmail = (email || '').trim();
  const trimmedPassword = password || '';
  const trimmedPasswordConfirm = passwordConfirm || '';

  if (!trimmedUsername) {
    errors.username = 'Choose a display name.';
  } else if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
    errors.username = 'Username must be between 3 and 30 characters.';
  }

  if (!trimmedEmail) {
    errors.email = 'Email is required.';
  } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmedEmail)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!trimmedPassword) {
    errors.password = 'Create a password.';
  } else if (trimmedPassword.length < 8) {
    errors.password = 'Use at least 8 characters.';
  }

  if (trimmedPasswordConfirm && trimmedPassword !== trimmedPasswordConfirm) {
    errors.passwordConfirm = 'Passwords must match.';
  }

  return errors;
}

function buildLoginErrors({ email, password }) {
  const errors = {};
  if (!(email || '').trim()) {
    errors.email = 'Email is required.';
  }
  if (!password) {
    errors.password = 'Password is required.';
  }
  return errors;
}

function handleErrorResponse(req, res, view, statusCode, payload) {
  if (wantsJson(req)) {
    return res.status(statusCode).json({ ok: false, ...payload });
  }
  return res.status(statusCode).render(view, {
    title: payload.title,
    errors: payload.errors,
    values: payload.values,
    csrfToken: req.csrfToken(),
  });
}

function presentUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt,
  };
}

function authenticateSession(req, user) {
  req.session.user = {
    id: user.id,
    username: user.username,
    email: user.email,
  };
}

/**
 * GET /users/register
 * Display registration form
 */
exports.getRegister = (req, res) => {
  res.render('auth/register', {
    title: 'Create Account',
    errors: {},
    values: {},
    csrfToken: req.csrfToken(),
  });
};

/**
 * POST /users/register
 * Process registration form
 */
exports.postRegister = async (req, res, next) => {
  try {
    const { username, email, password, passwordConfirm } = req.body;
    const values = { username, email };
    const errors = buildRegisterErrors({
      username,
      email,
      password,
      passwordConfirm,
    });

    if (Object.keys(errors).length > 0) {
      return handleErrorResponse(req, res, 'auth/register', 422, {
        title: 'Create Account',
        errors,
        values,
      });
    }

    const [existingEmail, existingUsername] = await Promise.all([
      userStore.findByEmail(email),
      userStore.findByUsername(username),
    ]);

    if (existingEmail) {
      errors.email = 'That email is already registered.';
    }
    if (existingUsername) {
      errors.username = 'That username is already taken.';
    }

    if (Object.keys(errors).length > 0) {
      return handleErrorResponse(req, res, 'auth/register', 422, {
        title: 'Create Account',
        errors,
        values,
      });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const result = await userStore.createUser({
      username,
      email,
      passwordHash,
    });

    if (!result.ok) {
      if (result.reason === 'USERNAME_TAKEN') {
        errors.username = 'That username is already taken.';
      } else if (result.reason === 'EMAIL_TAKEN') {
        errors.email = 'That email is already registered.';
      } else {
        errors.form = 'We could not create your account. Try again.';
      }
      return handleErrorResponse(req, res, 'auth/register', 422, {
        title: 'Create Account',
        errors,
        values,
      });
    }

    authenticateSession(req, result.user);
    req.session.flash = {
      type: 'success',
      heading: 'Welcome to FocusFlow!',
    };
    const redirectTo = req.session.redirectTo || '/focus';
    delete req.session.redirectTo;

    if (wantsJson(req)) {
      return res.status(201).json({
        ok: true,
        user: presentUser(result.user),
        redirectTo,
      });
    }

    return res.redirect(redirectTo);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /users/login
 * Display login form
 */
exports.getLogin = (req, res) => {
  res.render('auth/login', {
    title: 'Log In',
    errors: {},
    values: {},
    csrfToken: req.csrfToken(),
  });
};

/**
 * POST /users/login
 * Process login form
 */
exports.postLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const values = { email };
    const errors = buildLoginErrors({ email, password });

    if (Object.keys(errors).length > 0) {
      return handleErrorResponse(req, res, 'auth/login', 422, {
        title: 'Log In',
        errors,
        values,
      });
    }

    const user = await userStore.findByEmail(email);
    if (!user) {
      errors.form = 'Invalid email or password.';
      return handleErrorResponse(req, res, 'auth/login', 401, {
        title: 'Log In',
        errors,
        values,
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      errors.form = 'Invalid email or password.';
      return handleErrorResponse(req, res, 'auth/login', 401, {
        title: 'Log In',
        errors,
        values,
      });
    }

    authenticateSession(req, user);
    await userStore.updateLastLogin(user.id);

    req.session.flash = {
      type: 'success',
      heading: 'Welcome back!',
    };

    const redirectTo = req.session.redirectTo || '/focus';
    delete req.session.redirectTo;

    if (wantsJson(req)) {
      return res.status(200).json({
        ok: true,
        user: presentUser(user),
        redirectTo,
      });
    }

    return res.redirect(redirectTo);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /users/logout
 * Logout user
 */
exports.postLogout = (req, res) => {
  const respondJson = wantsJson(req);
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      res.clearCookie(SESSION_COOKIE_NAME);
      if (respondJson) {
        return res.status(500).json({ ok: false, error: 'LOGOUT_FAILED' });
      }
      req.session = null;
      return res.redirect('/auth/login');
    }

    res.clearCookie(SESSION_COOKIE_NAME);
    if (respondJson) {
      return res.json({ ok: true });
    }
    return res.redirect('/');
  });
};

// Add more controller methods as needed
