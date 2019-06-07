var JiraApi = require('jira-client');
const { compareAsc, distanceInWordsToNow, addDays, isBefore } = require('date-fns')
const sendMessageToMattermost = require('./sendMessageToMattermost')

let config ;
try {
  config = require('./config.js') 
} catch(err) {
  console.error('НЕ СМОГ СЧИТАТЬ КОНФИГ')
  config = {}
}

const jiraHost = process.env.JIRA_HOST || config.jiraHost;
const jiraUsername = process.env.JIRA_USERNAME || config.jiraUsername;
const jiraPassword = process.env.JIRA_PASSWORD || config.jiraPassword;

const jiraQuery = process.env.JIRA_QUERY || config.jiraQuery;
const mattermostWebhookPath = process.env.MATTERMOST_WEBHOOK_PATH || config.mattermostWebhookPath;
const mattermostChannel = process.env.MATTERMOST_CHANNEL || config.mattermostChannel;

// Initialize
var jira = new JiraApi({
  protocol: 'http',
  host: jiraHost,
  username: jiraUsername,
  password: jiraPassword,
  apiVersion: '2',
});


/** маппинг приоритет бага => время для решения */
const priorityToTimeMapping = {
  Trivial: 90,
  Minor: 28,
  Major: 14,
  Critical: 1,
  Blocker: 0
}

jira.searchJira(jiraQuery)
  .then(function(result) {
    const arr = result.issues.map(issue => {
      let lastDateToClose = addDays(new Date(issue.fields.created), priorityToTimeMapping[issue.fields.priority.name])
      return {
        key: issue.key,
        link: `http://jira.rn/browse/${issue.key}`,
        priority: issue.fields.priority.name,
        lastDateToClose: lastDateToClose
      }
    })
    arr.sort((i1, i2) => compareAsc(i1.lastDateToClose,i2.lastDateToClose))
    return arr;
  })
  .then((issues) => {
    let message = ['## :policeman: BUG POLICY REPORT :policeman:', ...issues.map(formatIssue)].join('\n')
    return sendMessageToMattermost({
      text: message,
      username: 'Bug Policy Reporter',
      icon_url: 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/apple/198/police-officer_1f46e.png',
      webhookPath: mattermostWebhookPath,
      channel: mattermostChannel
    })
  })
  .then(()=> console.log('success'))
  .catch(function(err) {
    console.error(err);
  });

/** маппинг приоритет бага => emoji */
const priorityToEmojiMapping = {
  Trivial: ':turtle:',
  Minor: ':kick_scooter:',
  Major: ':car:',
  Critical: ':fire:',
  Blocker: ':rocket:'
}
function formatIssue({lastDateToClose, priority, link, key}) {
  const emoji = priorityToEmojiMapping[priority];
  const today = new Date();
  const statusMessage = isBefore(today, lastDateToClose) ?  'у нас ещё есть': 'мы опоздали на';
  return `${emoji} [${key}](${link}) ${statusMessage} ${distanceInWordsToNow(lastDateToClose)} ${emoji}`;
}
