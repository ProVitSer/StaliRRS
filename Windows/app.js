/* eslint-disable no-unused-expressions */
"use strict"; // eslint-disable-line
const express = require("express"),
    app = express(),
    util = require('util'),
    url = require('url'),
    logger = require('./logger/logger'),
    queue = require("./setQueueStatus"),
    current = require("./setForwardStatus"),
    email = require("./modifyEmailForward"),
    rules = require("./modifyForwardRules");

app.use((req, res, next) => {
    console.log(`Поступил запрос ${req.url}`);
    next();
});

async function replaceStatusQueue(res, extension, statusQueue) {
    try {
        const resultModifyQueueStatus = await queue.setQueueStatus(extension, statusQueue);
        resultModifyQueueStatus == 'ok' ? res.status(200).json({ queue: resultModifyQueueStatus }) : res.status(503).json({ queue: resultModifyQueueStatus });
        console.log(`Результат изменения статуса ${resultModifyQueueStatus} для абонента ${extension}`);
        return;
    } catch (e) {
        console.log(`Ошибка изменения статуса пользователя в очереди:  ${inspect(e)}`);
        res.status(503).json({ queue: e });
    }
}

async function setEmailForward(res, forwardFromEmail, forwardToEmail, status) {
    try {
        const resultSetForwardEmail = email.modEmailForward(forwardFromEmail, forwardToEmail, status);
        resultSetForwardEmail == 'ok' ? res.status(200).json({ email: true }) : res.status(503).json({ email: false });
        console.log(`Результат изменения статуса ${resultSetForwardEmail} для абонента ${forwardFromEmail}`);
        return;
    } catch (e) {
        console.log(`Ошибка изменения правил переадресации почты:  ${inspect(e)}`);
        res.status(503).json({ email: e });
    }
}

async function setNewForwardRules(res, extension, forwardRule, number, status) {
    try {
        if (status == 'true') {
            const resultModifyForwardRules = await rules.modifyForwardRules(extension, forwardRule, number);
            setTimeout(setForwardStatus, 10000, extension, 'Custom 2');
            // res.status(200).json({ forward: resultModifyForwardRules });
            resultModifyForwardRules == 'ok' ? res.status(200).json({ forward: resultModifyForwardRules }) : res.status(503).json({ forward: resultModifyForwardRules });
            console.log(`Результат изменения переадресации ${resultModifyForwardRules} для абонента ${extension}`);
            return;
        } else {
            let resultSetForwardStatus = await current.setForwardStatus(extension, 'Available');
            resultSetForwardStatus == 'ok' ? res.status(200).json({ forward: resultSetForwardStatus }) : res.status(503).json({ forward: resultSetForwardStatus });
            console.log(`Результат изменения переадресации ${resultSetForwardStatus} для абонента ${extension}`);
            return;
        }
    } catch (e) {
        console.log(`Ошибка изменения правил переадресации пользователя :  ${inspect(e)}`);
        res.status(503).json({ forward: e });
    }
}

// Изменение статуса агента
app.post('/queue*', (req, res) => {
    const queryData = parse(req.url, true);
    console.log(`Получены данные для изменения статуса очереди ${queryData.path}`);
    replaceStatusQueue(res, queryData.query.exten, queryData.query.status);
});

// Изменение переадресации почты
app.post('/mail*', (req, res) => {
    const queryData = parse(req.url, true);
    console.log(`Получены данные для изменения переадресации почты ${queryData.path}`);
    setEmailForward(res, queryData.query.from, queryData.query.to, queryData.query.status);
});

// Изменение статуса переадресации по добавочному
app.post('/forward*', (req, res) => {
    const queryData = parse(req.url, true);
    console.log(`Получены данные для изменения статуса переадресации по добавочному номеру ${queryData.path}`);
    setNewForwardRules(res, queryData.query.exten, queryData.query.type, queryData.query.number, queryData.query.status);
});

app.listen(3000);