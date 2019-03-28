const https = require("https");

/**
 * Отправляет сообщение в маттермост
 * @param {Object} mattermostOptions
 * @returns {Promise<void>}
 */
module.exports = async function sendMessageToMattermost({
  text,
  username,
  icon_url,
  host,
  webhookPath,
  channel
}) {
  const options = {
    host,
    port: 443,
    path: webhookPath,
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  };

  const body = { username, icon_url, text, channel };

  return new Promise((resolve, reject) => {
    // eslint-disable-next-line consistent-return
    const req = https.request(options, function responseHandler(res) {
      if (res.statusCode === 200) {
        return resolve();
      }
      res.setEncoding("utf8");
      // eslint-disable-next-line no-shadow
      res.on("data", function dataHandler(body) {
        return reject(body);
      });
    });

    req.on("error", function errorHandler(e) {
      return reject(e.message);
    });

    req.write(JSON.stringify(body));
    req.end();
  });
};
