const supabase = require('../lib/supabaseClient');

const PRIORITY_LEVELS = ['High', 'Medium', 'Low'];

function mapRowToGoal(row) {
  return {
    id: row.id,
    title: row.title,
    targetFocusMinutes: row.target_focus_minutes,
    priority: row.priority,
    dueDate: row.due_date,
    setReminder: row.set_reminder,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function calculateSnapshot(goals = []) {
  if (goals.length === 0) {
    return {
      total: 0,
      highPriority: 0,
      nextDueLabel: 'No goals scheduled',
    };
  }

  const sorted = goals
    .slice()
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const highPriority = goals.filter((goal) => goal.priority === 'High').length;
  const nextGoal = sorted[0];
  const dueDate = new Date(nextGoal.dueDate);
  const formatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return {
    total: goals.length,
    highPriority,
    nextDueLabel: `${nextGoal.title} · due ${formatter.format(dueDate)}`,
  };
}

async function listGoals() {
  const { data, error } = await supabase
    .from('focus_goals')
    .select(
      'id, title, target_focus_minutes, priority, due_date, set_reminder, notes, created_at'
    )
    .order('due_date', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch focus goals: ${error.message}`);
  }

  return (data || []).map(mapRowToGoal);
}

async function addGoal(input) {
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

  if (
    Number.isNaN(targetFocusMinutes) ||
    targetFocusMinutes < 30 ||
    targetFocusMinutes > 600
  ) {
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

  const payload = {
    title,
    target_focus_minutes: targetFocusMinutes,
    priority,
    due_date: dueDateInput,
    set_reminder: setReminder,
    notes: notes || null,
  };

  const { data, error } = await supabase
    .from('focus_goals')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save goal: ${error.message}`);
  }

  return {
    ok: true,
    goal: mapRowToGoal(data),
  };
}

async function getSnapshot() {
  const goals = await listGoals();
  return calculateSnapshot(goals);
}

module.exports = {
  listGoals,
  addGoal,
  getSnapshot,
  calculateSnapshot,
  PRIORITY_LEVELS,
};
