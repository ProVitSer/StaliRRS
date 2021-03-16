/* eslint-disable no-unused-expressions */
"use strict"; // eslint-disable-line
import express from 'express';
import { post } from 'axios';
import { inspect } from 'util';
import { parse } from 'url';
import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import { info, error } from '../logger/logger';

const app = express();

const adapter = new FileSync('db.json');
const db = low(adapter);

app.use((req, res, next) => {
    info(req.url);
    next();
});

async function setInfoToDB(type, data) {
    info(type, data);
    db.get(type)
        .push(data)
        .write();
}

db.defaults({ forward: [], mail: [], count: 0 })
    .write();

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
        const queryData = parse(req.url, true).query;
        const data = {
            id: new Date().getTime() / 1000,
            exten: queryData.exten,
            type: queryData.type,
            number: queryData.number,
            dateFrom: queryData.dateFrom,
            dateTo: queryData.dateTo,
            status: true,
        };
        const result = await post(`http://172.16.0.2:3000${req.url}&status=true`);
        if (result.status == 200) {
            info(`Статус переадресации ${inspect(result)}`);
            const resultPushDB = await setInfoToDB('forward', data);
            info(`Результат занесения в БД ${inspect(resultPushDB)}`);
            res.status(200).end();
        } else {
            error(`Проблемы с изменение статуса переадресации ${result}`);
            res.status(503).end();
        }
    } catch (e) {
        error(`Проблемы с изменение статуса переадресации ${inspect(e)}`);
        res.status(503).end();
    }
});

app.listen(4545);