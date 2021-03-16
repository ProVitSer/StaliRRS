/* eslint-disable no-unused-expressions */
"use strict"; // eslint-disable-line
import express from 'express';
import { post } from 'axios';
import { inspect } from 'util';
import { url } from 'url';
import low from 'lowdb';
import moment from 'moment';
import FileSync from 'lowdb/adapters/FileSync';
import { info, error } from '../logger/logger';

const app = express();

const adapter = new FileSync('db.json');
const db = low(adapter);

db.defaults({ forward: [], mail: [], count: 0 })
    .write();

async function setInfoToDB(type, data) {
    info(type, data);
    db.get(type)
        .push(data)
        .write();
}

// Удаление информации по переадресации из БД
async function deleteIDInDB(id) {
    try {
        info(id);
        const resultDelete = await db.get('forward')
            .remove({ id })
            .write();
        return resultDelete;
    } catch (e) {
        error(`Ошибка удаления из базы deleteIDInDB ${e}`);
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
                info(`Найден ID ${key.id}`);
                id = key.id;
            } else {
                info(`По запросу ничего не найдено ${exten} ${type} ${number}`);
            }
        }
        return id;
    } catch (e) {
        error(`Ошибка поиска в базе searchInDB ${e}`);
    }
}

async function sendModifyStatus(urlString) {
    try {
        const result = await post(`http://172.16.0.2:3000${urlString}`);
        return result.status;
    } catch (e) {
        error(`Ошибка изменения статуса sendModifyStatus ${e}`);
    }
}

app.use((req, res, next) => {
    info(req.url);
    next();
});

app.post('/queue*', async(req, res) => {
    try {
        const result = await post(`http://172.16.0.2:3000${req.url}`);
        if (result.status == 200) {
            info(`Статус изменения очереди ${result}`);
            res.status(200).end();
        } else {
            error(`Проблемы с изменение статуса очереди ${result}`);
            res.status(503).end();
        }
    } catch (e) {
        error(`Проблемы с изменение статуса очереди ${inspect(e)}`);
        res.status(503).end();
    }
});

/*
app.post('/mail*', (req, res) => {
    const queryData = parse(req.url, true).query;
});
*/

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

        if (dateFrom == today || status == 'true') {
            const resultSendModifyStatus = await sendModifyStatus(req.url);
            if (resultSendModifyStatus == 200) {
                await setInfoToDB('forward', data);
                res.status(200).end();
            } else {
                res.status(503).end();
            }
        } else if (status == 'false') {
            const resultSendModifyStatus = await sendModifyStatus(req.url);
            if (resultSendModifyStatus == 200) {
                const resultSearch = await searchInDB(exten, type, number);
                const resultDeleteInDB = await deleteIDInDB(resultSearch);
                info(`Получен результат удаления ${resultDeleteInDB}`);
                res.status(200).end();
            } else {
                res.status(503).end();
            }
        } else {
            const resultPushDB = await setInfoToDB('forward', data);
            info(`Результат занесения в БД ${inspect(resultPushDB)}`);
            res.status(200).end();
        }
    } catch (e) {
        error(`Проблемы с изменение статуса переадресации ${inspect(e)}`);
    }
});

app.listen(4545);