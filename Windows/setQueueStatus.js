const { Builder, By, until } = require('selenium-webdriver'),
    config = require("./config/config"),
    logger = require('./logger/logger');

module.exports.setQueueStatus = async function setQueueStatus(extension, loginStatus) {
    const driver = await new Builder().forBrowser('chrome').build();
    try {
        let queueStatus;
        // Авторизация на АТС

        await driver.get(`https://${config.PBX3cx.url}/#/login`);
        await driver.wait(until.elementLocated(By.className('btn btn-lg btn-primary btn-block ng-scope')), 10 * 10000);
        await driver.findElement(By.xpath("//input[@placeholder='User name or extension number']")).sendKeys(config.PBX3cx.username);
        await driver.findElement(By.xpath("//input[@placeholder='Password']")).sendKeys(config.PBX3cx.password);
        await driver.findElement(By.className('btn btn-lg btn-primary btn-block ng-scope')).click();

        // Переход в раздел с добавочными номерами
        await driver.get(`https://${config.PBX3cx.url}/#/app/extensions`);
        await driver.wait(until.elementLocated(By.className('btn btn-sm btn-success btn-responsive ng-scope')), 10 * 10000);

        // Поиск добавочного номера
        await driver.findElement(By.xpath("//input[@id='inputSearch']")).sendKeys(extension);
        await driver.wait(until.elementLocated(By.xpath("//label[@tabindex='0']")), 10 * 10000);
        await driver.sleep(1000);
        await driver.findElement(By.xpath(`//*[contains(text(), ' ${extension} ')]/preceding-sibling::td/label[@tabindex='0']`)).click();
        await driver.sleep(1000);

        // Нажатие кнопки Статус по найденому добавочному номеру
        await driver.findElement(By.id('btnStatus')).click();
        await driver.sleep(1000);

        // Проверка статуса Подключен или Отключен от очереди, выбор противоположного
        /*
        Available - доступен
        Away - недоступен
        Out of office - DND
        Custom 1 - Lunch
        Custom 2 - Business Trip
        */
        await driver.findElement(By.xpath("//select[@ng-model='queueStatus']")).click();
        loginStatus == 'true' ? queueStatus = 1 : queueStatus = 0;
        await driver.findElement(By.css(`option[value='${queueStatus}']`)).click();
        await driver.findElement(By.className('close')).click();
        await driver.sleep(5000);

        // Выход с веб АТС
        await driver.findElement(By.xpath("//li[@is-open='user.isopen']")).click();
        await driver.findElement(By.xpath("//li[@ng-controller='LogoutCtrl']")).click();
        await driver.sleep(5000);
        driver.quit();
        return 'ok';
    } catch (e) {
        logger.error(`Проблемы с изменением стаатуса агента ${e}`);
        driver.quit();
        return e;
    }
};