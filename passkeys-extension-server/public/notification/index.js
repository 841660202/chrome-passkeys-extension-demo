(function (window) {
  function NotificationSystem() {
    this.container = document.createElement('div');
    this.container.id = 'notification-container';
    document.body.appendChild(this.container);
  }

  NotificationSystem.prototype.show = function (message, title, type, options) {
    var notification = document.createElement('div');
    notification.className = 'notification ' + type;

    if (title) {
      var titleElement = document.createElement('strong');
      titleElement.innerText = title;
      notification.appendChild(titleElement);
    }

    var messageElement = document.createElement('div');
    messageElement.innerText = message;
    notification.appendChild(messageElement);

    this.container.appendChild(notification);

    var timeout = (options && options.timeout) || 5000;

    setTimeout(
      function () {
        notification.style.opacity = '0';
        setTimeout(
          function () {
            this.container.removeChild(notification);
          }.bind(this),
          3000
        );
      }.bind(this),
      timeout
    );
  };

  NotificationSystem.prototype.success = function (message, title, options) {
    this.show(message, title, 'success', options);
  };

  NotificationSystem.prototype.error = function (message, title, options) {
    this.show(message, title, 'error', options);
  };

  NotificationSystem.prototype.info = function (message, title, options) {
    this.show(message, title, 'info', options);
  };

  NotificationSystem.prototype.warning = function (message, title, options) {
    this.show(message, title, 'warning', options);
  };

  window.notificationSystem = new NotificationSystem();
})(window);
