let notificationWS = null;

function setNotificationWS(instance) {
  notificationWS = instance;
  if (notificationWS) {
    console.log('[NotificationEmitter] Notification WebSocket instance registered');
  } else {
    console.warn('[NotificationEmitter] Notification WebSocket instance cleared');
  }
}

function getNotificationWS() {
  return notificationWS;
}

module.exports = {
  setNotificationWS,
  getNotificationWS
};
