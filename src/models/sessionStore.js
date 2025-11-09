const supabase = require('../lib/supabaseClient');

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

async function listSessions() {
  const { data, error } = await supabase
    .from('focus_sessions')
    .select(
      'id, title, focus_minutes, break_minutes, cycles, mood, created_at'
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch focus sessions: ${error.message}`);
  }

  return (data || []).map(mapRowToSession);
}

async function addSession(input) {
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
  };

  const { data, error } = await supabase
    .from('focus_sessions')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save focus session: ${error.message}`);
  }

  return {
    ok: true,
    session: mapRowToSession(data),
  };
}

async function getSummary() {
  const sessions = await listSessions();
  return calculateSummary(sessions);
}

module.exports = {
  listSessions,
  addSession,
  getSummary,
  calculateSummary,
};
