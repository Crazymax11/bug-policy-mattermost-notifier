const axios = require('axios');

/**
 * Отправляет сообщение в маттермост
 * @param {Object} mattermostOptions
 * @returns {Promise<void>}
 */
module.exports = async function sendMessageToMattermost({
  text,
  username,
  icon_url,
  webhookPath,
  channel
}) {
  return axios.post(webhookPath, { username, icon_url, text, channel });
};
