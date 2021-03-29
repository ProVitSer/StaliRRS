const { Builder, By, until } = require('selenium-webdriver'),
    config = require("./config/config"),
    logger = require('./logger/logger');

module.exports.setForwardStatus = async function setForwardStatus(extension, currentForwardStatus) {
    const driver = await new Builder().forBrowser('chrome').build();
    try {
        // Авторизация на АТС
        await driver.get(`https://${config.PBX3cx.url}/#/login`);
        await driver.wait(until.elementLocated(By.className('btn btn-lg btn-primary btn-block ng-scope')), 10 * 10000);
        await driver.findElement(By.xpath("//input[@placeholder='User name or extension number']")).sendKeys(config.PBX3cx.username);
        await driver.findElement(By.xpath("//input[@placeholder='Password']")).sendKeys(config.PBX3cx.password);
        await driver.findElement(By.className('btn btn-lg btn-primary btn-block ng-scope')).click();

        // Переход в раздел с добавочными номерами
        await driver.get(`https://${PBX3cx.url}/#/app/extensions`);
        await driver.wait(until.elementLocated(By.className('btn btn-sm btn-success btn-responsive ng-scope')), 10 * 10000);

        // Поиск добавочного номера
        await driver.findElement(By.xpath("//input[@id='inputSearch']")).sendKeys(extension);
        await driver.wait(until.elementLocated(By.xpath("//label[@tabindex='0']")), 10 * 10000);
        await driver.sleep(1000);
        await driver.findElement(By.xpath(`//*[contains(text(), ' ${extension} ')]//parent::tr[@tabindex='0']/td[@mc-select-row="item"]`)).click();
        await driver.sleep(1000);
        await driver.findElement(By.id('btnStatus')).click();
        await driver.sleep(1000);
        await driver.findElement(By.xpath("//select[@ng-model='currentProfile']")).click();

        // Выбор переданного статуса
        await driver.findElement(By.css(`option[value='${currentForwardStatus}']`)).click();
        await driver.findElement(By.className('close')).click();
        await driver.sleep(5000);

        // Выход с веб АТС
        await driver.findElement(By.xpath("//li[@is-open='user.isopen']")).click();
        await driver.findElement(By.xpath("//li[@ng-controller='LogoutCtrl']")).click();
        await driver.sleep(5000);
        driver.quit();
        return 'ok';
    } catch (e) {
        logger.error(`Ошибка изменения статусапереадресации ${e}`);
        driver.quit();
        return e;
    }
};