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

  initFormValidation();
  initInteractiveElements();
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
function showError(field, message, isServer = false) {
  // Remove any existing error
  clearError(field);

  // Create error element
  const error = document.createElement('div');
  error.className = 'error-message';
  if (isServer) {
    error.classList.add('server-error');
  }
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

function clearServerErrors(form) {
  form.querySelectorAll('.server-error').forEach((msg) => msg.remove());
  form.querySelectorAll('.error').forEach((input) => {
    input.classList.remove('error');
    input.style.borderColor = '';
  });
}

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
  const display = document.querySelector('.timer-display');
  const focusInput = document.getElementById('focusMinutes');
  const breakInput = document.getElementById('breakMinutes');
  const cyclesInput = document.getElementById('cycles');
  const titleInput = document.getElementById('title');

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
  };

  presetChips.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (focusInput) focusInput.value = btn.dataset.focus;
      if (breakInput) breakInput.value = btn.dataset.break;
      if (cyclesInput) cyclesInput.value = btn.dataset.cycles;

      const m = parseInt(btn.dataset.focus, 10) || 0;
      display.textContent = String(m).padStart(2, '0') + ':00';

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

      document.querySelectorAll('.queue-item').forEach((item) => {
        item.classList.remove('is-selected');
      });
      
      const labelEl = document.querySelector('.timer-label');
      const presetName =
        btn.querySelector('.preset-name')?.textContent.trim() || 'Custom';
      labelEl.textContent = `Current interval: ${presetName}`;

      const presetNameLc = presetName.toLowerCase();
      let normalized = 'classic';
      if (presetNameLc.includes('deep'))
        normalized = 'deep work';
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
    classic: { focus: 25, break: 5, long: 15 },
    'deep work': { focus: 50, break: 10, long: 20 },
    lightning: { focus: 15, break: 3, long: 13 },
  };

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
    display.textContent = String(min).padStart(2, '0') + ':00';
  }

  function setActiveInterval(which) {
    intervalBtns.forEach((b) => b.classList.remove('active'));
    if (which === 'focus') focusBtn.classList.add('active');
    if (which === 'break') breakBtn.classList.add('active');
    if (which === 'long') longBreakBtn.classList.add('active');
  }

  presetChips.forEach((btn) => {
    btn.addEventListener('click', () => {
      const name =
        btn.querySelector('.preset-name')?.textContent.trim().toLowerCase() ||
        'classic';
      currentPreset = name in PRESET_MINUTES ? name : 'classic';

      setTimer(PRESET_MINUTES[currentPreset].focus);
      setActiveInterval('focus');
    });
  });

  focusBtn?.addEventListener('click', () => {
    setTimer(minutesFor('focus'));
    setActiveInterval('focus');
    localStorage.setItem(K.interval, 'focus');
  });

  breakBtn?.addEventListener('click', () => {
    setTimer(minutesFor('break'));
    setActiveInterval('break');
    localStorage.setItem(K.interval, 'break');
  });

  longBreakBtn?.addEventListener('click', () => {
    setTimer(minutesFor('long'));
    setActiveInterval('long');
    localStorage.setItem(K.interval, 'long');
  });

  setTimer(minutesFor('focus'));
  setActiveInterval('focus');

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
        if (savedInterval === 'break')
          breakBtn?.click();
        else if (savedInterval === 'long')
          longBreakBtn?.click();
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

    const timerLabel =
      document.getElementById('timerLabel') ||
      document.querySelector('.timer-label');
    const timerDisplay =
      document.getElementById('timerDisplay') ||
      document.querySelector('.timer-display');

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

      if (timerDisplay) timerDisplay.textContent = toMMSS(focusM);
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
    const form =
      document.getElementById('addSessionForm') ||
      document.querySelector('form[data-validate]');
    if (!form) return;

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      clearServerErrors(form);
      if (!validateForm(form)) return;

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
            if (el) showError(el, message, true);
          });
          showNotification('Please fix the highlighted fields.', 'error');
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
        showNotification('Session added to your queue.', 'success');

        const session = payload.session;
        if (session) {
          const labelEl =
            document.getElementById('timerLabel') ||
            document.querySelector('.timer-label');
          const displayEl =
            document.getElementById('timerDisplay') ||
            document.querySelector('.timer-display');
          if (labelEl) labelEl.textContent = `Current interval: ${session.title}`;
          if (displayEl)
            displayEl.textContent = String(session.focusMinutes).padStart(2, '0') + ':00';

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
        }

        await refreshSessions(payload);
      } catch (error) {
        console.error('Failed to save session', error);
        showNotification('Could not save session. Please try again.', 'error');
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
    showNotification(
      'Unable to refresh the session queue. Please reload.',
      'warning'
    );
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
