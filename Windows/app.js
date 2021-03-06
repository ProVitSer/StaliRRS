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
    logger.info(`Поступил запрос ${req.url}`);
    next();
});

// Изменение статуса агента queue?exten=656&status=true/false - включить/отключить из очереди добавочный 656.
app.post('/queue*', async(req, res) => {
    try {
        let queryData = url.parse(req.url, true);
        logger.info(`Получены данные для изменения статуса очереди ${queryData.path}`);
        await sleep(5000); //Задержка перед применением изменений
        replaceStatusQueue(res, queryData.query.exten, queryData.query.status);
    } catch (e) {
        logger.error(e);
    }
});

// Изменение переадресации почты /mail?from=с какой почты&to=на какую почту&dateFrom=22.03.2021&dateTo=23.03.2021&status=false\true(отключить\включить)
app.post('/mail*', async(req, res) => {
    try {
        let queryData = url.parse(req.url, true);
        logger.info(`Получены данные для изменения переадресации почты ${queryData.path}`);
        await sleep(5000); //Задержка перед применением изменений
        setEmailForward(res, queryData.query.from, queryData.query.to, queryData.query.status);
    } catch (e) {
        logger.error(e);
    }
});

// Изменение статуса переадресации по добавочному forward?exten=656&type=extension&number=702&dateFrom=12.03.2021&dateTo=13.03.2021 - переадресация с добавочного номера 656 на добавочный номер 702 до 13.03.2021
app.post('/forward*', async(req, res) => {
    try {
        let queryData = url.parse(req.url, true);
        logger.info(`Получены данные для изменения статуса переадресации по добавочному номеру ${queryData.path}`);
        await sleep(5000); //Задержка перед применением изменений
        setNewForwardRules(res, queryData.query.exten, queryData.query.type, queryData.query.number, queryData.query.status);
    } catch (e) {
        logger.error(e);
    }
});


function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

async function replaceStatusQueue(res, extension, statusQueue) {
    try {
        const resultModifyQueueStatus = await queue.setQueueStatus(extension, statusQueue);
        resultModifyQueueStatus == 'ok' ? res.status(200).json({ queue: resultModifyQueueStatus }) : res.status(503).json({ queue: resultModifyQueueStatus });
        logger.info(`Результат изменения статуса ${resultModifyQueueStatus} для абонента ${extension}`);
        return;
    } catch (e) {
        logger.error(`Ошибка изменения статуса пользователя в очереди:  ${inspect(e)}`);
        res.status(503).json({ queue: e });
    }
}

async function setEmailForward(res, forwardFromEmail, forwardToEmail, status) {
    try {
        const resultSetForwardEmail = await email.modifyMailForwardRules(forwardFromEmail, forwardToEmail, status);
        resultSetForwardEmail == 'ok' ? res.status(200).json({ email: true }) : res.status(503).json({ email: false });
        logger.info(`Результат изменения статуса ${resultSetForwardEmail} для абонента ${forwardFromEmail}`);
        return;
    } catch (e) {
        logger.error(`Ошибка изменения правил переадресации почты:  ${inspect(e)}`);
        res.status(503).json({ email: e });
    }
}

async function setNewForwardRules(res, extension, forwardRule, number, status) {
    try {
        if (status == 'true') {
            const resultModifyForwardRules = await rules.modifyForwardRules(extension, forwardRule, number);
            setTimeout(current.setForwardStatus, 10000, extension, 'Custom 2'); //Custom 2 (командировка)- статус с web 3cx
            resultModifyForwardRules == 'ok' ? res.status(200).json({ forward: resultModifyForwardRules }) : res.status(503).json({ forward: resultModifyForwardRules });
            logger.info(`Результат изменения переадресации ${resultModifyForwardRules} для абонента ${extension}`);
            return;
        } else {
            let resultSetForwardStatus = await current.setForwardStatus(extension, 'Available'); //Available(доступен) - статус с web 3cx
            resultSetForwardStatus == 'ok' ? res.status(200).json({ forward: resultSetForwardStatus }) : res.status(503).json({ forward: resultSetForwardStatus });
            logger.info(`Результат изменения переадресации ${resultSetForwardStatus} для абонента ${extension}`);
            return;
        }
    } catch (e) {
        logger.error(`Ошибка изменения правил переадресации пользователя :  ${inspect(e)}`);
        res.status(503).json({ forward: e });
    }
}

app.listen(3000);