"use strict";
const express = require("express"),
    app = express(),
    util = require('util'),
    url = require('url'),
    logger = require('./src/logger/logger'),
    queue = require("./src/setQueueStatus"),
    current = require("./src/setForwardStatus"),
    email = require("./src/modifyEmailForward"),
    rules = require("./src/modifyForwardRules");


app.get("/*", function(req, res) {
    let queryData = url.parse(req.url, true).query;
});

async function replaceStatusQueue(extension, statusQueue) {
    try {
        let resultModifyQueueStatus = await queue.setQueueStatus(extension, statusQueue);
        //result == 'ok' ? res.json({ queue: true });  : res.json({ queue: false });
        logger.info(`Результат изменения статуса ${resultModifyQueueStatus} для абонента ${extension} ${result}`);
        return;
    } catch (e) {
        logger.error(`Ошибка изменения статуса пользователя в очереди:  ${util.inspect(e)}`);
        //res.json({ queue: false });
    }
}

async function setNewForwardRules(extension, forwardStatus, forwardRule) {
    try {

        let resultModifyForwardRules = await rules.modifyForwardRules(extension, forwardStatus, forwardRule);
        setTimeout(current.setForwardStatus, 10000, extension, 'Away')
            //let resultSetForwardStatus = await current.setForwardStatus(extension,'Away');
        return;
    } catch (e) {
        logger.error(`Ошибка изменения правил переадресации пользователя :  ${util.inspect(e)}`);
        //res.json({ queue: false });
    }
}


setNewForwardRules('623', true, 'mobile');
//setTimeout(forwardRules.modifyForwardRules,10000,'623',true,'exten')
//setTimeout(queueStatus.setQueueStatus,10000,'103',true)

app.listen(3000);