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
  Number.parseInt(process.env.SESSION_LONG_MAX_AGE, 10) ||
  DEFAULT_SESSION_MAX_AGE * 30;

//  Helper functions

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
    return { ok: false, error };
  }

  await sendVerificationInvite(normalizedEmail, redirectTo, {
    username: normalizedUsername,
  });

  return {
    ok: true,
    authUserId: data?.user?.id || null,
    reusedExisting: false,
  };
}

async function fetchSupabaseAuthUser(user) {
  if (!user?.authUserId) return null;
  const { data, error } = await supabase.auth.admin.getUserById(
    user.authUserId
  );
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
  const confirmedAt =
    authUser.email_confirmed_at || authUser.confirmed_at || null;

  if (!confirmedAt) {
    return false;
  }

  await userStore.markEmailVerified(user.id, confirmedAt);
  return true;
}

/**
 * Controller: getRegister
 * Purpose: Display the registration page with empty form values.
 * Input: req.csrfToken()
 * Output: Renders "auth/register" view
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
 * Controller: postRegister
 * Purpose:
 *   Handle full registration flow — validation, password hashing,
 *   Supabase auth creation, local user creation, and redirect.
 *
 * Inputs:
 *   - req.body.username, email, password, passwordConfirm
 *
 * Outputs:
 *   - On success: redirect → /auth/login
 *   - On JSON request: returns { ok: true, user, redirectTo }
 *   - On error: re-render "auth/register" with validation errors
 *
 * Edge Cases:
 *   - Email already exists
 *   - Username taken
 *   - Password mismatch
 *   - Failure to send Supabase verification email
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

    return res.redirect('/auth/login');
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: getLogin
 * Purpose: Display login page with empty values and no errors.
 * Input: req.csrfToken()
 * Output: Renders "auth/login" view
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
 * Controller: getVerifyStatus
 * Purpose: Show "check your email" verification status.
 * Input: req.csrfToken()
 * Output: Renders "auth/verify"
 */
exports.getVerifyStatus = (req, res) => {
  res.render('auth/verify', {
    title: 'Check your email',
    csrfToken: req.csrfToken(),
  });
};

/**
 * Controller: postLogin
 * Purpose:
 *   Authenticate user by email + password, verify email status,
 *   establish session, optionally set long-lived cookie.
 *
 * Inputs:
 *   - req.body.email, password, rememberMe
 *
 * Outputs:
 *   - On success: redirect → previously intended page OR /focus
 *   - On JSON request: { ok, user, redirectTo }
 *   - On failure: re-render login with errors
 *
 * Edge cases:
 *   - Incorrect password
 *   - Email not found
 *   - Email not verified yet
 *   - Long session cookie
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
 * Controller: postLogout
 * Purpose:
 *   Destroy session and clear cookie.
 *
 * Inputs:
 *   - req.session
 *
 * Outputs:
 *   - JSON: { ok: true } OR
 *   - Redirect to "/" or "/auth/login"
 *
 * Edge cases:
 *   - Session destruction failure
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
