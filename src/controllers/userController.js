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
const supabase = require('../lib/supabaseClient');

const BCRYPT_ROUNDS = Number.parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'focusflow.sid';
const DEFAULT_SESSION_MAX_AGE =
  Number.parseInt(process.env.SESSION_MAX_AGE, 10) || 1000 * 60 * 60 * 24;
const LONG_SESSION_MAX_AGE =
  Number.parseInt(process.env.SESSION_LONG_MAX_AGE, 10) || DEFAULT_SESSION_MAX_AGE * 30;

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

async function createSupabaseAuthAccount({ email, password, username }) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: { username },
  });

  if (error) {
    return { ok: false, error };
  }

  const invite = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.APP_BASE_URL || 'http://localhost:3000'}/auth/login`,
  });
  if (invite.error) {
    console.warn('Failed to send Supabase verification email', invite.error);
  }

  return {
    ok: true,
    authUserId: data?.user?.id || null,
  };
}

async function fetchSupabaseAuthUser(user) {
  if (!user?.authUserId) return null;
  const { data, error } = await supabase.auth.admin.getUserById(user.authUserId);
  if (!error && data?.user) {
    return data.user;
  }
  return null;
}

async function ensureEmailVerified(user) {
  if (!user) return true;
  if (user.emailVerifiedAt) {
    return true;
  }

  const authUser = await fetchSupabaseAuthUser(user);
  if (!authUser) {
    // If we cannot fetch the auth user, allow login to proceed.
    return true;
  }
  const confirmedAt = authUser.email_confirmed_at || authUser.confirmed_at || null;

  if (!confirmedAt) {
    return false;
  }

  await userStore.markEmailVerified(user.id, confirmedAt);
  return true;
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
    let authUserId = null;
    const supabaseAccount = await createSupabaseAuthAccount({ email, password, username });
    if (!supabaseAccount.ok) {
      errors.form =
        supabaseAccount.error?.message ||
        'We could not trigger the verification email. Try again in a moment.';
      if (
        supabaseAccount.error?.message?.toLowerCase().includes('already registered') ||
        supabaseAccount.error?.status === 422
      ) {
        errors.email = 'That email is already registered.';
      }
      return handleErrorResponse(req, res, 'auth/register', 422, {
        title: 'Create Account',
        errors,
        values,
      });
    }
    authUserId = supabaseAccount.authUserId;

    const result = await userStore.createUser({
      username,
      email,
      passwordHash,
      authUserId,
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
      heading: 'Welcome to FocusFlow! Check your inbox to verify your email.',
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
    values: { email: '', rememberMe: false },
    csrfToken: req.csrfToken(),
  });
};

/**
 * POST /users/login
 * Process login form
 */
exports.postLogin = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;
    const rememberMeChecked = rememberMe === 'on' || rememberMe === true || rememberMe === 'true';
    const values = { email, rememberMe: rememberMeChecked };
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

    const verified = await ensureEmailVerified(user);
    if (!verified) {
      errors.form = 'Please verify your email before logging in. Check your inbox for the link.';
      return handleErrorResponse(req, res, 'auth/login', 401, {
        title: 'Log In',
        errors,
        values,
      });
    }

    authenticateSession(req, user);
    await userStore.updateLastLogin(user.id);
    req.session.rememberMe = rememberMeChecked;
    req.session.cookie.maxAge = rememberMeChecked ? LONG_SESSION_MAX_AGE : DEFAULT_SESSION_MAX_AGE;

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
