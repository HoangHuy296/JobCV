/**
 * Date utility functions
 */

/**
 * Get current local timestamp in MySQL datetime format
 * Converts UTC time to local time (Vietnam UTC+7)
 * @returns {string} Timestamp in format 'YYYY-MM-DD HH:mm:ss'
 */
function getLocalTimestamp() {
  const now = new Date();
  const localTime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
  return localTime.toISOString().slice(0, 19).replace('T', ' ');
}

module.exports = {
  getLocalTimestamp
};
