/* eslint-disable no-unused-expressions */
"use strict"; // eslint-disable-line
const low = require('lowdb'),
    FileSync = require('lowdb/adapters/FileSync'),
    adapter = new FileSync('./db.json'),
    db = low(adapter),
    moment = require('moment'),
    logger = require('../logger/logger');

const today = moment().format('DD.MM.YYYY');

db.defaults({ forward: [], mail: [], count: 0 })
    .write();


const getModifyInfo = (type) => new Promise((resolve, reject) => {
    const filterModifyList = [];
    const getInfo = db.get(type)
        .value();
    if (!getInfo) {
        logger.info('[DB] Search in DB ', getInfo);
        resolve(getInfo)
    } else {
        for (const key of getInfo) {
            if (key.dateFrom == today) {
                filterModifyList.push(key);
            } else if (key.dateTo == today) {
                key.status = 'false';
                filterModifyList.push(key);
            }
        }
        resolve(filterModifyList);
    }
})


const getAllInfo = (type) => new Promise((resolve, reject) => {
    const getInfo = db.get(type)
        .value();
    if (!getInfo) {
        logger.error('[DB] GetAllInfo Error!', getInfo);
        reject('[DB] GetAllInfo Error!', getInfo)
    } else {
        resolve(getInfo)
    }
})


const deleteRule = (type, id) => new Promise((resolve, reject) => {
    const deleteRecords = db
        .get(type)
        .remove({ id })
        .write();
    if (!deleteRecords) {
        logger.error('[DB] Delete Error!', deleteRecords);
        reject('[DB] Delete Error!', deleteRecords);
    } else {
        logger.info('[DB] Удаление: ', id);
        resolve(deleteRecords)
    }
})

const insertInfoToDB = (type, data) => new Promise((resolve, reject) => {
    logger.info(`Добавляем в базу ${type}, ${data}`);
    const insertInDB = db.get(type)
        .push(data)
        .write();
    if (!insertInDB) {
        logger.error('[DB] Insert Error!', insertInDB);
        reject('[DB] Error!', insertInDB);
    } else {
        logger.info('[DB] Insert: ', insertInDB);
        resolve(insertInDB)
    }
})



module.exports = {
    getModifyInfo,
    deleteRule,
    insertInfoToDB,
    getAllInfo
}