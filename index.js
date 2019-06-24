var JiraApi = require('jira-client');
const { compareAsc, distanceInWordsToNow, addDays, isBefore } = require('date-fns')
const sendMessageToMattermost = require('./sendMessageToMattermost')
var ruLocale = require('date-fns/locale/ru')


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
      const lastDateToClose = addDays(new Date(issue.fields.created), priorityToTimeMapping[issue.fields.priority.name])
      issue.lastDateToClose = lastDateToClose;
      return issue;
    })
    arr.sort((i1, i2) => compareAsc(i1.lastDateToClose,i2.lastDateToClose))
    return arr;
  })
  .then((issues) => {
    const header = 
    `
## :policeman: BUG POLICY REPORT :policeman:

|Приоритет|Описание|Время|
|---|---|---|`
    let message = [header, ...issues.map(formatIssue)].join('\n')

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

function formatIssue(issue) {
  
  const link = `http://jira.rn/browse/${issue.key}`;
  const jiraID= issue.key;
  const title= issue.fields.summary;
  const lastDateToClose = issue.lastDateToClose;
  const priorityUrl= issue.fields.priority.iconUrl;
  const priorityName = issue.fields.priority.name


  const today = new Date();
  const statusMessage = isBefore(today, lastDateToClose) ?  ':eggplant: у нас ещё есть': ':fire: мы опоздали на';
 
  return `|![](${priorityUrl}) ${priorityName}|[${jiraID} ${title}](${link})|${statusMessage} ${distanceInWordsToNow(lastDateToClose, {locale: ruLocale})}|`;
}
