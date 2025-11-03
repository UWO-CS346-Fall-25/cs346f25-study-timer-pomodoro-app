const crypto = require('crypto');

const goals = [
  {
    id: crypto.randomUUID(),
    title: 'Finish algorithms worksheet',
    targetFocusMinutes: 120,
    priority: 'High',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1),
    setReminder: true,
    notes: 'Pair it with the Discrete Math recap session.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
  },
  {
    id: crypto.randomUUID(),
    title: 'Prep UX critique slides',
    targetFocusMinutes: 90,
    priority: 'Medium',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
    setReminder: false,
    notes: 'Highlight the two competitive audits from Week 6.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
  },
];

const MAX_GOALS = 15;

const PRIORITY_LEVELS = ['High', 'Medium', 'Low'];

function serialiseGoal(goal) {
  return {
    ...goal,
    dueDate: goal.dueDate.toISOString(),
    createdAt: goal.createdAt.toISOString(),
  };
}

function listGoals() {
  return goals
    .slice()
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .map(serialiseGoal);
}

function addGoal(input) {
  const title = (input.title || '').trim();
  const targetFocusMinutes = Number.parseInt(input.targetFocusMinutes, 10);
  const dueDateInput = (input.dueDate || '').trim();
  const priority = (input.priority || '').trim();
  const notes = (input.notes || '').trim();
  const setReminder = input.setReminder === 'on' || input.setReminder === true;

  const errors = {};

  if (!title) {
    errors.title = 'Add a quick description for this goal.';
  } else if (title.length > 80) {
    errors.title = 'Goal title should be 80 characters or less.';
  }

  if (Number.isNaN(targetFocusMinutes) || targetFocusMinutes < 30 || targetFocusMinutes > 600) {
    errors.targetFocusMinutes = 'Pick between 30 and 600 minutes of focus time.';
  }

  const dueDate = dueDateInput ? new Date(dueDateInput) : null;
  if (!dueDateInput || Number.isNaN(dueDate?.getTime())) {
    errors.dueDate = 'Choose a deadline for this goal.';
  }

  if (!PRIORITY_LEVELS.includes(priority)) {
    errors.priority = 'Pick one of the listed priority levels.';
  }

  if (notes.length > 160) {
    errors.notes = 'Notes should be 160 characters or less.';
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const newGoal = {
    id: crypto.randomUUID(),
    title,
    targetFocusMinutes,
    priority,
    dueDate,
    setReminder,
    notes,
    createdAt: new Date(),
  };

  goals.push(newGoal);

  if (goals.length > MAX_GOALS) {
    goals.shift();
  }

  return {
    ok: true,
    goal: serialiseGoal(newGoal),
  };
}

function getSnapshot() {
  const orderedGoals = listGoals();
  if (orderedGoals.length === 0) {
    return {
      total: 0,
      highPriority: 0,
      nextDueLabel: 'No goals scheduled',
    };
  }

  const highPriority = orderedGoals.filter((goal) => goal.priority === 'High').length;

  const nextGoal = orderedGoals[0];
  const dueDate = new Date(nextGoal.dueDate);
  const dueFormatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return {
    total: orderedGoals.length,
    highPriority,
    nextDueLabel: `${nextGoal.title} · due ${dueFormatter.format(dueDate)}`,
  };
}

module.exports = {
  listGoals,
  addGoal,
  getSnapshot,
  PRIORITY_LEVELS,
};
