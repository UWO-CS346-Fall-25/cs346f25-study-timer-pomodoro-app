const supabase = require('../lib/supabaseClient');

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
  };
}

async function findByEmail(email) {
  const normalized = (email || '').trim();
  if (!normalized) return null;

  const { data, error } = await supabase
    .from('focus_users')
    .select('*')
    .eq('email', normalized)
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to find user by email: ${error.message}`);
  }

  return mapRow(data);
}

async function findByUsername(username) {
  const normalized = (username || '').trim();
  if (!normalized) return null;

  const { data, error } = await supabase
    .from('focus_users')
    .select('*')
    .eq('username', normalized)
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to find user by username: ${error.message}`);
  }

  return mapRow(data);
}

async function findById(id) {
  const { data, error } = await supabase
    .from('focus_users')
    .select('*')
    .eq('id', id)
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to find user by id: ${error.message}`);
  }

  return mapRow(data);
}

async function createUser({ username, email, passwordHash }) {
  const trimmedUsername = (username || '').trim();
  const trimmedEmail = (email || '').trim();

  const payload = {
    username: trimmedUsername,
    email: trimmedEmail,
    password_hash: passwordHash,
  };

  const { data, error } = await supabase
    .from('focus_users')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      const detail = error.details || '';
      if (detail.includes('username')) {
        return { ok: false, reason: 'USERNAME_TAKEN' };
      }
      if (detail.includes('email')) {
        return { ok: false, reason: 'EMAIL_TAKEN' };
      }
      return { ok: false, reason: 'DUPLICATE_VALUE' };
    }
    throw new Error(`Failed to create user: ${error.message}`);
  }

  return {
    ok: true,
    user: mapRow(data),
  };
}

async function updateLastLogin(id) {
  const { data, error } = await supabase
    .from('focus_users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to update last login: ${error.message}`);
  }

  return mapRow(data);
}

module.exports = {
  createUser,
  findByEmail,
  findByUsername,
  findById,
  updateLastLogin,
};
