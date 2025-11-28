/**
 * Index Controller
 *
 * Controllers handle the business logic for routes.
 * They process requests, interact with models, and send responses.
 *
 * Best practices:
 * - Keep controllers focused on request/response handling
 * - Move complex business logic to separate service files
 * - Use models to interact with the database
 * - Handle errors appropriately
 */

// Import models if needed
// const SomeModel = require('../models/SomeModel');

const sessionStore = require('../models/sessionStore');
const goalStore = require('../models/goalStore');

/**
 * GET /
 * Display the home page
 */
const featureCards = [
  {
    title: 'Balanced Sessions',
    description:
      'Structure focused work and mindful breaks with preset Pomodoro blocks.',
    icon: '⏱️',
  },
  {
    title: 'Routine Builder',
    description:
      'Plan your study sprints ahead of time with customizable daily templates.',
    icon: '🗓️',
  },
  {
    title: 'Momentum Tracking',
    description:
      'Reflect on streaks, completion rates, and energy levels at a glance.',
    icon: '📈',
  },
];

const workflowSteps = [
  {
    label: 'Plan',
    details:
      'Drag a few study blocks onto your schedule and set an intention for the day.',
  },
  {
    label: 'Focus',
    details:
      'Start the timer, stay present, and log quick notes between intervals.',
  },
  {
    label: 'Reflect',
    details: 'Review completed sessions to adjust workload',
  },
];

const focusPresets = [
  { label: 'Classic', focus: 25, break: 5, cycles: 4 },
  { label: 'Deep Work', focus: 50, break: 10, cycles: 2 },
  { label: 'Lightning', focus: 15, break: 3, cycles: 3 },
];

const moodOptions = [
  'Focused',
  'Calm',
  'Motivated',
  'Tired',
  'Stressed',
  'Energized',
  'Steady',
];

const reflectionPrompts = [
  'What helped you stay on task today?',
  'Where did you lose momentum and why?',
  'Which small win are you most proud of?',
];

const teamMembers = [{ name: 'Ab Emmanuel' }, { name: 'Dasha Coates' }];

exports.getHome = async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] [IndexController] getHome START`);
  try {
    console.log(
      `[${new Date().toISOString()}] [IndexController] Rendering home`
    );
    res.render('index', {
      title: 'Home',
      pageId: 'home',
      featureCards,
      workflowSteps,
      csrfToken: req.csrfToken(),
    });
    console.log(
      `[${new Date().toISOString()}] [IndexController] getHome SUCCESS`
    );
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] [IndexController] getHome ERROR:`,
      error.message
    );
    next(error);
  }
};

/**
 * GET /about
 * Display the about page
 */
exports.getAbout = async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] [IndexController] getAbout START`);
  try {
    res.render('about', {
      title: 'About',
      pageId: 'about',
      teamMembers,
      csrfToken: req.csrfToken(),
    });
    console.log(
      `[${new Date().toISOString()}] [IndexController] getAbout SUCCESS`
    );
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] [IndexController] getAbout ERROR:`,
      error.message
    );
    next(error);
  }
};

exports.getFocus = async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] [IndexController] getFocus START`);
  try {
    const userId = req.session.user?.id;

    console.log(
      `[${new Date().toISOString()}] [IndexController] Fetching sessions…`
    );
    const sessions = await sessionStore.listSessions(userId);
    const summary = sessionStore.calculateSummary(sessions);

    console.log(
      `[${new Date().toISOString()}] [IndexController] Fetching goals…`
    );
    const goals = await goalStore.listGoals(userId);
    const goalSnapshot = goalStore.calculateSnapshot(goals);

    res.render('focus', {
      title: 'Focus Sessions',
      pageId: 'focus',
      moodOptions,
      focusPresets,
      sessions,
      summary,
      formValues: res.locals.formValues || {
        title: '',
        focusMinutes: '',
        breakMinutes: '',
        cycles: '',
        mood: '',
      },
      formErrors: res.locals.formErrors || {},
      goals,
      goalSnapshot,
      goalFormValues: res.locals.goalFormValues || {
        title: '',
        targetFocusMinutes: '',
        dueDate: '',
        priority: '',
        notes: '',
        setReminder: false,
      },
      goalFormErrors: res.locals.goalFormErrors || {},
      goalPriorityOptions: goalStore.PRIORITY_LEVELS,
      csrfToken: req.csrfToken(),
    });

    console.log(
      `[${new Date().toISOString()}] [IndexController] getFocus SUCCESS`
    );
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] [IndexController] getFocus ERROR:`,
      error.message
    );
    next(error);
  }
};

exports.getInsights = async (req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] [IndexController] getInsights START`
  );
  try {
    const userId = req.session.user?.id;

    console.log(
      `[${new Date().toISOString()}] [IndexController] Fetching sessions…`
    );
    const sessions = await sessionStore.listSessions(userId);
    const summary = sessionStore.calculateSummary(sessions);

    console.log(
      `[${new Date().toISOString()}] [IndexController] Fetching goals…`
    );
    const goals = await goalStore.listGoals(userId);
    const goalSnapshot = goalStore.calculateSnapshot(goals);

    const recentSessions = sessions.slice(0, 5).map((s) => ({
      id: s.id,
      title: s.title,
      mood: s.mood,
      focusMinutes: s.focusMinutes,
      cycles: s.cycles,
      createdAt: s.createdAt,
    }));

    const hours = Math.floor(summary.totalFocusMinutes / 60);
    const minutes = summary.totalFocusMinutes % 60;
    const totalFocusLabel =
      summary.totalFocusMinutes === 0
        ? '0 min'
        : `${hours > 0 ? `${hours} hr${hours > 1 ? 's' : ''} ` : ''}${minutes} min`;

    const insights = {
      streakDays: Math.min(recentSessions.length, 5),
      totalFocusLabel,
      latestMood:
        recentSessions.length > 0 ? recentSessions[0].mood : 'Getting started',
    };

    res.render('insights', {
      title: 'Progress Insights',
      pageId: 'insights',
      sessions,
      summary,
      recentSessions,
      insights,
      reflectionPrompts,
      goals,
      goalSnapshot,
      csrfToken: req.csrfToken(),
    });

    console.log(
      `[${new Date().toISOString()}] [IndexController] getInsights SUCCESS`
    );
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] [IndexController] getInsights ERROR:`,
      error.message
    );
    next(error);
  }
};

exports.createSession = async (req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] [IndexController] createSession START`
  );
  try {
    const userId = req.session.user?.id;
    const wantsJson =
      req.get('x-requested-with') === 'fetch' ||
      req.headers.accept?.includes('application/json');

    console.log(
      `[${new Date().toISOString()}] [IndexController] Creating session…`
    );
    const result = await sessionStore.addSession(userId, req.body);

    if (!result.ok) {
      console.warn(
        `[${new Date().toISOString()}] [IndexController] Session validation failed`
      );
      if (wantsJson)
        return res.status(422).json({ ok: false, errors: result.errors });

      req.session.formErrors = result.errors;
      req.session.formValues = { ...req.body };
      req.session.flash = {
        type: 'error',
        heading: 'Please fix the highlighted fields.',
      };
      return res.redirect('/focus');
    }

    req.session.flash = {
      type: 'success',
      heading: 'Session added to your queue.',
    };
    req.session.formValues = null;
    req.session.formErrors = null;

    console.log(
      `[${new Date().toISOString()}] [IndexController] Session created successfully`
    );

    if (wantsJson) {
      return res.status(201).json({
        ok: true,
        session: result.session,
        summary: await sessionStore.getSummaryForUser(userId),
      });
    }

    return res.redirect('/focus');
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] [IndexController] createSession ERROR:`,
      error.message
    );
    next(error);
  }
};

exports.getSessionsJson = async (req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] [IndexController] getSessionsJson START`
  );
  try {
    const userId = req.session.user?.id;
    const sessions = await sessionStore.listSessions(userId);
    const summary = sessionStore.calculateSummary(sessions);

    console.log(
      `[${new Date().toISOString()}] [IndexController] getSessionsJson SUCCESS`
    );
    res.json({ sessions, summary });
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] [IndexController] getSessionsJson ERROR:`,
      error.message
    );
    next(error);
  }
};

exports.createGoal = async (req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] [IndexController] createGoal START`
  );
  try {
    const userId = req.session.user?.id;
    const wantsJson =
      req.get('x-requested-with') === 'fetch' ||
      req.headers.accept?.includes('application/json');

    console.log(
      `[${new Date().toISOString()}] [IndexController] Creating goal…`
    );
    const result = await goalStore.addGoal(userId, req.body);

    if (!result.ok) {
      console.warn(
        `[${new Date().toISOString()}] [IndexController] Goal validation failed`
      );
      if (wantsJson)
        return res.status(422).json({ ok: false, errors: result.errors });

      req.session.goalFormErrors = result.errors;
      req.session.goalFormValues = { ...req.body };
      req.session.flash = {
        type: 'error',
        heading: 'Goal could not be saved. Review the highlighted fields.',
      };
      return res.redirect('/focus');
    }

    req.session.flash = {
      type: 'success',
      heading: 'Goal added to your focus plan.',
    };
    req.session.goalFormValues = null;
    req.session.goalFormErrors = null;

    console.log(
      `[${new Date().toISOString()}] [IndexController] Goal created successfully`
    );

    if (wantsJson) {
      return res.status(201).json({
        ok: true,
        goal: result.goal,
        goals: await goalStore.listGoals(userId),
        snapshot: await goalStore.getSnapshot(userId),
      });
    }

    return res.redirect('/focus');
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] [IndexController] createGoal ERROR:`,
      error.message
    );
    next(error);
  }
};

exports.getGoalsJson = async (req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] [IndexController] getGoalsJson START`
  );
  try {
    const userId = req.session.user?.id;
    const goals = await goalStore.listGoals(userId);
    const snapshot = goalStore.calculateSnapshot(goals);

    console.log(
      `[${new Date().toISOString()}] [IndexController] getGoalsJson SUCCESS`
    );
    res.json({ goals, snapshot });
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] [IndexController] getGoalsJson ERROR:`,
      error.message
    );
    next(error);
  }
};

exports.getSettings = (req, res) => {
  console.log(
    `[${new Date().toISOString()}] [IndexController] getSettings START`
  );
  res.render('settings', {
    title: 'Settings',
    csrfToken: req.csrfToken(),
  });
  console.log(
    `[${new Date().toISOString()}] [IndexController] getSettings SUCCESS`
  );
};

