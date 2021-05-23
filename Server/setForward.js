/* eslint-disable no-unused-expressions */
"use strict"; // eslint-disable-line
const util = require('util'),
    db = require('./src/lowdb'),
    logger = require('./logger/logger'),
    Axios = require('./src/axios');

const axios = new Axios();

// Завершение работы скрипта в случае некорректной загрузки или ответа сервера
const extiProcess = () => {
    setTimeout((() => process.exit(1)), 10000);
};


// Отправка в Windows скрипт информацию по изменению переадресации по добавочному или переадресации почты
async function sendModifyStatus(type, modifyList) {
    try {
        /* eslint-disable no-await-in-loop */
        /* eslint-disable-next-line */
        for (const key of modifyList) {
            let resultSendModify;
            switch (type) {
                case 'forward':
                    resultSendModify = await axios.sendAxios(`/forward?exten=${key.exten}&type=${key.type}&number=${key.number}&dateFrom=${key.dateFrom}&dateTo=${key.dateTo}&status=${key.status}`);
                    logger.info(`/forward?exten=${key.exten}&type=${key.type}&number=${key.number}&dateFrom=${key.dateFrom}&dateTo=${key.dateTo}&status=${key.status}`);
                    break;
                case 'mail':
                    resultSendModify = await axios.sendAxios(`/mail?from=${key.from}&to=${key.to}&dateFrom=${key.dateFrom}&dateTo=${key.dateTo}&status=${key.status}`);
                    logger.info(`/mail?from=${key.from}&to=${key.to}&dateFrom=${key.dateFrom}&dateTo=${key.dateTo}&status=${key.status}`);
                    break;
                default:
                    logger.info("Нет таких значений");
            }
            if (key.status == 'false' && resultSendModify == 200) {
                const resultDelete = await db.deleteRule(type, key.id);
                logger.info(`Удалены данные ${util.inspect(resultDelete)}`);
            }
        }
        return '';
    } catch (e) {
        logger.error(`Ошибка отключения статусов переадресации sendModifyStatus ${e}`);
        extiProcess();
    }
}

// Запуск процессов изменения
async function init(type) {
    try {
        const resultSearchInDB = await db.getModifyInfo(type)
        if (resultSearchInDB.length != 0) {
            logger.info(`Список правил попавшие под фильтер, которые надо изменить ${util.inspect(resultSearchInDB)}`);
            await sendModifyStatus(type, resultSearchInDB);
        } else {
            logger.info(`Нет правил ${type} за сегодня которые надо изменить`);
        }
        return '';
    } catch (e) {
        logger.error(`Ошибка обработки init ${e}`);
    }
}


(async function() {
    try {
        logger.info(`Поехали`);
        await init('forward');
        await init('mail');
        extiProcess();
    } catch (e) {
        logger.error(`Ошибка обработки start init ${e}`);
        extiProcess();
    }
})();