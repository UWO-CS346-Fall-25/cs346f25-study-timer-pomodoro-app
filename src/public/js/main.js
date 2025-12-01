/* eslint-disable no-undef */
/* eslint-env browser, es2021*/
/* global localStorage, FormValidator, NotificationCenter */
/**

/**
 * Main JavaScript File
 *
 * This file contains client-side JavaScript for your application.
 * Use vanilla JavaScript (no frameworks) for DOM manipulation and interactions.
 *
 * Common tasks:
 * - Form validation
 * - Interactive UI elements
 * - AJAX requests
 * - Event handling
 */

function isPage(id) {
  return document.body.classList.contains('page-' + id);
}

function evaluatePasswordStrength(password) {
  let score = 0;

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  return score;
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
  console.log('Application initialized');
  try {
    const errBox = document.querySelector('.alert.alert-error');
    if (errBox && window.NotificationCenter) {
      const msg = errBox.innerText.trim();
      if (msg) NotificationCenter.show(msg, 'error');
    }

    const flashEl = document.querySelector('[data-flash]');
    if (flashEl && window.NotificationCenter) {
      const type = flashEl.dataset.flashType || 'info';
      const msg = flashEl.textContent.trim();
      if (msg) NotificationCenter.show(msg, type);
    }
  } catch (e) {
    console.error('Toastify universal handler failed:', e);
  }

  try {
    FormValidator.init();
  } catch (e) {
    console.error('initFormValidation failed:', e);
  }

  try {
    initInteractiveElements();
  } catch (e) {
    console.error('initInteractiveElements failed:', e);
  }

  const modal = document.getElementById('avatarModal');
  const openBtn = document.getElementById('changeProfileBtn');
  const closeBtn = document.getElementById('closeAvatarModal');
  const form = document.getElementById('avatarForm');

  if (!modal || !openBtn || !closeBtn || !form) {
    return;
  }

  openBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
  });

  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fileInput = document.getElementById('avatarFile');
    const file = fileInput && fileInput.files[0];
    if (!file) return;

    const csrfInput = form.querySelector('input[name="_csrf"]');
    const csrfToken = csrfInput ? csrfInput.value : '';

    const formData = new FormData();
    formData.append('avatar', file);
    if (csrfToken) {
      formData.append('_csrf', csrfToken);
    }

    const res = await fetch('/settings/avatar', {
      method: 'POST',
      body: formData,
      headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
      credentials: 'same-origin',
    });

    const json = await res.json();

    if (json.success) {
      if (window.NotificationCenter) {
        NotificationCenter.show('Profile picture updated!', 'success');
      }
      setTimeout(() => location.reload(), 700);
    } else {
      if (window.NotificationCenter) {
        NotificationCenter.show(json.error || 'Upload failed', 'error');
      }
    }
  });
});

window.addEventListener('load', function () {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    console.log('Calling lucide.createIcons() on window load');
    window.lucide.createIcons();
  }
});

const STORAGE_KEYS = {
  mode: 'ffMode',
  preset: 'ffPreset',
  interval: 'ffInterval',
  custom: 'ffCustom',
  currentSessionId: 'ff.currentSessionId',
};

const sanitize = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

function setCurrentSessionId(id) {
  if (!id) {
    localStorage.removeItem(STORAGE_KEYS.currentSessionId);
  } else {
    localStorage.setItem(STORAGE_KEYS.currentSessionId, String(id));
  }
}

function getCurrentSessionId() {
  return localStorage.getItem(STORAGE_KEYS.currentSessionId);
}

function markActiveQueueButton(id) {
  const list = document.getElementById('sessionList');
  if (!list) return;
  list.querySelectorAll('.queue-item').forEach((btn) => {
    const matches = id && btn.dataset.sessionId === String(id);
    btn.classList.toggle('is-selected', matches);
    if (matches) {
      btn.setAttribute('aria-current', 'true');
    } else {
      btn.removeAttribute('aria-current');
    }
  });
}

/**
 * FormValidator centralizes client-side validation helpers so the logic is
 * easier to reuse between the session and goal forms.
 */
const FormValidator = {
  /**
   * Attach submit listeners to any form that requests validation.
   */
  init() {
    const forms = document.querySelectorAll('form[data-validate]');
    forms.forEach((form) => {
      form.addEventListener('submit', (event) => {
        if (!FormValidator.validate(form)) {
          event.preventDefault();
        }
      });

      const pwdInput = form.querySelector('input[data-strength]');
      const bar = form.querySelector('#password-strength .bar');
      const text = form.querySelector('#password-strength-text');

      if (pwdInput && bar && text) {
        pwdInput.addEventListener('input', function () {
          const value = pwdInput.value.trim();
          const score = evaluatePasswordStrength(value);

          const widths = ['0%', '20%', '40%', '60%', '80%', '100%'];
          const colors = [
            'transparent',
            '#ef4444',
            '#f97316',
            '#facc15',
            '#4ade80',
            '#22c55e',
          ];
          const labels = [
            'Too short',
            'Very weak',
            'Weak',
            'Medium',
            'Strong',
            'Very strong',
          ];

          bar.style.width = widths[score];
          bar.style.background = colors[score];
          text.textContent = labels[score];
        });
      }
    });
  },

  /**
   * Validate a form and surface inline errors.
   * @param {HTMLFormElement} form
   * @returns {boolean} true when the form passes validation
   */
  validate(form) {
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');

    requiredFields.forEach((field) => {
      if (!field.value.trim()) {
        FormValidator.showError(field, 'This field is required');
        isValid = false;
      } else {
        FormValidator.clearError(field);
      }
    });

    const title = form.querySelector('#title');
    const focus = form.querySelector('#focusMinutes');
    const brk = form.querySelector('#breakMinutes');
    const cycles = form.querySelector('#cycles');

    if (title) {
      const trimmedTitle = title.value.trim();
      if (trimmedTitle.length < 3 || trimmedTitle.length > 60) {
        FormValidator.showError(
          title,
          'Title must be between 3 and 60 characters'
        );
        isValid = false;
      } else if (trimmedTitle.length > 0) {
        FormValidator.clearError(title);
      }
    }

    const asInt = (el) => parseInt(el && el.value, 10);

    if (focus) {
      const n = asInt(focus);
      if (Number.isNaN(n) || n < 10 || n > 90) {
        FormValidator.showError(
          focus,
          'Focus minutes must be between 10 and 90'
        );
        isValid = false;
      } else {
        FormValidator.clearError(focus);
      }
    }

    if (brk) {
      const n = asInt(brk);
      if (Number.isNaN(n) || n < 3 || n > 30) {
        FormValidator.showError(brk, 'Break minutes must be between 3 and 30');
        isValid = false;
      } else {
        FormValidator.clearError(brk);
      }
    }

    if (cycles) {
      const n = asInt(cycles);
      if (Number.isNaN(n) || n < 1 || n > 8) {
        FormValidator.showError(cycles, 'Cycles must be between 1 and 8');
        isValid = false;
      } else {
        FormValidator.clearError(cycles);
      }
    }

    if (!isValid && window.NotificationCenter) {
      NotificationCenter.show('Please check the highlighted fields.', 'error');
    }

    return isValid;
  },

  /**
   * Display an error message next to a field.
   * @param {HTMLElement} field
   * @param {string} message
   * @param {boolean} isServer When true, marks the message so it can be cleared on resubmit.
   */
  showError(field, message, isServer = false) {
    FormValidator.clearError(field);

    const error = document.createElement('div');
    error.className = 'error-message';
    if (isServer) error.classList.add('server-error');
    error.textContent = message;
    error.style.color = 'red';
    error.style.fontSize = '0.875rem';
    error.style.marginTop = '0.25rem';

    field.parentNode.insertBefore(error, field.nextSibling);
    field.classList.add('error');
    field.style.borderColor = 'red';
  },

  /**
   * Remove any inline error message for a field.
   * @param {HTMLElement} field
   */
  clearError(field) {
    const error = field.parentNode.querySelector('.error-message');
    if (error) error.remove();
    field.classList.remove('error');
    field.style.borderColor = '';
  },

  /**
   * Remove server-side validation messages persisted from a previous submit.
   * @param {HTMLFormElement} form
   */
  clearServerErrors(form) {
    form.querySelectorAll('.server-error').forEach((msg) => msg.remove());
    form.querySelectorAll('.error').forEach((input) => {
      input.classList.remove('error');
      input.style.borderColor = '';
    });
  },
};

/**
 * Initialize interactive elements
 */
function initInteractiveElements() {
  // Example: Add smooth scrolling to anchor links
  const anchorLinks = document.querySelectorAll('a[href^="#"]');

  anchorLinks.forEach((link) => {
    link.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    });
  });

  const body = document.body;
  const display =
    document.getElementById('timerDisplay') ||
    document.querySelector('.timer-display');
  const timerLabel =
    document.getElementById('timerLabel') ||
    document.querySelector('.timer-label');
  const timerMeta = document.getElementById('timerMeta');
  const startBtn = document.getElementById('timerStart');
  const pauseBtn = document.getElementById('timerPause');
  const resetBtn = document.getElementById('timerReset');

  if (!display || !startBtn || !pauseBtn || !resetBtn) {
    console.log('Timer controls not found. Skipping timer wiring.');
    return;
  }

  let timerInterval = null;
  let remainingSeconds = 0;

  function formatTime(sec) {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function updateDisplay() {
    display.textContent = formatTime(remainingSeconds);
  }

  function startTimer() {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
      remainingSeconds--;
      updateDisplay();

      if (remainingSeconds <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;

        if (window.NotificationCenter)
          NotificationCenter.show('Interval complete!', 'success');
      }
    }, 1000);
  }

  function pauseTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function resetTimer(defaultMinutes) {
    pauseTimer();
    remainingSeconds = defaultMinutes * 60;
    updateDisplay();
  }

  const startBtn = document.querySelector(
    '.timer-controls button:nth-child(1)'
  );
  const pauseBtn = document.querySelector(
    '.timer-controls button:nth-child(2)'
  );
  const resetBtn = document.querySelector(
    '.timer-controls button:nth-child(3)'
  );

  function currentIntervalType() {
    if (document.getElementById('chipBreak').classList.contains('active'))
      return 'break';
    if (document.getElementById('chipLong').classList.contains('active'))
      return 'long';
    return 'focus';
  }

  startBtn.addEventListener('click', () => {
    if (remainingSeconds <= 0) {
      const type = currentIntervalType();
      const min = minutesFor(type);
      remainingSeconds = min * 60;
    }
    startTimer();
  });

  pauseBtn.addEventListener('click', () => {
    pauseTimer();
  });

  resetBtn.addEventListener('click', () => {
    const type = currentIntervalType();
    const min = minutesFor(type);
    resetTimer(min);
  });

  const focusInput = document.getElementById('focusMinutes');
  const breakInput = document.getElementById('breakMinutes');
  const cyclesInput = document.getElementById('cycles');
  const titleInput = document.getElementById('title');

  function triggerThemeSweep() {
    body.classList.add('animate-bg');
    body.addEventListener(
      'animationend',
      (e) => {
        if (e.animationName === 'bgSweep') body.classList.remove('animate-bg');
      },
      { once: true }
    );
  }

  document.querySelectorAll('input[type="number"]').forEach((input) => {
    input.addEventListener('keydown', function (e) {
      if (['e', 'E', '+', '-', '.'].includes(e.key)) {
        e.preventDefault();
      }
    });
  });

  const K = STORAGE_KEYS;
  const presetChips = document.querySelectorAll('.preset-panel .chip');

  const getCustomSession = () => {
    try {
      return JSON.parse(localStorage.getItem(K.custom) || 'null');
    } catch {
      return null;
    }
  };

  const persistCustomFromInputs = () => {
    const payload = {
      title: titleInput?.value || 'Session',
      focus: parseInt(focusInput?.value, 10) || 25,
      break: parseInt(breakInput?.value, 10) || 5,
      cycles: parseInt(cyclesInput?.value, 10) || 1,
    };
    localStorage.setItem(K.mode, 'custom');
    localStorage.setItem(K.custom, JSON.stringify(payload));
    timerState.totalCycles = getPlannedCycles();
    resetTimer({ hard: true });
  };

  presetChips.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (focusInput) focusInput.value = btn.dataset.focus;
      if (breakInput) breakInput.value = btn.dataset.break;
      if (cyclesInput) cyclesInput.value = btn.dataset.cycles;

      const m = parseInt(btn.dataset.focus, 10) || 0;
      display.textContent = String(m).padStart(2, '0') + ':00';

      pauseTimer();
      remainingSeconds = m * 60;
      updateDisplay();

      presetChips.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      body.classList.remove('theme-classic', 'theme-deep', 'theme-lightning');

      const label =
        btn.querySelector('.preset-name')?.textContent.trim().toLowerCase() ||
        '';
      if (label.includes('classic')) body.classList.add('theme-classic');
      else if (label.includes('deep')) body.classList.add('theme-deep');
      else if (label.includes('lightning'))
        body.classList.add('theme-lightning');
      triggerThemeSweep();

      document.querySelectorAll('.queue-item').forEach((item) => {
        item.classList.remove('is-selected');
      });

      const labelEl = document.querySelector('.timer-label');
      const presetName =
        btn.querySelector('.preset-name')?.textContent.trim() || 'Custom';
      labelEl.textContent = `Current interval: ${presetName}`;

      const presetNameLc = presetName.toLowerCase();
      let normalized = 'classic';
      if (presetNameLc.includes('deep')) normalized = 'deep work';
      else if (presetNameLc.includes('lightning')) normalized = 'lightning';
      localStorage.setItem(K.mode, 'preset');
      localStorage.setItem(K.preset, normalized);
      localStorage.setItem(K.interval, 'focus');
    });
  });

  [focusInput, breakInput, cyclesInput, titleInput].forEach((input) => {
    input?.addEventListener('input', () => {
      presetChips.forEach((chip) => chip.classList.remove('active'));
      persistCustomFromInputs();
    });
  });

  const intervalBtns = document.querySelectorAll('.interval-toggle .chip');
  const [focusBtn, breakBtn, longBreakBtn] = intervalBtns;

  const PRESET_MINUTES = {
    classic: { focus: 25, break: 5, long: 15, cycles: 4 },
    'deep work': { focus: 50, break: 10, long: 20, cycles: 2 },
    lightning: { focus: 15, break: 3, long: 13, cycles: 3 },
  };

  const savedInterval = localStorage.getItem(K.interval);
  const timerState = {
    interval: ['focus', 'break', 'long'].includes(savedInterval)
      ? savedInterval
      : 'focus',
    remainingSeconds: null,
    timerId: null,
    completedCycles: 0,
    totalCycles: 0,
  };

  function getPresetConfig(name) {
    const key = (name || '').toLowerCase();
    return PRESET_MINUTES[key] || PRESET_MINUTES.classic;
  }

  function getDurations() {
    const mode = localStorage.getItem(K.mode) || 'preset';
    if (mode === 'custom') {
      const custom = getCustomSession();
      if (custom) {
        const focus = parseInt(custom.focus, 10) || 25;
        const brk = parseInt(custom.break, 10) || 5;
        const lng = parseInt(custom.long || brk * 2 || 15, 10);
        return { focus, break: brk, long: lng };
      }
    }
    const presetName = localStorage.getItem(K.preset) || 'classic';
    const config = getPresetConfig(presetName);
    return {
      focus: config.focus,
      break: config.break,
      long: config.long,
    };
  }

  function getPlannedCycles() {
    const mode = localStorage.getItem(K.mode) || 'preset';
    if (mode === 'custom') {
      const custom = getCustomSession();
      if (custom && custom.cycles) {
        return Math.max(parseInt(custom.cycles, 10) || 1, 1);
      }
    }
    const presetName = localStorage.getItem(K.preset) || 'classic';
    const config = getPresetConfig(presetName);
    return config.cycles || 4;
  }

  function formatSeconds(seconds) {
    const safe = Math.max(0, seconds || 0);
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function updateTimerDisplay() {
    display.textContent = formatSeconds(timerState.remainingSeconds);
  }

  function updateTimerMeta() {
    if (!timerMeta) return;
    const intervalLabel =
      timerState.interval === 'break'
        ? 'Break'
        : timerState.interval === 'long'
          ? 'Long break'
          : 'Focus';
    let activeCycle;
    if (timerState.interval === 'focus') {
      activeCycle = timerState.completedCycles + 1;
    } else if (timerState.interval === 'long') {
      activeCycle = timerState.totalCycles;
    } else {
      activeCycle = Math.max(timerState.completedCycles, 1);
    }
    timerMeta.textContent = `Cycle ${Math.min(activeCycle, timerState.totalCycles)} of ${timerState.totalCycles} · ${intervalLabel}`;
  }

  function setRunningState(running) {
    if (!startBtn || !pauseBtn) return;
    startBtn.disabled = running;
    pauseBtn.disabled = !running;
  }

  function stopCountdown() {
    if (timerState.timerId) {
      clearInterval(timerState.timerId);
      timerState.timerId = null;
    }
    setRunningState(false);
  }

  function notify(message, type = 'info') {
    if (window.NotificationCenter && typeof NotificationCenter.show === 'function') {
      NotificationCenter.show(message, type);
    }
  }

  function setIntervalDuration(interval) {
    const durations = getDurations();
    const minutes = durations[interval] || durations.focus;
    timerState.remainingSeconds = Math.max(minutes * 60, 5);
    updateTimerDisplay();
    updateTimerMeta();
  }

  function resetTimer({ hard = false, interval } = {}) {
    stopCountdown();
    timerState.totalCycles = getPlannedCycles();
    if (hard) {
      timerState.completedCycles = 0;
    }
    if (interval) {
      timerState.interval = interval;
    }
    setActiveInterval(timerState.interval);
    setIntervalDuration(timerState.interval);
  }

  function handleIntervalComplete() {
    stopCountdown();
    if (timerState.interval === 'focus') {
      timerState.completedCycles += 1;
      if (timerState.completedCycles >= timerState.totalCycles) {
        notify('Focus streak complete! Enjoy a longer break.', 'success');
        timerState.completedCycles = 0;
        timerState.interval = 'long';
      } else {
        notify('Focus block complete! Take a short break.', 'success');
        timerState.interval = 'break';
      }
    } else {
      if (timerState.interval === 'long') {
        notify('Long break complete! Back to focus.', 'info');
      } else {
        notify('Break finished! Dive back into focus.', 'info');
      }
      timerState.interval = 'focus';
    }
    setActiveInterval(timerState.interval);
    setIntervalDuration(timerState.interval);
    startTimer();
  }

  function tick() {
    timerState.remainingSeconds -= 1;
    updateTimerDisplay();
    if (timerState.remainingSeconds <= 0) {
      handleIntervalComplete();
    }
  }

  function startTimer() {
    if (timerState.timerId) return;
    if (timerState.remainingSeconds === null) {
      setIntervalDuration(timerState.interval);
    }
    timerState.timerId = setInterval(tick, 1000);
    setRunningState(true);
  }

  function pauseTimer() {
    stopCountdown();
  }

  timerState.totalCycles = getPlannedCycles();
  resetTimer({ hard: false, interval: timerState.interval });

  startBtn.addEventListener('click', startTimer);
  pauseBtn.addEventListener('click', pauseTimer);
  resetBtn.addEventListener('click', () => resetTimer({ hard: true, interval: 'focus' }));

  const minutesFor = (type) => {
    if (localStorage.getItem(K.mode) === 'custom') {
      const custom = getCustomSession();
      if (custom) {
        if (type === 'focus') return parseInt(custom.focus, 10) || 25;
        if (type === 'break') return parseInt(custom.break, 10) || 5;
        if (type === 'long')
          return parseInt(custom.long || custom.break * 2 || 15, 10);
      }
    }
    const key = type === 'long' ? 'long' : type;
    return PRESET_MINUTES[currentPreset][key];
  };

  let currentPreset = 'classic';

  function setTimer(min) {
    timerState.remainingSeconds = Math.max(Math.round(min * 60), 0);
    updateTimerDisplay();
    updateTimerMeta();
  }

  function setActiveInterval(which) {
    const normalized = which === 'long' ? 'long' : which;
    timerState.interval = normalized;
    localStorage.setItem(K.interval, normalized);
    intervalBtns.forEach((b) => b.classList.remove('active'));
    if (normalized === 'focus') focusBtn?.classList.add('active');
    if (normalized === 'break') breakBtn?.classList.add('active');
    if (normalized === 'long') longBreakBtn?.classList.add('active');
  }

  presetChips.forEach((btn) => {
    btn.addEventListener('click', () => {
      const label = btn.querySelector('.preset-name')?.textContent.trim() || 'Classic';
      const name = label.toLowerCase();
      currentPreset = name in PRESET_MINUTES ? name : 'classic';
      localStorage.setItem(K.mode, 'preset');
      localStorage.setItem(K.preset, currentPreset);
      localStorage.setItem(K.interval, 'focus');
      localStorage.removeItem(K.custom);
      timerState.completedCycles = 0;
      timerState.totalCycles = getPlannedCycles();
      if (timerLabel) {
        timerLabel.textContent = `Current interval: ${label}`;
      }
      resetTimer({ hard: true, interval: 'focus' });
    });
  });

  focusBtn?.addEventListener('click', () => {
    resetTimer({ hard: false, interval: 'focus' });
  });

  breakBtn?.addEventListener('click', () => {
    resetTimer({ hard: false, interval: 'break' });
  });

  longBreakBtn?.addEventListener('click', () => {
    resetTimer({ hard: false, interval: 'long' });
  });

  (function restoreLastState() {
    const savedMode = localStorage.getItem(K.mode) || 'preset';
    const savedInterval = localStorage.getItem(K.interval) || 'focus';

    const chips = document.querySelectorAll('.preset-panel .chip');
    const timerLabel =
      document.getElementById('timerLabel') ||
      document.querySelector('.timer-label');

    const selectPresetChip = (name) => {
      chips.forEach((c) => c.classList.remove('active'));
      const chip = Array.from(chips).find(
        (c) =>
          c.querySelector('.preset-name')?.textContent.trim().toLowerCase() ===
          name
      );
      if (chip) {
        chip.click();
        if (savedInterval === 'break') breakBtn?.click();
        else if (savedInterval === 'long') longBreakBtn?.click();
        else focusBtn?.click();
        return true;
      }
      return false;
    };

    if (savedMode === 'custom') {
      try {
        const s = JSON.parse(localStorage.getItem(K.custom) || 'null');
        if (s) {
          if (focusInput) focusInput.value = s.focus;
          if (breakInput) breakInput.value = s.break;
          if (cyclesInput) cyclesInput.value = s.cycles;
          if (timerLabel)
            timerLabel.textContent = `Current interval: ${s.title || 'Session'}`;

          chips.forEach((c) => c.classList.remove('active'));

          const mins =
            savedInterval === 'break'
              ? s.break
              : savedInterval === 'long'
                ? s.long || 15
                : s.focus;

          setTimer(mins);
          setActiveInterval(savedInterval);
          return;
        }
      } catch {
        /* fall back to preset restore */
      }
    }

    const savedPreset = (
      localStorage.getItem(K.preset) || 'classic'
    ).toLowerCase();
    if (!selectPresetChip(savedPreset)) {
      setActiveInterval(savedInterval);
    }
  })();

  (function wireQueueClicks() {
    const list = document.getElementById('sessionList');
    if (!list) return;

    const focusInput = document.getElementById('focusMinutes');
    const breakInput = document.getElementById('breakMinutes');
    const cyclesInput = document.getElementById('cycles');

    const chipFocus = document.getElementById('chipFocus');
    const chipBreak = document.getElementById('chipBreak');
    const chipLong = document.getElementById('chipLong');

    const presetChips = document.querySelectorAll('.preset-panel .chip');

    function setFocusActive() {
      [chipFocus, chipBreak, chipLong].forEach((b) =>
        b?.classList.remove('active')
      );
      chipFocus?.classList.add('active');
    }

    function toMMSS(mins) {
      const m = String(mins).padStart(2, '0');
      return `${m}:00`;
    }

    function handleQueueSelection(btn) {
      const title = btn.dataset.title || 'Session';
      const focusM = parseInt(btn.dataset.focus || '25', 10);
      const breakM = parseInt(btn.dataset.break || '5', 10);
      const cycles = parseInt(btn.dataset.cycles || '1', 10);

      if (focusInput) focusInput.value = focusM;
      if (breakInput) breakInput.value = breakM;
      if (cyclesInput) cyclesInput.value = cycles;

<<<<<<< HEAD
      if (display) display.textContent = toMMSS(focusM);
      timerState.remainingSeconds = focusM * 60;
      updateTimerMeta();

=======
      if (display) display.textContent = toMMSS(focusM);
>>>>>>> 5d05bd3 (Implement live Pomodoro timer)
      if (timerLabel) timerLabel.textContent = `Current interval: ${title}`;

      setFocusActive();
      presetChips.forEach((chip) => chip.classList.remove('active'));

      localStorage.setItem(K.mode, 'custom');
      localStorage.setItem(K.interval, 'focus');
      localStorage.setItem(
        K.custom,
        JSON.stringify({ title, focus: focusM, break: breakM, cycles })
      );

      const targetId =
        btn.dataset.sessionId || `${title}|${focusM}|${breakM}|${cycles}`;
      setCurrentSessionId(targetId);
      markActiveQueueButton(targetId);
      timerState.totalCycles = getPlannedCycles();
      resetTimer({ hard: true });
    }

    list.addEventListener('click', (event) => {
      const btn = event.target.closest('.queue-item');
      if (!btn) return;
      handleQueueSelection(btn);
    });

    const restoredId = getCurrentSessionId();
    if (restoredId) {
      markActiveQueueButton(restoredId);
    }
  })();

  (function wireAddSessionForm() {
    const form = document.getElementById('addSessionForm');
    if (!form) return;

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      FormValidator.clearServerErrors(form);
      if (!FormValidator.validate(form)) {
        if (
          window.NotificationCenter &&
          typeof NotificationCenter.show === 'function'
        ) {
          NotificationCenter.show(
            'Please fix the highlighted fields.',
            'error'
          );
        }
        const firstErr = form.querySelector('.error, .error-message');
        if (firstErr && firstErr.scrollIntoView) {
          firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      const formData = new FormData(form);
      const csrfToken = formData.get('_csrf') || '';
      const payloadBody = {};
      formData.forEach((value, key) => {
        payloadBody[key] = value;
      });

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          headers: {
            'X-Requested-With': 'fetch',
            Accept: 'application/json',
            'X-CSRF-Token': csrfToken,
            'Content-Type': 'application/json',
          },
          credentials: 'same-origin',
          body: JSON.stringify(payloadBody),
        });

        let payload;

        if (response.status === 422) {
          payload = await response.json().catch(() => ({}));
          const errors = payload.errors || {};
          Object.entries(errors).forEach(([field, message]) => {
            const el = form.querySelector(`[name="${field}"]`);
            if (el) FormValidator.showError(el, message, true);
          });
          NotificationCenter.show(
            'Please fix the highlighted fields.',
            'error'
          );
          return;
        }

        if (!response.ok) {
          const text = await response.text();
          throw new Error(
            `Server responded with ${response.status}: ${text?.slice(0, 200)}`
          );
        }

        payload = await response.json();

        form.reset();
        NotificationCenter.show('Session added to your queue.', 'success');

        const session = payload.session;
        if (session) {
          if (timerLabel)
            timerLabel.textContent = `Current interval: ${session.title}`;
          if (display)
            display.textContent =
              String(session.focusMinutes).padStart(2, '0') + ':00';

          const chipFocus = document.getElementById('chipFocus');
          const chipBreak = document.getElementById('chipBreak');
          const chipLong = document.getElementById('chipLong');
          [chipFocus, chipBreak, chipLong].forEach((b) =>
            b?.classList.remove('active')
          );
          chipFocus?.classList.add('active');

          localStorage.setItem(K.mode, 'custom');
          localStorage.setItem(K.interval, 'focus');
        localStorage.setItem(
          K.custom,
          JSON.stringify({
            title: session.title,
            focus: session.focusMinutes,
            break: session.breakMinutes,
            cycles: session.cycles,
          })
        );
        setCurrentSessionId(session.id);
        timerState.totalCycles = getPlannedCycles();
        resetTimer({ hard: true });
      }

        await refreshSessions();
      } catch (error) {
        console.error('Failed to save session', error);
        NotificationCenter.show(
          'Could not save session. Please try again.',
          'error'
        );
      }
    });
  })();

  (function wireGoalForm() {
    const form =
      document.getElementById('addGoalForm') ||
      document.querySelector('form[data-goal-form]');
    if (!form) return;

    const list = document.getElementById('focusGoalsList');

    function renderGoalLI(goal) {
      const due = goal.dueDate ? new Date(goal.dueDate) : null;
      const dueText = due
        ? `Due ${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        : '';
      const pri = (goal.priority || '').toLowerCase();

      return `
      <li data-goal-id="${goal.id || crypto?.randomUUID?.() || Date.now()}">
        <div class="goal-item">
          <h3>${sanitize(goal.title || 'Goal')}</h3>
          <p class="goal-meta">
            <span data-goal-priority="${pri}">${sanitize(goal.priority || 'Normal')} priority</span>
            · <time datetime="${goal.dueDate || ''}">${dueText}</time>
          </p>
          <p class="goal-notes">
            <strong>Focus target:</strong> ${Number(goal.targetFocusMinutes || 0)} minutes
            ${goal.setReminder ? ' · Reminder enabled' : ''}
            ${goal.notes ? `<br><span>${sanitize(goal.notes)}</span>` : ''}
          </p>
        </div>
      </li>`;
    }

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      FormValidator.clearServerErrors(form);

      if (!FormValidator.validate(form)) {
        if (
          window.NotificationCenter &&
          typeof NotificationCenter.show === 'function'
        ) {
          NotificationCenter.show(
            'Please fix the highlighted fields.',
            'error'
          );
        }
        const firstErr = form.querySelector('.error, .error-message');
        if (firstErr && firstErr.scrollIntoView) {
          firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      const fd = new FormData(form);
      const csrf = fd.get('_csrf') || '';
      const payload = {};
      fd.forEach((v, k) => (payload[k] = v));

      payload.setReminder = !!fd.get('setReminder');

      try {
        const res = await fetch(form.action, {
          method: 'POST',
          headers: {
            'X-Requested-With': 'fetch',
            'X-CSRF-Token': csrf,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          credentials: 'same-origin',
          body: JSON.stringify(payload),
        });

        if (res.status === 422) {
          const { errors = {} } = await res.json().catch(() => ({}));
          Object.entries(errors).forEach(([name, msg]) => {
            const el = form.querySelector(`[name="${name}"]`);
            if (el) FormValidator.showError(el, msg, true);
          });
          NotificationCenter.show(
            'Please fix the highlighted fields.',
            'error'
          );
          return;
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json().catch(() => ({}));
        const saved = data.goal || {
          title: payload.title,
          targetFocusMinutes: payload.targetFocusMinutes,
          dueDate: payload.dueDate,
          priority: payload.priority,
          notes: payload.notes,
          setReminder: payload.setReminder,
        };

        if (list) {
          const empty = list.querySelector('.empty-state');
          if (empty) empty.remove();
          list.insertAdjacentHTML('afterbegin', renderGoalLI(saved));
        }

        form.reset();
        NotificationCenter.show('Goal successfully added!', 'success');
      } catch (err) {
        console.error('Save goal failed', err);
        NotificationCenter.show(
          'Could not save goal. Please try again.',
          'error'
        );
      }
    });
  })();
}

/**
 * Make an AJAX request
 * @param {string} url - Request URL
 * @param {object} options - Request options (method, headers, body, etc.)
 * @returns {Promise<any>} - Response data
 */
/* eslint-disable no-unused-vars */
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}

async function refreshSessions(prefetched) {
  try {
    let payload = prefetched;
    if (!payload) {
      const response = await fetch('/api/sessions', {
        headers: {
          'X-Requested-With': 'fetch',
          Accept: 'application/json',
        },
        credentials: 'same-origin',
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch sessions (${response.status})`);
      }
      payload = await response.json();
    }

    const sessions = payload.sessions || [];
    const summary = payload.summary || {};

    const list = document.getElementById('sessionList');
    if (list) {
      if (sessions.length === 0) {
        list.innerHTML =
          '<li class="empty-state">No sessions queued yet. Use the form to add your first focus block.</li>';
      } else {
        list.innerHTML = sessions
          .map((session) => {
            const title = sanitize(session.title);
            const mood = sanitize(session.mood);
            return `<li data-session-id="${session.id}">
              <button
                type="button"
                class="queue-item"
                data-session-id="${session.id}"
                data-title="${title}"
                data-focus="${session.focusMinutes}"
                data-break="${session.breakMinutes}"
                data-cycles="${session.cycles}"
              >
                <h3>${title}</h3>
                <p>
                  ${session.cycles} × ${session.focusMinutes} minute focus /
                  ${session.breakMinutes} minute break · Mood:
                  <span>${mood}</span>
                </p>
              </button>
            </li>`;
          })
          .join('');
      }
      markActiveQueueButton(getCurrentSessionId());
    }

    const summaryEl = document.getElementById('sessionSummary');
    if (summaryEl) {
      const focusVal = summaryEl.querySelector('[data-summary="focus"]');
      const cyclesVal = summaryEl.querySelector('[data-summary="cycles"]');
      const avgVal = summaryEl.querySelector('[data-summary="average"]');
      if (focusVal) focusVal.textContent = summary.totalFocusMinutes ?? 0;
      if (cyclesVal) cyclesVal.textContent = summary.totalCycles ?? 0;
      if (avgVal)
        avgVal.textContent = `${summary.averageFocusBlock ?? 0} minutes`;
    }

    const insightList = document.getElementById('insightSessionList');
    if (insightList) {
      if (sessions.length === 0) {
        insightList.innerHTML =
          '<li class="empty-state">No sessions logged yet. Add one from the Focus page.</li>';
      } else {
        insightList.innerHTML = sessions
          .slice(0, 5)
          .map((session) => {
            const title = sanitize(session.title);
            const mood = sanitize(session.mood);
            return `<li>
              <h3>${title}</h3>
              <p>${session.cycles} × ${session.focusMinutes} minute focus blocks · <span>${mood}</span></p>
            </li>`;
          })
          .join('');
      }
    }

    if (payload.session?.id) {
      markActiveQueueButton(payload.session.id);
    }

    return payload;
  } catch (error) {
    console.error('Could not refresh sessions', error);
    NotificationCenter.show(
      'Unable to refresh the session queue. Please reload.',
      'warning'
    );
    throw error;
  }
}
