/* eslint-disable no-unused-expressions */
"use strict"; // eslint-disable-line
import { post } from 'axios';
import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import moment from 'moment';
import { error, info } from '../logger/logger';

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
            if (key.dateTo == today) {
                filterModifyList.push(key);
            }
        }
        return filterModifyList;
    } catch (e) {
        error(`Ошибка поиска в базе searchInDB ${e}`);
        extiProcess();
    }
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
        extiProcess();
    }
}

// Отправка в Windows скрипт информацию по какому добавочного нужно выставить статус доступно и удалить данные из базы
async function sendModifyStatus(modifyList) {
    try {
        /* eslint-disable no-await-in-loop */
        /* eslint-disable-next-line */
        for (const key of modifyList) {
            if (key.dateFrom == today) {
                const result = await post(`http://172.16.0.2:3000/forward?exten=${key.exten}&type=${key.type}&number=${key.number}&dateFrom=${key.dateFrom}&dateTo=${key.dateTo}&status=true`);
                info(`Результат изменений ${result}`);
                const resultDelete = await deleteIDInDB(key.id);
                info(`Удалены данные ${resultDelete}`);
            }
        }
    } catch (e) {
        error(`Ошибка отключения статусов переадресации sendModifyStatus ${e}`);
        extiProcess();
    }
}

// Запуск процессов изменения
async function todayModifyStatus() {
    try {
        const resultSearchInDB = await searchInDB();
        info(`Список правил попавшие под фильтер, которые надо изменить ${resultSearchInDB}`);
        const resultSendModifyStatus = await sendModifyStatus(resultSearchInDB);
        info(`Результат изменений ${resultSendModifyStatus}`);
        extiProcess();
    } catch (e) {
        error(`Ошибка обработки todayModifyStatus ${e}`);
        extiProcess();
    }
}
todayModifyStatus();