"use strict";
const log4js = require(`log4js`);

log4js.configure({
    appenders: {
        selenium: {
            type: `file`,
            filename: `logs/debug.log`,
            maxLogSize: 10485760,
            backups: 3,
            compress: true
        }
    },
    categories: {
        default: {
            appenders: [`selenium`],
            level: `debug`
        }
    }
});
const logger = log4js.getLogger(`selenium`);
module.exports = logger;