/* eslint-disable no-unused-expressions */
"use strict"; // eslint-disable-line
const axios = require('axios'),
    moment = require('moment'),
    logger = require('../logger/logger');


class Axios {
    constructor(ip = '172.16.0.2', port = '3000') {
        this.ip = ip;
        this.port = port;

    }

    async sendAxios(url) {
        try {
            const res = await axios.post(`https://${this.ip}:${this.port}/${url}`);
            const result = await res;
            logger.error(`Результат запроса ${result}`);

            if (!result) {
                return [];
            }
            return result.status;
        } catch (e) {
            logger.error(`Ошибка результата ${e}`);
        }
    }
}

module.exports = Axios;