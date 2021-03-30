/* eslint-disable no-unused-expressions */
"use strict"; // eslint-disable-line
const express = require("express"),
    app = express(),
    util = require('util'),
    url = require('url'),
    moment = require('moment'),
    logger = require('./logger/logger'),
    Axios = require('./src/axios'),
    db = require('./src/lowdb');

const axios = new Axios();

async function getId(type, {...data }) {
    let id;
    const getInfo = await db.getAllInfo(type);
    for (const key of getInfo) {
        switch (type) {
            case 'forward':
                if (key.exten == data.exten && key.type == data.type && key.number == data.number) {
                    logger.info(`Найден ID ${key.id}`);
                    id = key.id;
                } else {
                    logger.info(`По запросу ничего не найдено ${param}`);
                }
                break;
            case 'mail':
                if (key.from == data.from && key.to == data.to && key.dateFrom == data.dateFrom && key.dateTo == data.dateTo) {
                    logger.info(`Найден ID ${key.id}`);
                    id = key.id;
                } else {
                    logger.info(`По запросу ничего не найдено ${param}`);
                }
                break;
        }
    }
    return id;
}

async function startModifyMailOrForward(res, type, url, {...data }) {
    try {
        let today = moment().format('DD.MM.YYYY');
        switch (data.status) {
            case 'true':
                if (data.dateFrom == today) {
                    const resultSendModifyStatus = await axios.sendAxios(url);
                    if (resultSendModifyStatus == 200) {
                        await db.insertInfoToDB(type, data);
                        res.status(200).end();
                    } else {
                        res.status(503).end();
                    }
                } else {
                    await db.insertInfoToDB(type, data);
                    res.status(200).end();
                }
                break;
            case 'false':
                const resultSendModifyStatus = await axios.sendAxios(url);
                if (resultSendModifyStatus == 200) {
                    const resultSearch = await getId(type, data);
                    if (resultSearch != undefined) {
                        const resultDelete = await db.deleteRule(type, resultSearch);
                        logger.info(`Получен результат удаления ${resultDelete}`);
                        res.status(200).end();
                    } else {
                        res.status(503).json({ type: `Отсутствуют такие данные в БД ${data}` });
                    }
                } else {
                    res.status(503).end();
                }
                break;
            default:
                await db.insertInfoToDB(type, data);
                res.status(200).end();
                break;
        }
    } catch (e) {
        logger.error(`Проблемы с изменение статуса startModifyMailOrForward ${util.inspect(e)}`);
        res.status(503).end();
    }

}

app.use((req, res, next) => {
    logger.info(req.url);
    next();
});

app.post('/queue*', async(req, res) => {
    try {
        const resultSendModifyStatus = await axios.sendAxios(req.url);
        if (resultSendModifyStatus == 200) {
            logger.info(`Статус изменения очереди ${resultSendModifyStatus}`);
            res.status(200).end();
        } else {
            logger.error(`Проблемы с изменение статуса очереди ${resultSendModifyStatus}`);
            res.status(503).end();
        }
    } catch (e) {
        logger.error(`Проблемы с изменение статуса очереди ${util.inspect(e)}`);
        res.status(503).end();
    }
});

//http://172.16.0.253:4545/mail?from=vp@mail.ru&to=it@mail.ru&dateFrom=22.03.2021&dateTo=23.03.2021&status=true
app.post('/mail*', async(req, res) => {
    try {
        const data = req.query;
        data.id = new Date().getTime() / 1000;
        logger.info(data);
        await startModifyMailOrForward(res, 'mail', req.url, data);
    } catch (e) {
        logger.error(`Проблемы с изменение статуса переадресации почты  ${util.inspect(e)}`);
        res.status(503).end();
    }



});


app.post('/forward*', async(req, res) => {
    try {
        const data = req.query;
        data.id = new Date().getTime() / 1000;
        logger.info(data);
        await startModifyMailOrForward(res, 'forward', req.url, data);
    } catch (e) {
        logger.error(`Проблемы с изменение статуса переадресации добавочного ${util.inspect(e)}`);
        res.status(503).end();
    }
});

app.listen(4545);