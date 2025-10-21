const crypto = require('crypto');

const sessions = [
  {
    id: crypto.randomUUID(),
    title: 'Algorithms Drill',
    focusMinutes: 25,
    breakMinutes: 5,
    cycles: 4,
    mood: 'Focused',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
  },
  {
    id: crypto.randomUUID(),
    title: 'UX Research Review',
    focusMinutes: 25,
    breakMinutes: 5,
    cycles: 3,
    mood: 'Steady',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: crypto.randomUUID(),
    title: 'Capstone Planning',
    focusMinutes: 50,
    breakMinutes: 10,
    cycles: 2,
    mood: 'Energized',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
  },
];

const MAX_SESSIONS = 20;

function listSessions() {
  return sessions
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((session) => ({
      ...session,
      createdAt: session.createdAt.toISOString(),
    }));
}

function addSession(input) {
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

  const newSession = {
    id: crypto.randomUUID(),
    title: trimmedTitle,
    focusMinutes,
    breakMinutes,
    cycles,
    mood: mood.slice(0, 40),
    createdAt: new Date(),
  };

  sessions.push(newSession);

  if (sessions.length > MAX_SESSIONS) {
    sessions.shift();
  }

  return { ok: true, session: { ...newSession, createdAt: newSession.createdAt.toISOString() } };
}

function getSummary() {
  const data = listSessions();
  if (data.length === 0) {
    return {
      totalFocusMinutes: 0,
      totalCycles: 0,
      averageFocusBlock: 0,
    };
  }

  const totalFocusMinutes = data.reduce(
    (sum, session) => sum + session.focusMinutes * session.cycles,
    0
  );
  const totalCycles = data.reduce((sum, session) => sum + session.cycles, 0);
  const averageFocusBlock = Math.round(totalFocusMinutes / totalCycles);

  return {
    totalFocusMinutes,
    totalCycles,
    averageFocusBlock,
  };
}

module.exports = {
  listSessions,
  addSession,
  getSummary,
};
