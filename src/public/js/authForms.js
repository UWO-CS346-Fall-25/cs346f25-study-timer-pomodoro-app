/* eslint-env browser */
/* global NotificationCenter */

(function () {
  const cssEscape =
    (window.CSS && typeof window.CSS.escape === 'function'
      ? window.CSS.escape.bind(window.CSS)
      : (value) => value.replace(/([ #;?%&,.+*~\':"!^$[\]()=>|/@])/g, '\\$1'));

  function initAuthForms() {
    const forms = document.querySelectorAll('.auth-form[data-auth-form]');
    if (!forms.length) return;

    forms.forEach((form) => {
      form.addEventListener('submit', (event) => handleSubmit(event, form));
    });
  }

  function handleSubmit(event, form) {
    event.preventDefault();
    clearFieldErrors(form);
    setFormError(form, null);

    const submitButton = form.querySelector('button[type="submit"]');
    setButtonLoading(submitButton, true);

    const payload = buildPayload(form);

    fetch(form.action, {
      method: form.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'fetch',
      },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    })
      .then(async (response) => {
        const data = await safeJson(response);
        if (!response.ok || !data || data.ok === false) {
          throw data || { errors: { form: 'Something went wrong. Try again.' } };
        }
        handleSuccess(form, data);
      })
      .catch((err) => {
        const errors = err?.errors || null;
        if (errors) {
          surfaceFieldErrors(form, errors);
          const formMessage =
            errors.form ||
            'Please fix the highlighted fields and try submitting again.';
          setFormError(form, formMessage);
          NotificationCenter?.show(formMessage, 'error');
        } else {
          const fallbackMsg = 'We could not reach the server. Please try again.';
          setFormError(form, fallbackMsg);
          NotificationCenter?.show(fallbackMsg, 'error');
        }
      })
      .finally(() => {
        setButtonLoading(submitButton, false);
      });
  }

  function safeJson(response) {
    return response
      .clone()
      .json()
      .catch(() => null);
  }

  function buildPayload(form) {
    const formData = new FormData(form);
    const payload = {};
    for (const [key, value] of formData.entries()) {
      payload[key] = value;
    }

    const rememberField = form.querySelector('input[name="rememberMe"]');
    if (rememberField) {
      payload.rememberMe = rememberField.checked;
    }

    return payload;
  }

  function surfaceFieldErrors(form, errors) {
    let firstErrorInput = null;
    Object.entries(errors).forEach(([field, message]) => {
      if (field === 'form') return;
      const input = showFieldError(form, field, message);
      if (!firstErrorInput && input) {
        firstErrorInput = input;
      }
    });

    if (firstErrorInput) {
      firstErrorInput.focus();
    }
  }

  function showFieldError(form, fieldName, message) {
    const input = form.querySelector(`[name="${cssEscape(fieldName)}"]`);
    if (!input) return null;
    input.classList.add('input-error');
    input.setAttribute('aria-invalid', 'true');

    const existing = input.parentElement.querySelector('.field-error--dynamic');
    if (existing) existing.remove();

    const error = document.createElement('span');
    error.className = 'field-error field-error--dynamic';
    error.textContent = message;
    input.parentElement.appendChild(error);
    return input;
  }

  function clearFieldErrors(form) {
    form.querySelectorAll('.field-error--dynamic').forEach((node) => node.remove());
    form
      .querySelectorAll('.input-error')
      .forEach((input) => input.classList.remove('input-error'));
  }

  function setFormError(form, message) {
    const container = form.querySelector('[data-form-error]');
    if (!container) return;
    if (!message) {
      container.hidden = true;
      container.textContent = '';
      container.classList.remove('is-success');
      return;
    }
    container.textContent = message;
    container.hidden = false;
    container.classList.remove('is-success');
  }

  function handleSuccess(form, data) {
    const message = form.dataset.successMessage || 'Success!';
    setFormError(form, null);
    NotificationCenter?.show(message, 'success');

    const redirectTo = data.redirectTo || form.dataset.successRedirect || '/';
    setTimeout(() => {
      window.location.assign(redirectTo);
    }, 800);
  }

  function setButtonLoading(button, isLoading) {
    if (!button) return;
    if (isLoading) {
      if (!button.dataset.originalText) {
        button.dataset.originalText = button.textContent.trim();
      }
      button.classList.add('is-loading');
      button.disabled = true;
    } else {
      button.classList.remove('is-loading');
      button.disabled = false;
      if (button.dataset.originalText) {
        button.textContent = button.dataset.originalText;
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthForms);
  } else {
    initAuthForms();
  }
})();
