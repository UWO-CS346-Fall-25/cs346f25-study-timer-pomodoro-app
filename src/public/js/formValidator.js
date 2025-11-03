/* eslint-env browser */

(function (window) {
  /**
   * FormValidator centralizes client-side validation helpers so logic is shared
   * between the session and goal forms.
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
        if (trimmedTitle.length > 60) {
          FormValidator.showError(title, 'Title must be 60 characters or fewer');
          isValid = false;
        } else if (trimmedTitle.length > 0) {
          FormValidator.clearError(title);
        }
      }

      const asInt = (el) => parseInt(el && el.value, 10);

      if (focus) {
        const n = asInt(focus);
        if (Number.isNaN(n) || n < 10 || n > 90) {
          FormValidator.showError(focus, 'Focus minutes must be between 10 and 90');
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

  window.FormValidator = FormValidator;
})(window);
(function (window) {
  /* eslint-env browser */
