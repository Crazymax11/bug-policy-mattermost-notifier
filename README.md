# Bug Policy Mattermost Notifier

Уведомлятор о соблюдении баг полиси

Выглядит примерно так:

![](./static/example.png)

## Как использовать

* git clone
* `mv config.sample.js config.js`
* Напиши в `config.js` свои
    * `jiraHost` - домен твоей jira
    * `jiraUsername` - юзернейм пользователя, под которым нотифаер будет логинится
    * `jiraPassword` - пароль пользователя, под которым нотифаер будет логинится
    * `jiraQuery` - запрос в jira за вашими багами
    * `mattermostWebhookPath` - url mattermost webhook, можно узнать в интерфейсе маттермост
    * `mattermostChannel` - канал, в который нужно писать сообщение
* используй `npm start` и получай отчёт!

### Пример запуска в докере

`docker run -e JIRA_HOST=jira.rn -e JIRA_USERNAME=user -e JIRA_PASSWORD=pass -e JIRA_QUERY="issuetype = Bug AND createdDate > 2019-03-10 AND resolution = Unresolved AND project in (N1MONEY)"-e MATTERMOST_WEBHOOK_PATH="https://domain.com/hooks/hash" bug-policy-retport:latest`