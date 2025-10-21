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

const sessionStore = require('../models/sessionStore');

const focusPresets = [
  { label: 'Classic', focus: 25, break: 5, cycles: 4 },
  { label: 'Deep Work', focus: 50, break: 10, cycles: 2 },
  { label: 'Lightning', focus: 15, break: 3, cycles: 3 },
];

const reflectionPrompts = [
  'What helped you stay on task today?',
  'Where did you lose momentum and why?',
  'Which small win are you most proud of?',
];

const teamMembers = [
  {
    name: 'Ab Emmanuel',
  },
  {
    name: 'Dasha Coates',
  },
];

exports.getHome = async (req, res, next) => {
  try {
    res.render('index', {
      title: 'Home',
      pageId: 'home',
      featureCards,
      workflowSteps,
      csrfToken: req.csrfToken(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /about
 * Display the about page
 */
exports.getAbout = async (req, res, next) => {
  try {
    res.render('about', {
      title: 'About',
      pageId: 'about',
      teamMembers,
      csrfToken: req.csrfToken(),
    });
  } catch (error) {
    next(error);
  }
};

exports.getFocus = async (req, res, next) => {
  try {
    const sessions = sessionStore.listSessions();
    const summary = sessionStore.getSummary();
    const values = res.locals.formValues || {
      title: '',
      focusMinutes: '',
      breakMinutes: '',
      cycles: '',
      mood: '',
    };

    res.render('focus', {
      title: 'Focus Sessions',
      pageId: 'focus',
      focusPresets,
      sessions,
      summary,
      formValues: values,
      formErrors: res.locals.formErrors || {},
      csrfToken: req.csrfToken(),
    });
  } catch (error) {
    next(error);
  }
};

exports.getInsights = async (req, res, next) => {
  try {
    const sessions = sessionStore.listSessions();
    const summary = sessionStore.getSummary();
    const recentSessions = sessions.slice(0, 5).map((session) => ({
      id: session.id,
      title: session.title,
      mood: session.mood,
      focusMinutes: session.focusMinutes,
      cycles: session.cycles,
      createdAt: session.createdAt,
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
      latestMood: recentSessions.length > 0 ? recentSessions[0].mood : 'Getting started',
    };

    res.render('insights', {
      title: 'Progress Insights',
      pageId: 'insights',
      sessions,
      summary,
      recentSessions,
      insights,
      reflectionPrompts,
      csrfToken: req.csrfToken(),
    });
  } catch (error) {
    next(error);
  }
};

exports.createSession = async (req, res, next) => {
  try {
    const result = sessionStore.addSession(req.body);

    if (!result.ok) {
      req.session.formErrors = result.errors;
      req.session.formValues = {
        title: req.body.title,
        focusMinutes: req.body.focusMinutes,
        breakMinutes: req.body.breakMinutes,
        cycles: req.body.cycles,
        mood: req.body.mood,
      };
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

    return res.redirect('/focus');
  } catch (error) {
    return next(error);
  }
};

exports.getSessionsJson = (req, res, next) => {
  try {
    res.json({
      sessions: sessionStore.listSessions(),
      summary: sessionStore.getSummary(),
    });
  } catch (error) {
    next(error);
  }
};
