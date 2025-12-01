const supabase = require('../lib/supabaseClient');
const logger = require('../utils/logger');

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at,
    authUserId: row.auth_user_id,
    emailVerifiedAt: row.email_verified_at,
    avatarUrl: row.avatar_url,
  };
}

async function findByEmail(email) {
  const normalized = (email || '').trim();
  if (!normalized) return null;

  try {
    logger.info('UserStore.findByEmail', 'Fetching user by email', { email: normalized });
    const { data, error } = await supabase
      .from('focus_users')
      .select('*')
      .eq('email', normalized)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('UserStore.findByEmail', 'Supabase error', { error: error.message });
      throw new Error(`Failed to find user by email: ${error.message}`);
    }

    return mapRow(data);
  } catch (err) {
    logger.error('UserStore.findByEmail', 'Unexpected failure', { error: err.message });
    throw err;
  }
}

async function findByUsername(username) {
  const normalized = (username || '').trim();
  if (!normalized) return null;

  try {
    logger.info('UserStore.findByUsername', 'Fetching user by username', { username: normalized });
    const { data, error } = await supabase
      .from('focus_users')
      .select('*')
      .eq('username', normalized)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('UserStore.findByUsername', 'Supabase error', { error: error.message });
      throw new Error(`Failed to find user by username: ${error.message}`);
    }

    return mapRow(data);
  } catch (err) {
    logger.error('UserStore.findByUsername', 'Unexpected failure', { error: err.message });
    throw err;
  }
}

async function findById(id) {
  try {
    logger.info('UserStore.findById', 'Fetching user by id', { id });
    const { data, error } = await supabase
      .from('focus_users')
      .select('*')
      .eq('id', id)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('UserStore.findById', 'Supabase error', { error: error.message });
      throw new Error(`Failed to find user by id: ${error.message}`);
    }

    return mapRow(data);
  } catch (err) {
    logger.error('UserStore.findById', 'Unexpected failure', { error: err.message });
    throw err;
  }
}

async function createUser({ username, email, passwordHash, authUserId = null }) {
  const trimmedUsername = (username || '').trim();
  const trimmedEmail = (email || '').trim();

  const payload = {
    username: trimmedUsername,
    email: trimmedEmail,
    password_hash: passwordHash,
    auth_user_id: authUserId,
  };

  try {
    logger.info('UserStore.createUser', 'Persisting new user', {
      username: trimmedUsername,
      email: trimmedEmail,
    });
    const { data, error } = await supabase
      .from('focus_users')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        const detail = error.details || '';
        if (detail.includes('username')) {
          logger.warn('UserStore.createUser', 'Username taken', { username: trimmedUsername });
          return { ok: false, reason: 'USERNAME_TAKEN' };
        }
        if (detail.includes('email')) {
          logger.warn('UserStore.createUser', 'Email taken', { email: trimmedEmail });
          return { ok: false, reason: 'EMAIL_TAKEN' };
        }
        return { ok: false, reason: 'DUPLICATE_VALUE' };
      }
      logger.error('UserStore.createUser', 'Supabase insert failed', { error: error.message });
      throw new Error(`Failed to create user: ${error.message}`);
    }

    logger.info('UserStore.createUser', 'User stored', { id: data.id });
    return {
      ok: true,
      user: mapRow(data),
    };
  } catch (err) {
    logger.error('UserStore.createUser', 'Unexpected failure', { error: err.message });
    throw err;
  }
}

async function updateLastLogin(id) {
  try {
    const payload = { last_login_at: new Date().toISOString() };
    logger.info('UserStore.updateLastLogin', 'Updating last login', { id });
    const { data, error } = await supabase
      .from('focus_users')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      logger.error('UserStore.updateLastLogin', 'Supabase error', { error: error.message });
      throw new Error(`Failed to update last login: ${error.message}`);
    }

    return mapRow(data);
  } catch (err) {
    logger.error('UserStore.updateLastLogin', 'Unexpected failure', { error: err.message });
    throw err;
  }
}

async function markEmailVerified(id, timestamp) {
  try {
    logger.info('UserStore.markEmailVerified', 'Marking email verified', { id });
    const { data, error } = await supabase
      .from('focus_users')
      .update({ email_verified_at: timestamp })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      logger.error('UserStore.markEmailVerified', 'Supabase error', {
        error: error.message,
      });
      throw new Error(`Failed to mark email verified: ${error.message}`);
    }

    return mapRow(data);
  } catch (err) {
    logger.error('UserStore.markEmailVerified', 'Unexpected failure', { error: err.message });
    throw err;
  }
}

async function updateUser(id, data) {
  try {
    logger.info('UserStore.updateUser', 'Updating user', { id });
    const { data: updated, error } = await supabase
      .from('focus_users')
      .update(data)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      logger.error('UserStore.updateUser', 'Supabase error', { error: error.message });
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return mapRow(updated);
  } catch (err) {
    logger.error('UserStore.updateUser', 'Unexpected failure', { error: err.message });
    throw err;
  }
}

module.exports = {
  createUser,
  findByEmail,
  findByUsername,
  findById,
  updateLastLogin,
  markEmailVerified,
  updateUser,
};
