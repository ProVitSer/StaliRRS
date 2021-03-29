const { Builder, By, until } = require('selenium-webdriver'),
    config = require("./config/config"),
    logger = require('./logger/logger');

async function setForwarding(driver, forwardRule, typeCall, number) {
    try {
        /*
        Правила переадресации вызова https://ip:5001/#/app/extension_editor/1/forwarding_rules

        If I am away forward Internal,External calls to:
        InternalForwarding
        ExternalForwarding

        Выбираем какая переадресация нам требуется:
        Forward to Voicemail
        Forward to extension's Voicemail
        Forward to Mobile
        Forward to Extension
        Forward to number
        End Call
        */

        switch (forwardRule) {
            case 'mobile': // переадресация на мобильный, не используется
                await driver.findElement(By.xpath(`//fwd-type-control[@fwd='profile.${typeCall}._value']/select-enum-control[@prop='fwd.ForwardType']/div[@ng-hide='prop.hide']/select[@ng-model='prop.value']/option[@label='Forward to Mobile']`)).click();
                await driver.sleep(1000);
                break;
            case 'extension': // переадресация на добавочный номер
                await driver.findElement(By.xpath(`//fwd-type-control[@fwd='profile.${typeCall}._value']/select-enum-control[@prop='fwd.ForwardType']/div[@ng-hide='prop.hide']/select[@ng-model='prop.value']/option[@label='Forward to Extension']`)).click();
                await driver.sleep(1000);
                await driver.findElement(By.xpath(`//fwd-type-control[@fwd='profile.${typeCall}._value']/div[@ng-if="fwd.ForwardType.selected=='TypeOfExtensionForward.DN'"]/select-control[@prop='fwd.ForwardDN']`)).click();
                await driver.findElement(By.xpath(`//fwd-type-control[@fwd='profile.${typeCall}._value']/div[@ng-if="fwd.ForwardType.selected=='TypeOfExtensionForward.DN'"]/select-control[@prop='fwd.ForwardDN']/div[@ng-hide="prop.hide"]/div[@ng-if="prop.lazy"]/div[@ng-model="prop.value"]/input[@type="search"]`)).sendKeys(number);
                await driver.sleep(10000);
                const checkSearchExtension = await driver.findElement(By.xpath("//span[@ng-bind-html='label(item)']")).then((elem) => {
                        elem.click();
                        return true;
                    }, (err) =>
                    // logger error не найден добавочный номера
                    false);
                break;
            case 'external': // переадресация на мобильный или внешний номер
                await driver.findElement(By.xpath(`//fwd-type-control[@fwd='profile.${typeCall}._value']/select-enum-control[@prop='fwd.ForwardType']/div[@ng-hide='prop.hide']/select[@ng-model='prop.value']/option[@label='Forward to number']`)).click();
                await driver.sleep(1000);
                await driver.findElement(By.xpath(`//fwd-type-control[@fwd='profile.${typeCall}._value']/div[@ng-if="fwd.ForwardType.selected=='TypeOfExtensionForward.ExternalNumber'"]/div/text-control/div[@ng-hide="prop.hide"]/input`)).clear();
                await driver.findElement(By.xpath(`//fwd-type-control[@fwd='profile.${typeCall}._value']/div[@ng-if="fwd.ForwardType.selected=='TypeOfExtensionForward.ExternalNumber'"]/div/text-control/div[@ng-hide="prop.hide"]/input`)).sendKeys(number);
                break;
        }
        return;
    } catch (e) {
        logger.error(`Проблема поиска иизменения статуса переадресации ${e}`);
        return e;
    }
}

async function searchExtension(driver, extension) {
    try {
        // Поиск определенного добавочного номера, и переход в него

        await driver.get(`https://${config.PBX3cx.url}/#/app/extensions`);
        await driver.wait(until.elementLocated(By.className('btn btn-sm btn-success btn-responsive ng-scope')), 10 * 10000);
        await driver.findElement(By.xpath("//input[@id='inputSearch']")).sendKeys(extension);
        await driver.wait(until.elementLocated(By.xpath("//label[@tabindex='0']")), 10 * 10000);
        await driver.sleep(1000);
        await driver.findElement(By.xpath(`//*[contains(text(), ' ${extension} ')]//parent::tr[@tabindex='0']`)).click();
        await driver.sleep(5000);
        return;
    } catch (e) {
        logger.error(`Проблема поиска добавочного номера ${e}`);
        return e;
    }
}

// Авторизация на АТС
async function authorizationOnPBX(driver) {
    try {
        await driver.get(`https://${config.PBX3cx.url}/#/login`);
        await driver.wait(until.elementLocated(By.className('btn btn-lg btn-primary btn-block ng-scope')), 10 * 10000);
        await driver.findElement(By.xpath("//input[@placeholder='User name or extension number']")).sendKeys(config.PBX3cx.username);
        await driver.findElement(By.xpath("//input[@placeholder='Password']")).sendKeys(config.PBX3cx.password);
        await driver.findElement(By.className('btn btn-lg btn-primary btn-block ng-scope')).click();
        return;
    } catch (e) {
        logger.error(`Ошибка авторизации ${e}`);
        return e;
    }
}

// Сохранение произведенных изменений
async function submitSetForwarding(driver) {
    try {
        await driver.sleep(5000);
        await driver.findElement(By.id('btnSave')).click();
        await driver.sleep(5000);
    } catch (e) {
        logger.error(`Проблема сохранения изменений ${e}`);
        return e;
    }
}

async function chooseForwardingStatus(driver, frowardStatus) {
    // Выбираем по какому статусу нам нужно добавить данные по переадресации
    /*
    Available - доступен
    Away - недоступен
    Out of office - DND
    Custom 1 - Lunch
    Custom 2 - Business Trip
    */
    try {
        await driver.findElement(By.xpath("//a[@ui-sref='.forwarding_rules']")).click();
        await driver.sleep(1000);
        await driver.findElement(By.xpath("//select[@name='status']")).click();
        await driver.sleep(1000);
        await driver.findElement(By.css(`option[value='${frowardStatus}']`)).click();
        await driver.sleep(2000);
        return;
    } catch (e) {
        logger.error(`Проблема выбора статуса переадресации ${e}`);
        return e;
    }
}

/*
exten=565&type=external&number=79104061420 - переадресация с добавочного 565 на внешний мобильный номер 79104061420
exten=565&type=extension&number=101 - переадресация с добавочного 565 на внутренний номер 101
*/

async function setExtenStatus(extension, forwardRule, number) {
    const driver = await new Builder().forBrowser('chrome').build();

    try {
        await authorizationOnPBX(driver);
        await searchExtension(driver, extension);
        await chooseForwardingStatus(driver, 'Custom 2');
        await setForwarding(driver, forwardRule, 'InternalForwarding', number);
        await setForwarding(driver, forwardRule, 'ExternalForwarding', number);
        await submitSetForwarding(driver);

        await driver.findElement(By.xpath("//li[@is-open='user.isopen']")).click();
        await driver.findElement(By.xpath("//li[@ng-controller='LogoutCtrl']")).click();
        await driver.sleep(5000);
        driver.quit();
        return 'ok';
    } catch (e) {
        logger.error(`Проблема изменения статуса переадресации по добавочному номеру ${e}`);
        return e;
    }
}

module.exports.modifyForwardRules = setExtenStatus;