/* eslint-disable no-undef */
/* eslint-env browser, es2021*/
/* global localStorage */
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

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
  console.log('Application initialized');

  // Example: Form validation 
  initFormValidation();

  // Example: Interactive elements
  initInteractiveElements();
});

/**
 * Initialize form validation
 */
function initFormValidation() {
  const forms = document.querySelectorAll('form[data-validate]');

  forms.forEach((form) => {
    form.addEventListener('submit', function (e) {
      if (!validateForm(form)) {
        //e.preventDefault();
      }
    });
  });
}

/**
 * Validate a form
 * @param {HTMLFormElement} form - Form element to validate
 * @returns {boolean} - True if form is valid
 */
function validateForm(form) {
  let isValid = true;
  const requiredFields = form.querySelectorAll('[required]');

  requiredFields.forEach((field) => {
    if (!field.value.trim()) {
      showError(field, 'This field is required');
      isValid = false;
    } else {
      clearError(field);
    }
  });

  const title = form.querySelector('#title');
  const focus = form.querySelector('#focusMinutes');
  const brk = form.querySelector('#breakMinutes');
  const cycles = form.querySelector('#cycles');

  if (title && title.value.trim().length > 60) {
    showError(title, 'Title must be 60 characters or fewer');
    isValid = false;
  } else if (title) {
    clearError(title);
  }

  const asInt = (el) => parseInt(el && el.value, 10);

  if (focus) {
    const n = asInt(focus);
    if (Number.isNaN(n) || n < 10 || n > 90) {
      showError(focus, 'Focus minutes must be between 10 and 90');
      isValid = false;
    } else {
      clearError(focus);
    }
  }

  if (brk) {
    const n = asInt(brk);
    if (Number.isNaN(n) || n < 3 || n > 30) {
      showError(brk, 'Break minutes must be between 3 and 30');
      isValid = false;
    } else {
      clearError(brk);
    }
  }

  if (cycles) {
    const n = asInt(cycles);
    if (Number.isNaN(n) || n < 1 || n > 8) {
      showError(cycles, 'Cycles must be between 1 and 8');
      isValid = false;
    } else {
      clearError(cycles);
    }
  }

  return isValid;
}

/**
 * Show error message for a field
 * @param {HTMLElement} field - Form field
 * @param {string} message - Error message
 */
function showError(field, message) {
  // Remove any existing error
  clearError(field);

  // Create error element
  const error = document.createElement('div');
  error.className = 'error-message';
  error.textContent = message;
  error.style.color = 'red';
  error.style.fontSize = '0.875rem';
  error.style.marginTop = '0.25rem';

  // Insert after field
  field.parentNode.insertBefore(error, field.nextSibling);

  // Add error class to field
  field.classList.add('error');
  field.style.borderColor = 'red';
}

/**
 * Clear error message for a field
 * @param {HTMLElement} field - Form field
 */
function clearError(field) {
  const error = field.parentNode.querySelector('.error-message');
  if (error) {
    error.remove();
  }
  field.classList.remove('error');
  field.style.borderColor = '';
}

/**
 * Initialize interactive elements
 */
function initInteractiveElements() {
  const anchorLinks = document.querySelectorAll('a[href^="#"]');
  anchorLinks.forEach((link) => {
    link.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  const body = document.body;
  const display = document.querySelector('.timer-display');
  const focusInput = document.getElementById('focusMinutes');
  const breakInput = document.getElementById('breakMinutes');
  const cyclesInput = document.getElementById('cycles');

  const K = {
    mode: 'ffMode',
    preset: 'ffPreset',
    interval: 'ffInterval',
    custom: 'ffCustom',
    currentSessionId: 'ff.currentSessionId',
  };

  function setCurrentSessionId(id) {
    if (id != null) localStorage.setItem(K.currentSessionId, String(id));
  }
  function getCurrentSessionId() {
    return localStorage.getItem(K.currentSessionId);
  }
  function markActiveQueueButton(id) {
    const items = document.querySelectorAll('.session-queue [data-session-id], .session-queue .queue-item');
    items.forEach((el) => {
      const elId = el.dataset.sessionId || '';
      const isMatch = id && elId === String(id);
      el.classList.toggle('is-selected', !!isMatch);
      if (isMatch) el.setAttribute('aria-current', 'true');
      else el.removeAttribute('aria-current');
    });
  }
  function computeFallbackId(el) {
    const t = (el.dataset.title || '').trim();
    const f = el.dataset.focus || '';
    const b = el.dataset.break || '';
    const c = el.dataset.cycles || '';
    return `${t}|${f}|${b}|${c}`;
  }
  function getElementId(el) {
    return el.dataset.sessionId || computeFallbackId(el);
  }

  document.querySelectorAll('.preset-panel .chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      focusInput.value = btn.dataset.focus;
      breakInput.value = btn.dataset.break;
      cyclesInput.value = btn.dataset.cycles;

      const m = parseInt(btn.dataset.focus, 10) || 0;
      display.textContent = String(m).padStart(2, '0') + ':00';

      document.querySelectorAll('.preset-panel .chip').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      body.classList.remove('theme-classic', 'theme-deep', 'theme-lightning');

      const label = btn.querySelector('.preset-name')?.textContent.trim().toLowerCase() || '';
      if (label.includes('classic')) body.classList.add('theme-classic');
      else if (label.includes('deep')) body.classList.add('theme-deep');
      else if (label.includes('lightning')) body.classList.add('theme-lightning');

      document.querySelectorAll('.queue-item').forEach((item) => {
        item.classList.remove('is-selected');
      });

      const labelEl = document.querySelector('.timer-label');
      const presetName = btn.querySelector('.preset-name')?.textContent.trim() || 'Custom';
      labelEl.textContent = `Current interval: ${presetName}`;

      const presetNameLc = presetName.toLowerCase();
      let normalized = 'classic';
      if (presetNameLc.includes('deep')) normalized = 'deep work';
      else if (presetNameLc.includes('lightning')) normalized = 'lightning';
      localStorage.setItem(K.mode, 'preset');
      localStorage.setItem(K.preset, normalized);
      localStorage.setItem(K.interval, 'focus');
      setCurrentSessionId('');
      markActiveQueueButton('');
    });
  });

  const intervalBtns = document.querySelectorAll('.interval-toggle .chip');
  const [focusBtn, breakBtn, longBreakBtn] = intervalBtns;

  const PRESET_MINUTES = {
    classic: { focus: 25, break: 5, long: 15 },
    'deep work': { focus: 50, break: 10, long: 20 },
    lightning: { focus: 15, break: 3, long: 13 },
  };

  let currentPreset = 'classic';
  function setTimer(min) {
    display.textContent = String(min).padStart(2, '0') + ':00';
  }
  function setActiveInterval(which) {
    intervalBtns.forEach((b) => b.classList.remove('active'));
    if (which === 'focus') focusBtn?.classList.add('active');
    if (which === 'break') breakBtn?.classList.add('active');
    if (which === 'long') longBreakBtn?.classList.add('active');
  }

  function getMode() {
    return localStorage.getItem(K.mode) || 'preset';
  }
  function getCustomSession() {
    try {
      return JSON.parse(localStorage.getItem(K.custom) || 'null');
    } catch {
      return null;
    }
  }
  function minutesFor(which) {
    if (getMode() === 'custom') {
      const s = getCustomSession() || {};
      if (which === 'focus') return parseInt(s.focus || 25, 10);
      if (which === 'break') return parseInt(s.break || 5, 10);
      if (which === 'long') return parseInt(s.long || 15, 10);
    }
    return PRESET_MINUTES[currentPreset][which === 'long' ? 'long' : which];
  }
  function setIntervalAndTimer(which) {
    setActiveInterval(which);
    localStorage.setItem(K.interval, which);
    setTimer(minutesFor(which));
  }

  document.querySelectorAll('.preset-panel .chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.querySelector('.preset-name')?.textContent.trim().toLowerCase() || 'classic';
      currentPreset = name in PRESET_MINUTES ? name : 'classic';
      setTimer(PRESET_MINUTES[currentPreset].focus);
      setActiveInterval('focus');
    });
  });

  focusBtn?.addEventListener('click', () => {
    setIntervalAndTimer('focus');
  });

  breakBtn?.addEventListener('click', () => {
    setIntervalAndTimer('break');
  });

  longBreakBtn?.addEventListener('click', () => {
    setIntervalAndTimer('long');
  });


  setTimer(PRESET_MINUTES[currentPreset].focus);
  setActiveInterval('focus');

  (function restoreLastState() {
    const savedMode = localStorage.getItem(K.mode) || 'preset';
    const savedInterval = localStorage.getItem(K.interval) || 'focus';

    const chips = document.querySelectorAll('.preset-panel .chip');
    const timerLabel = document.getElementById('timerLabel') || document.querySelector('.timer-label');

    const selectPresetChip = (name) => {
      chips.forEach((c) => c.classList.remove('active'));
      const chip = Array.from(chips).find(
        (c) => c.querySelector('.preset-name')?.textContent.trim().toLowerCase() === name
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
          if (timerLabel) timerLabel.textContent = `Current interval: ${s.title || 'Session'}`;

          chips.forEach((c) => c.classList.remove('active'));

          const mins =
            savedInterval === 'break' ? s.break :
            savedInterval === 'long'  ? (s.long || 15) :
            s.focus;

          setTimer(mins);
          setActiveInterval(savedInterval);
          return;
        }
      } catch { /* fall back to preset restore */ }
    }

    const savedPreset = (localStorage.getItem(K.preset) || 'classic').toLowerCase();
    if (!selectPresetChip(savedPreset)) {
      setActiveInterval(savedInterval);
    }
  })();

  (function wireQueueClicks() {
    const list = document.getElementById('sessionList');
    if (!list) return;

    const timerLabel = document.getElementById('timerLabel');
    const timerDisplay = document.getElementById('timerDisplay');

    const focusInput = document.getElementById('focusMinutes');
    const breakInput = document.getElementById('breakMinutes');
    const cyclesInput = document.getElementById('cycles');

    const chipFocus = document.getElementById('chipFocus');
    const chipBreak = document.getElementById('chipBreak');
    const chipLong = document.getElementById('chipLong');

    const presetChips = document.querySelectorAll('.preset-panel .chip');

    function setFocusActive() {
      [chipFocus, chipBreak, chipLong].forEach((b) => b?.classList.remove('active'));
      chipFocus?.classList.add('active');
    }

    function toMMSS(mins) {
      const m = String(mins).padStart(2, '0');
      return `${m}:00`;
    }

    list.addEventListener('click', (e) => {
      const btn = e.target.closest('.queue-item');
      if (!btn) return;

      if (!btn.dataset.sessionId) btn.dataset.sessionId = computeFallbackId(btn);

      const title  = btn.dataset.title  || 'Session';
      const focusM = parseInt(btn.dataset.focus  || '25', 10);
      const breakM = parseInt(btn.dataset.break  || '5', 10);
      const cycles = parseInt(btn.dataset.cycles || '1', 10);

      if (focusInput) focusInput.value = focusM;
      if (breakInput) breakInput.value = breakM;
      if (cyclesInput) cyclesInput.value = cycles;

      if (timerDisplay) timerDisplay.textContent = toMMSS(focusM);
      if (timerLabel)  timerLabel.textContent  = `Current interval: ${title}`;

      setFocusActive();
      presetChips.forEach((chip) => chip.classList.remove('active'));

      list.querySelectorAll('.queue-item').forEach((q) => q.classList.remove('is-selected'));
      btn.classList.add('is-selected');

      localStorage.setItem(K.mode, 'custom');
      localStorage.setItem(K.interval, 'focus');
      setCurrentSessionId(getElementId(btn));
      markActiveQueueButton(getElementId(btn));

      localStorage.setItem(
        K.custom,
        JSON.stringify({ title, focus: focusM, break: breakM, cycles })
      );
    });

    const restoredId = getCurrentSessionId();
    if (restoredId) {
      let tries = 0;
      const tryMark = () => {
        const el = Array.from(list.querySelectorAll('.queue-item')).find((q) => {
          const id = q.dataset.sessionId || computeFallbackId(q);
          return id === restoredId;
        });
        if (el) {
          el.classList.add('is-selected');
          markActiveQueueButton(restoredId);
        } else if (tries < 20) {
          tries++;
          requestAnimationFrame(tryMark);
        }
      };
      requestAnimationFrame(tryMark);
    }
  })();

  (function wireAddSessionForm() {
    const form = document.getElementById('addSessionForm') || document.querySelector('form[data-validate]');
    if (!form) return;

    form.addEventListener('submit', function () {
      if (!validateForm(form)) return;

      const title =
        (form.querySelector('#title')?.value || 'Session').trim() || 'Session';
      const focusM =
        parseInt(form.querySelector('#focusMinutes')?.value, 10) || 25;
      const breakM =
        parseInt(form.querySelector('#breakMinutes')?.value, 10) || 5;
      const cycles = parseInt(form.querySelector('#cycles')?.value, 10) || 1;

      const labelEl =
        document.getElementById('timerLabel') ||
        document.querySelector('.timer-label');
      const displayEl =
        document.getElementById('timerDisplay') ||
        document.querySelector('.timer-display');

      if (labelEl) labelEl.textContent = `Current interval: ${title}`;
      if (displayEl)
        displayEl.textContent = String(focusM).padStart(2, '0') + ':00';

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
        JSON.stringify({ title, focus: focusM, break: breakM, cycles })
      );



      const targetId = `${title}|${focusM}|${breakM}|${cycles}`;
      setCurrentSessionId(targetId);

      (function highlightWhenPresent() {
        const list = document.getElementById('sessionList');
        if (!list) return;

        let tries = 0;
        const tryMark = () => {
          const el = Array.from(list.querySelectorAll('.queue-item')).find(
            (q) => {
              const id =
                q.dataset.sessionId ||
                `${q.dataset.title || ''}|${q.dataset.focus || ''}|${q.dataset.break || ''}|${q.dataset.cycles || ''}`;
              return id === targetId;
            }
          );

          if (el) {
            if (!el.dataset.sessionId) el.dataset.sessionId = targetId;
            el.classList.add('is-selected');
            markActiveQueueButton(targetId);
          } else if (tries < 30) {
            tries++;
            setTimeout(tryMark, 50);
          }
        };
        tryMark();
      })();
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

/**
 * Display a notification message
 * @param {string} message - Message to display
 * @param {string} type - Type of message (success, error, info, warning)
 */
/* eslint-disable no-unused-vars */
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.position = 'fixed';
  notification.style.top = '20px';
  notification.style.right = '20px';
  notification.style.padding = '1rem';
  notification.style.borderRadius = '4px';
  notification.style.backgroundColor =
    type === 'success'
      ? '#28a745'
      : type === 'error'
        ? '#dc3545'
        : type === 'warning'
          ? '#ffc107'
          : '#17a2b8';
  notification.style.color = 'white';
  notification.style.zIndex = '1000';
  notification.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';

  // Add to page
  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Export functions if using modules
// export { validateForm, makeRequest, showNotification };
