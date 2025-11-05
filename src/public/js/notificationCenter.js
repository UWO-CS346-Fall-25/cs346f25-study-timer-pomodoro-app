/* eslint-env browser */
/* global Toastify */
// cspell:ignore Toastify

(function (window) {
  /**
   * NotificationCenter centralizes toast/alert behavior so other modules do
   * not need to know about Toastify implementation details.
   */
  const NotificationCenter = {
    /**
     * Display a toast message to the user.
     * @param {string} message
     * @param {'success'|'error'|'warning'|'info'} [type='info']
     */
    show(message, type = 'info') {
      const palette = {
        success: '#16a34a',
        error: '#dc2626',
        warning: '#f97316',
        info: '#2563eb',
      };

      if (typeof Toastify === 'function') {
        Toastify({
          text: message,
          duration: 3500,
          gravity: 'top',
          position: 'right',
          stopOnFocus: true,
          close: true,
          className: `ff-toast ff-toast--${type}`,
          style: {
            background:
              type === 'success'
                ? 'linear-gradient(90deg,#00b09b,#96c93d)'
                : palette[type] || palette.info,
            color: '#ffffff',
            boxShadow: '0 10px 25px -15px rgba(15, 23, 42, 0.6)',
            borderRadius: '999px',
            padding: '0.85rem 1.5rem',
          },
          offset: { x: 20, y: 20 },
        }).showToast();
        return;
      }

      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      notification.textContent = message;
      notification.style.position = 'fixed';
      notification.style.top = '20px';
      notification.style.right = '20px';
      notification.style.padding = '1rem';
      notification.style.borderRadius = '999px';
      notification.style.backgroundColor = palette[type] || palette.info;
      notification.style.color = '#ffffff';
      notification.style.zIndex = '1000';
      notification.style.boxShadow = '0 10px 25px -15px rgba(15, 23, 42, 0.6)';

      document.body.appendChild(notification);

      setTimeout(() => {
        notification.remove();
      }, 3500);
    },
  };

  window.NotificationCenter = NotificationCenter;
})(window);
