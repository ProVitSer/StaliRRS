/* eslint-disable no-unused-expressions */
"use strict"; // eslint-disable-line
const axios = require('axios'),
    low = require('lowdb'),
    FileSync = require('lowdb/adapters/FileSync'),
    moment = require('moment'),
    logger = require('./logger/logger');

const adapter = new FileSync('db.json');
const db = low(adapter);

const today = moment().format('DD.MM.YYYY');
const filterModifyList = [];

// Завершение работы скрипта в случае некорректной загрузки или ответа сервера
const extiProcess = () => {
    setTimeout((() => process.exit(1)), 10000);
};

// Выгрузка из базы данных всех правил, по которым ранее была переадресация, статусы которых надо вернуть обратно
async function searchInDB() {
    try {
        const forward = await db.get('forward')
            .value();
        /* eslint-disable-next-line */
        for (const key of forward) {
            if (key.dateFrom == today) {
                filterModifyList.push(key);
            }
        }
        return filterModifyList;
    } catch (e) {
        logger.error(`Ошибка поиска в базе searchInDB ${e}`);
        extiProcess();
    }
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
        extiProcess();
    }
}

// Отправка в Windows скрипт информацию по какому добавочного нужно выставить статус переадресация
async function sendModifyStatus(modifyList) {
    try {
        /* eslint-disable no-await-in-loop */
        /* eslint-disable-next-line */
        for (const key of modifyList) {
            const result = await axios.post(`http://172.16.0.2:3000/forward?exten=${key.exten}&type=${key.type}&number=${key.number}&dateFrom=${key.dateFrom}&dateTo=${key.dateTo}&status=true`);
            logger.info(`Результат изменений ${result}`);
        }
        return '';
    } catch (e) {
        logger.error(`Ошибка отключения статусов переадресации sendModifyStatus ${e}`);
        extiProcess();
    }
}

// Запуск процессов изменения
async function todayModifyStatus() {
    try {
        const resultSearchInDB = await searchInDB();
        if (resultSearchInDB.length != 0) {
            logger.info(`Список правил попавшие под фильтер, которые надо изменить ${resultSearchInDB}`);
            const resultSendModifyStatus = await sendModifyStatus(resultSearchInDB);
            logger.info(`Результат изменений ${resultSendModifyStatus}`);
            extiProcess();
        } else {
            extiProcess();
        }
    } catch (e) {
        logger.error(`Ошибка обработки todayModifyStatus ${e}`);
        extiProcess();
    }
}
todayModifyStatus();