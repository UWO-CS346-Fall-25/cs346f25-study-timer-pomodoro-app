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
const logger = require('../utils/logger');

const BCRYPT_ROUNDS = Number.parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'focusflow.sid';
const DEFAULT_SESSION_MAX_AGE =
  Number.parseInt(process.env.SESSION_MAX_AGE, 10) || 1000 * 60 * 60 * 24;
const LONG_SESSION_MAX_AGE =
  Number.parseInt(process.env.SESSION_LONG_MAX_AGE, 10) ||
  DEFAULT_SESSION_MAX_AGE * 30;

function resolveAppBaseUrl(req) {
  const envBase = (process.env.APP_BASE_URL || '').trim();
  if (envBase) {
    return envBase.replace(/\/+$/, '');
  }
  const host = req?.get?.('host') || req?.headers?.host;
  let protocol = req?.protocol || 'http';
  const forwardedProto = req?.headers?.['x-forwarded-proto'];
  if (forwardedProto) {
    protocol = forwardedProto.split(',')[0];
  }
  if (host) {
    return `${protocol}://${host}`.replace(/\/+$/, '');
  }
  return 'http://localhost:3000';
}

function buildVerificationRedirectUrl(baseUrl) {
  const normalizedBase =
    (baseUrl || '').trim().replace(/\/+$/, '') || 'http://localhost:3000';
  return `${normalizedBase}/auth/verify`;
}

function isSupabaseDuplicateEmailError(error) {
  const message = (error?.message || '').toLowerCase();
  return (
    message.includes('already registered') ||
    message.includes('duplicate key value') ||
    error?.status === 409 ||
    error?.status === 422
  );
}

async function findSupabaseUserByEmail(email) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail) return null;

  let page = 1;
  const perPage = 100;
  while (page && page <= 50) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) {
      console.warn('Failed to list Supabase users', error);
      return null;
    }
    const users = data?.users || [];
    const match = users.find(
      (user) => (user.email || '').trim().toLowerCase() === normalizedEmail
    );
    if (match) {
      return match;
    }
    if (!data?.nextPage || users.length < perPage) {
      break;
    }
    page = data.nextPage;
  }

  return null;
}

async function sendVerificationInvite(email, redirectTo, metadata = {}) {
  const invite = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: metadata,
  });
  if (invite.error) {
    console.warn('Failed to send Supabase verification email', invite.error);
  }
}

async function resendSignupVerification(email, redirectTo) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: redirectTo },
  });
  if (error) {
    console.warn('Failed to resend Supabase verification email', error);
  }
}

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
    avatarUrl: user.avatarUrl,
  };
}

async function createSupabaseAuthAccount({
  email,
  password,
  username,
  verificationRedirect,
}) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const normalizedUsername = (username || '').trim();
  const redirectTo = verificationRedirect || buildVerificationRedirectUrl();
  if (!normalizedEmail) {
    return {
      ok: false,
      error: new Error('Email is required for account creation.'),
    };
  }

  logger.info('UserController#createSupabaseAuthAccount', 'Creating Supabase auth user', {
    email: normalizedEmail,
  });
  const { data, error } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: false,
    user_metadata: { username: normalizedUsername },
  });

  if (error) {
    if (isSupabaseDuplicateEmailError(error)) {
      const existingUser = await findSupabaseUserByEmail(normalizedEmail);
      if (existingUser) {
        await resendSignupVerification(normalizedEmail, redirectTo);
        return {
          ok: true,
          authUserId: existingUser.id,
          reusedExisting: true,
        };
      }
    }
    logger.error('UserController#createSupabaseAuthAccount', 'Supabase admin create failed', {
      error: error.message,
    });
    return { ok: false, error };
  }

  await sendVerificationInvite(normalizedEmail, redirectTo, {
    username: normalizedUsername,
  });

  logger.info('UserController#createSupabaseAuthAccount', 'Supabase auth user created', {
    supabaseUserId: data?.user?.id,
  });

  return {
    ok: true,
    authUserId: data?.user?.id || null,
    reusedExisting: false,
  };
}

async function fetchSupabaseAuthUser(user) {
  if (!user?.authUserId) return null;
  logger.info('UserController#fetchSupabaseAuthUser', 'Fetching Supabase auth user', {
    authUserId: user.authUserId,
  });
  const { data, error } = await supabase.auth.admin.getUserById(
    user.authUserId
  );
  if (!error && data?.user) {
    return data.user;
  }
  logger.warn('UserController#fetchSupabaseAuthUser', 'Could not load Supabase auth user', {
    authUserId: user.authUserId,
    error: error?.message,
  });
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
  const confirmedAt =
    authUser.email_confirmed_at || authUser.confirmed_at || null;

  if (!confirmedAt) {
    return false;
  }

  await userStore.markEmailVerified(user.id, confirmedAt);
  logger.info('UserController#ensureEmailVerified', 'Marked email verified', {
    userId: user.id,
  });
  return true;
}

/**
 * GET /users/register
 * Display registration form
 */
/**
 * Controller: getRegister
 * Purpose: Render the registration page with blank values and CSRF token.
 * Input: Express req/res.
 * Output: auth/register view.
 */
exports.getRegister = (req, res) => {
  logger.info('UserController#getRegister', 'Rendering registration page');
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
/**
 * Controller: postRegister
 * Purpose: Validate input, create Supabase auth account, store local user, and prompt verification.
 * Input: req.body (username, email, password, passwordConfirm).
 * Output: Redirect/JSON with user + redirect path.
 */
exports.postRegister = async (req, res, next) => {
  try {
    const { username, email, password, passwordConfirm } = req.body;
    logger.info('UserController#postRegister', 'Registration attempt', {
      email,
      username,
    });
    const values = { username, email };
    const errors = buildRegisterErrors({
      username,
      email,
      password,
      passwordConfirm,
    });

    if (Object.keys(errors).length > 0) {
      logger.warn('UserController#postRegister', 'Validation failed before Supabase lookup', {
        errors,
      });
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
      logger.warn('UserController#postRegister', 'Duplicate email or username detected', {
        errors,
      });
      return handleErrorResponse(req, res, 'auth/register', 422, {
        title: 'Create Account',
        errors,
        values,
      });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const verificationRedirect = buildVerificationRedirectUrl(
      resolveAppBaseUrl(req)
    );
    let authUserId = null;
    const supabaseAccount = await createSupabaseAuthAccount({
      email,
      password,
      username,
      verificationRedirect,
    });
    if (!supabaseAccount.ok) {
      errors.form =
        supabaseAccount.error?.message ||
        'We could not trigger the verification email. Try again in a moment.';
      if (
        supabaseAccount.error?.message
          ?.toLowerCase()
          .includes('already registered') ||
        supabaseAccount.error?.status === 422
      ) {
        errors.email = 'That email is already registered.';
      }
      logger.error('UserController#postRegister', 'Supabase admin create failed', {
        error: supabaseAccount.error?.message,
      });
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

    req.session.flash = {
      type: 'success',
      heading:
        'Account created! Check your inbox to verify your email, then log in.',
    };
    const redirectTo = '/auth/login';

    if (wantsJson(req)) {
      return res.status(201).json({
        ok: true,
        user: presentUser(result.user),
        redirectTo,
      });
    }

    logger.info('UserController#postRegister', 'Registration complete awaiting verification', {
      email,
      userId: result.user.id,
    });
    return res.redirect('/auth/login');
  } catch (error) {
    logger.error('UserController#postRegister', 'Unexpected error', {
      error: error.message,
    });
    next(error);
  }
};

/**
 * Controller: getLogin
 * Purpose: Render the login form for existing users.
 * Input: Express req/res.
 * Output: auth/login view.
 */
exports.getLogin = (req, res) => {
  logger.info('UserController#getLogin', 'Rendering login page');
  res.render('auth/login', {
    title: 'Log In',
    errors: {},
    values: { email: '', rememberMe: false },
    csrfToken: req.csrfToken(),
  });
};

/**
 * Controller: getVerifyStatus
 * Purpose: Display the verification landing page linked from Supabase emails.
 * Input: Express req/res.
 * Output: auth/verify view.
 */
exports.getVerifyStatus = (req, res) => {
  logger.info('UserController#getVerifyStatus', 'Rendering verify status page');
  res.render('auth/verify', {
    title: 'Check your email',
    csrfToken: req.csrfToken(),
  });
};

/**
 * POST /users/login
 * Process login form
 */
/**
 * Controller: postLogin
 * Purpose: Authenticate user credentials and start a session.
 * Input: req.body.email/password/rememberMe.
 * Output: Redirect or JSON {user, redirectTo}.
 */
exports.postLogin = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;
    const rememberMeChecked =
      rememberMe === 'on' || rememberMe === true || rememberMe === 'true';
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
      logger.warn('UserController#postLogin', 'Email not found', { email });
      return handleErrorResponse(req, res, 'auth/login', 401, {
        title: 'Log In',
        errors,
        values,
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      errors.form = 'Invalid email or password.';
      logger.warn('UserController#postLogin', 'Password mismatch', { email });
      return handleErrorResponse(req, res, 'auth/login', 401, {
        title: 'Log In',
        errors,
        values,
      });
    }

    const verified = await ensureEmailVerified(user);
    if (!verified) {
      errors.form =
        'Please verify your email before logging in. Check your inbox for the link.';
      return handleErrorResponse(req, res, 'auth/login', 401, {
        title: 'Log In',
        errors,
        values,
      });
    }

    authenticateSession(req, user);
    await userStore.updateLastLogin(user.id);
    req.session.rememberMe = rememberMeChecked;
    req.session.cookie.maxAge = rememberMeChecked
      ? LONG_SESSION_MAX_AGE
      : DEFAULT_SESSION_MAX_AGE;

    req.session.flash = {
      type: 'success',
      heading: 'Welcome back!',
    };

    const redirectTo = req.session.redirectTo || '/focus';
    delete req.session.redirectTo;

    logger.info('UserController#postLogin', 'Login successful', {
      userId: user.id,
      redirectTo,
    });

    if (wantsJson(req)) {
      return res.status(200).json({
        ok: true,
        user: presentUser(user),
        redirectTo,
      });
    }

    return res.redirect(redirectTo);
  } catch (error) {
    logger.error('UserController#postLogin', 'Unhandled error during login', {
      error: error.message,
    });
    next(error);
  }
};

/**
 * Controller: postLogout
 * Purpose: Destroy the session and redirect or respond with JSON.
 * Input: Express req/res.
 * Output: Redirect to /auth/login or JSON {ok:true}.
 */
exports.postLogout = (req, res) => {
  const respondJson = wantsJson(req);
  logger.info('UserController#postLogout', 'Destroying session', {
    userId: req.session.user?.id,
  });
  req.session.destroy((err) => {
    if (err) {
      logger.error('UserController#postLogout', 'Failed to destroy session', {
        error: err.message,
      });
      res.clearCookie(SESSION_COOKIE_NAME);
      if (respondJson) {
        return res.status(500).json({ ok: false, error: 'LOGOUT_FAILED' });
      }
      req.session = null;
      return res.redirect('/auth/login');
    }

    res.clearCookie(SESSION_COOKIE_NAME);
    if (respondJson) {
      logger.info('UserController#postLogout', 'Logout complete (JSON response)');
      return res.json({ ok: true });
    }
    logger.info('UserController#postLogout', 'Logout complete');
    return res.redirect('/');
  });
};

// Add more controller methods as needed
