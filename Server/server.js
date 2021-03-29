/* eslint-disable no-unused-expressions */
"use strict"; // eslint-disable-line
const express = require("express"),
    app = express(),
    axios = require('axios'),
    util = require('util'),
    url = require('url'),
    moment = require('moment'),
    logger = require('./logger/logger'),
    low = require('lowdb'),
    FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('db.json')
const db = low(adapter)


db.defaults({ forward: [], mail: [], count: 0 })
    .write();

async function setInfoToDB(type, data) {
    logger.info(type, data);
    db.get(type)
        .push(data)
        .write();
}

// Удаление информации по переадресации из БД
async function deleteIDInDB(id) {
    try {
        logger.info(id);
        const resultDelete = await db.get('forward')
            .remove({ id })
            .write();
        return resultDelete;
    } catch (e) {
        logger.error(`Ошибка удаления из базы deleteIDInDB ${e}`);
    }
}

// Выгрузка из базы данных всех правил, по которым ранее была переадресация, статусы которых надо вернуть обратно
async function searchInDB(exten, type, number) {
    try {
        let id;
        const forward = await db.get('forward')
            .value();
        /* eslint-disable-next-line */
        for (const key of forward) {
            if (key.exten == exten && key.type == type && key.number == number) {
                logger.info(`Найден ID ${key.id}`);
                id = key.id;
            } else {
                logger.info(`По запросу ничего не найдено ${exten} ${type} ${number}`);
            }
        }
        return id;
    } catch (e) {
        logger.error(`Ошибка поиска в базе searchInDB ${e}`);
    }
}

async function sendModifyStatus(urlString) {
    try {
        const result = await axios.post(`http://172.16.0.2:3000${urlString}`);
        return result.status;
    } catch (e) {
        logger.error(`Ошибка изменения статуса sendModifyStatus ${e}`);
    }
}

app.use((req, res, next) => {
    logger.info(req.url);
    next();
});

app.post('/queue*', async(req, res) => {
    try {
        const result = await axios.post(`http://172.16.0.2:3000${req.url}`);
        if (result.status == 200) {
            logger.info(`Статус изменения очереди ${result}`);
            res.status(200).end();
        } else {
            logger.error(`Проблемы с изменение статуса очереди ${result}`);
            res.status(503).end();
        }
    } catch (e) {
        logger.error(`Проблемы с изменение статуса очереди ${util.inspect(e)}`);
        res.status(503).end();
    }
});

//http://172.16.0.253:4545/mail?from=vp@russteels.ru&to=it@russteels.ru&dateFrom=22.03.2021&dateTo=23.03.2021&status=true
app.post('/mail*', async(req, res) => {
    try {
        const queryData = parse(req.url, true).query;
        const today = moment().format('DD.MM.YYYY');
        const {
            from,
            to,
            dateFrom,
            dateTo,
            status,
        } = url.parse(req.url, true).query;

        const data = {
            id: new Date().getTime() / 1000,
            from: from,
            to: to,
            dateFrom: dateFrom,
            dateTo: dateTo,
            status: status,
        };


        if (status == 'true') {
            if (dateFrom == today) {
                const resultSendModifyStatus = await sendModifyStatus(req.url);
                if (resultSendModifyStatus == 200) {
                    await setInfoToDB('mail', data);
                    res.status(200).end();
                } else {
                    res.status(503).end();
                }
            } else {
                await setInfoToDB('mail', data);
                res.status(200).end();
            }

        } else if (status == 'false') {
            const resultSendModifyStatus = await sendModifyStatus(req.url);
            if (resultSendModifyStatus == 200) {
                const resultSearch = await searchInDB(exten, type, number);
                const resultDeleteInDB = await deleteIDInDB(resultSearch);
                logger.info(`Получен результат удаления ${resultDeleteInDB}`);
                res.status(200).end();
            } else {
                res.status(503).end();
            }
        } else {
            const resultPushDB = await setInfoToDB('mail', data);
            logger.info(`Результат занесения в БД ${util.inspect(resultPushDB)}`);
            res.status(200).end();
        }


    } catch (e) {
        logger.error(`Проблемы с изменение статуса переадресации ${util.inspect(e)}`);
    }



});


app.post('/forward*', async(req, res) => {
    try {
        const today = moment().format('DD.MM.YYYY');
        const {
            exten,
            type,
            number,
            dateFrom,
            dateTo,
            status,
        } = url.parse(req.url, true).query;

        const data = {
            id: new Date().getTime() / 1000,
            exten: exten,
            type: type,
            number: number,
            dateFrom: dateFrom,
            dateTo: dateTo,
            status: status,
        };

        if (status == 'true') {
            if (dateFrom == today) {
                const resultSendModifyStatus = await sendModifyStatus(req.url);
                if (resultSendModifyStatus == 200) {
                    await setInfoToDB('forward', data);
                    res.status(200).end();
                } else {
                    res.status(503).end();
                }
            } else {
                await setInfoToDB('forward', data);
                res.status(200).end();
            }

        } else if (status == 'false') {
            const resultSendModifyStatus = await sendModifyStatus(req.url);
            if (resultSendModifyStatus == 200) {
                const resultSearch = await searchInDB(exten, type, number);
                const resultDeleteInDB = await deleteIDInDB(resultSearch);
                logger.info(`Получен результат удаления ${resultDeleteInDB}`);
                res.status(200).end();
            } else {
                res.status(503).end();
            }
        } else {
            const resultPushDB = await setInfoToDB('forward', data);
            logger.info(`Результат занесения в БД ${util.inspect(resultPushDB)}`);
            res.status(200).end();
        }
    } catch (e) {
        logger.error(`Проблемы с изменение статуса переадресации ${util.inspect(e)}`);
    }
});

app.listen(4545);