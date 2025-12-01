const supabase = require('../lib/supabaseClient');
const logger = require('../utils/logger');

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

async function listGoals(userId) {
  if (!userId) {
    return [];
  }

  try {
    logger.info('GoalStore.listGoals', 'Fetching goals', { userId });
    const { data, error } = await supabase
      .from('focus_goals')
      .select(
        'id, title, target_focus_minutes, priority, due_date, set_reminder, notes, created_at'
      )
      .eq('user_id', userId)
      .order('due_date', { ascending: true });

    if (error) {
      logger.error('GoalStore.listGoals', 'Supabase error', {
        userId,
        error: error.message,
      });
      throw new Error(`Failed to fetch focus goals: ${error.message}`);
    }

    const mapped = (data || []).map(mapRowToGoal);
    logger.info('GoalStore.listGoals', 'Goals fetched', {
      userId,
      count: mapped.length,
    });
    return mapped;
  } catch (err) {
    logger.error('GoalStore.listGoals', 'Unexpected failure', {
      userId,
      error: err.message,
    });
    throw err;
  }
}

async function addGoal(userId, input) {
  if (!userId) {
    throw new Error('User ID is required to create a goal.');
  }
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
    user_id: userId,
  };

  try {
    logger.info('GoalStore.addGoal', 'Persisting goal', {
      userId,
      payload: {
        ...payload,
        notes: payload.notes,
      },
    });
    const { data, error } = await supabase
      .from('focus_goals')
      .insert(payload)
      .select()
      .single();

    if (error) {
      logger.error('GoalStore.addGoal', 'Supabase insert failed', {
        userId,
        error: error.message,
      });
      throw new Error(`Failed to save goal: ${error.message}`);
    }

    logger.info('GoalStore.addGoal', 'Goal stored', {
      userId,
      goalId: data.id,
    });
    return {
      ok: true,
      goal: mapRowToGoal(data),
    };
  } catch (err) {
    logger.error('GoalStore.addGoal', 'Unexpected failure', {
      userId,
      error: err.message,
    });
    throw err;
  }
}

async function getSnapshot(userId) {
  const goals = await listGoals(userId);
  return calculateSnapshot(goals);
}

module.exports = {
  listGoals,
  addGoal,
  getSnapshot,
  calculateSnapshot,
  PRIORITY_LEVELS,
};
