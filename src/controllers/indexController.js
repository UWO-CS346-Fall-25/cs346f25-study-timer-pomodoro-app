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
    description: 'Structure focused work and mindful breaks with preset Pomodoro blocks.',
    icon: '⏱️',
  },
  {
    title: 'Routine Builder',
    description: 'Plan your study sprints ahead of time with customizable daily templates.',
    icon: '🗓️',
  },
  {
    title: 'Momentum Tracking',
    description: 'Reflect on streaks, completion rates, and energy levels at a glance.',
    icon: '📈',
  },
];

const workflowSteps = [
  {
    label: 'Plan',
    details: 'Drag a few study blocks onto your schedule and set an intention for the day.',
  },
  {
    label: 'Focus',
    details: 'Start the timer, stay present, and log quick notes between intervals.',
  },
  {
    label: 'Reflect',
    details: 'Review completed sessions to adjust tomorrow’s workload with confidence.',
  },
];

const focusPresets = [
  { label: 'Classic', focus: 25, break: 5 },
  { label: 'Deep Work', focus: 50, break: 10 },
  { label: 'Lightning', focus: 15, break: 3 },
];

const recentSessions = [
  { name: 'Algorithms Drill', duration: '4 x 25', mood: 'Focused' },
  { name: 'UX Research Review', duration: '3 x 25', mood: 'Steady' },
  { name: 'Capstone Planning', duration: '2 x 50', mood: 'Energized' },
];

const reflectionPrompts = [
  'What helped you stay on task today?',
  'Where did you lose momentum and why?',
  'Which small win are you most proud of?',
];

const teamMembers = [
  {
    name: 'Ada Lovelace',
    role: 'Product Vision & Research',
    blurb: 'Mapping the study flow and gathering insights from peer workflows.',
  },
  {
    name: 'Grace Hopper',
    role: 'Experience Design',
    blurb: 'Crafting intuitive layouts and ensuring accessibility from day one.',
  },
  {
    name: 'Katherine Johnson',
    role: 'Data & Analytics',
    blurb: 'Designing progress visualizations and meaningful productivity metrics.',
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
    res.render('focus', {
      title: 'Focus Sessions',
      pageId: 'focus',
      focusPresets,
      csrfToken: req.csrfToken(),
    });
  } catch (error) {
    next(error);
  }
};

exports.getInsights = async (req, res, next) => {
  try {
    res.render('insights', {
      title: 'Progress Insights',
      pageId: 'insights',
      recentSessions,
      reflectionPrompts,
      csrfToken: req.csrfToken(),
    });
  } catch (error) {
    next(error);
  }
};

// Add more controller methods as needed
