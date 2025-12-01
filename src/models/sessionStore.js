const supabase = require('../lib/supabaseClient');
const logger = require('../utils/logger');

function mapRowToSession(row) {
  return {
    id: row.id,
    title: row.title,
    focusMinutes: row.focus_minutes,
    breakMinutes: row.break_minutes,
    cycles: row.cycles,
    mood: row.mood,
    createdAt: row.created_at,
  };
}

function calculateSummary(list = []) {
  if (list.length === 0) {
    return {
      totalFocusMinutes: 0,
      totalCycles: 0,
      averageFocusBlock: 0,
    };
  }

  const totals = list.reduce(
    (acc, session) => {
      acc.focusMinutes += session.focusMinutes * session.cycles;
      acc.cycles += session.cycles;
      return acc;
    },
    { focusMinutes: 0, cycles: 0 }
  );

  return {
    totalFocusMinutes: totals.focusMinutes,
    totalCycles: totals.cycles,
    averageFocusBlock: Math.round(totals.focusMinutes / totals.cycles),
  };
}

async function listSessions(userId) {
  if (!userId) {
    return [];
  }

  try {
    logger.info('SessionStore.listSessions', 'Fetching focus sessions', { userId });
    const { data, error } = await supabase
      .from('focus_sessions')
      .select(
        'id, title, focus_minutes, break_minutes, cycles, mood, created_at, user_id'
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('SessionStore.listSessions', 'Supabase error', {
        userId,
        error: error.message,
      });
      throw new Error(`Failed to fetch focus sessions: ${error.message}`);
    }

    const mapped = (data || []).map(mapRowToSession);
    logger.info('SessionStore.listSessions', 'Fetched focus sessions', {
      userId,
      count: mapped.length,
    });
    return mapped;
  } catch (err) {
    logger.error('SessionStore.listSessions', 'Unexpected failure', {
      userId,
      error: err.message,
    });
    throw err;
  }
}

async function addSession(userId, input) {
  if (!userId) {
    throw new Error('User ID is required to create a session.');
  }
  const trimmedTitle = (input.title || '').trim();
  const focusMinutes = Number.parseInt(input.focusMinutes, 10);
  const breakMinutes = Number.parseInt(input.breakMinutes, 10);
  const cycles = Number.parseInt(input.cycles, 10);
  const mood = (input.mood || '').trim() || 'Neutral';

  const errors = {};

  if (!trimmedTitle) {
    errors.title = 'Give this session a descriptive name.';
  } else if (trimmedTitle.length > 60) {
    errors.title = 'Session name should be 60 characters or less.';
  }

  if (Number.isNaN(focusMinutes) || focusMinutes < 10 || focusMinutes > 90) {
    errors.focusMinutes = 'Focus minutes should be between 10 and 90.';
  }

  if (Number.isNaN(breakMinutes) || breakMinutes < 3 || breakMinutes > 30) {
    errors.breakMinutes = 'Break minutes should be between 3 and 30.';
  }

  if (Number.isNaN(cycles) || cycles < 1 || cycles > 8) {
    errors.cycles = 'Pick between 1 and 8 cycles.';
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const payload = {
    title: trimmedTitle,
    focus_minutes: focusMinutes,
    break_minutes: breakMinutes,
    cycles,
    mood: mood.slice(0, 40),
    user_id: userId,
  };

  try {
    logger.info('SessionStore.addSession', 'Persisting focus session', {
      userId,
      payload: { ...payload, mood: payload.mood },
    });
    const { data, error } = await supabase
      .from('focus_sessions')
      .insert(payload)
      .select()
      .single();

    if (error) {
      logger.error('SessionStore.addSession', 'Supabase insert failed', {
        userId,
        error: error.message,
      });
      throw new Error(`Failed to save focus session: ${error.message}`);
    }

    logger.info('SessionStore.addSession', 'Focus session stored', {
      userId,
      sessionId: data.id,
    });
    return {
      ok: true,
      session: mapRowToSession(data),
    };
  } catch (err) {
    logger.error('SessionStore.addSession', 'Unexpected failure', {
      userId,
      error: err.message,
    });
    throw err;
  }
}

async function getSummaryForUser(userId) {
  const sessions = await listSessions(userId);
  return calculateSummary(sessions);
}

module.exports = {
  listSessions,
  addSession,
  getSummaryForUser,
  calculateSummary,
};
