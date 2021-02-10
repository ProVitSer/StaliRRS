"use strict";
const { Builder, By, Key, until } = require('selenium-webdriver'),
    config = require("../config/config");


module.exports.setForwardStatus = async function setForwardStatus(extension, currentForwardStatus) {
    try {
        let driver = await new Builder().forBrowser('chrome').build();
        await driver.get(`https://${config.PBX3cx.url}/#/login`);
        await driver.wait(until.elementLocated(By.className('btn btn-lg btn-primary btn-block ng-scope')), 10 * 10000);
        await driver.findElement(By.xpath("//input[@placeholder='User name or extension number']")).sendKeys(config.PBX3cx.username);
        await driver.findElement(By.xpath("//input[@placeholder='Password']")).sendKeys(config.PBX3cx.password);
        await driver.findElement(By.className('btn btn-lg btn-primary btn-block ng-scope')).click();
        await driver.get(`https://${config.PBX3cx.url}/#/app/extensions`);
        await driver.wait(until.elementLocated(By.className('btn btn-sm btn-success btn-responsive ng-scope')), 10 * 10000);
        await driver.findElement(By.xpath("//input[@id='inputSearch']")).sendKeys(extension);


        await driver.wait(until.elementLocated(By.xpath("//label[@tabindex='0']")), 10 * 10000);
        await driver.sleep(1000);
        await driver.findElement(By.xpath("//label[@tabindex='0']")).click();
        await driver.sleep(1000);
        await driver.findElement(By.id('btnStatus')).click();
        await driver.sleep(1000);
        await driver.findElement(By.xpath("//select[@ng-model='currentProfile']")).click();


        await driver.findElement(By.css(`option[value='${currentForwardStatus}']`)).click();
        await driver.findElement(By.className('close')).click();
        await driver.sleep(5000);


        await driver.findElement(By.xpath("//li[@is-open='user.isopen']")).click();
        await driver.findElement(By.xpath("//li[@ng-controller='LogoutCtrl']")).click();
        await driver.sleep(5000);
        driver.quit();
        return 'ok';
    } catch (e) {
        console.log(e);
    }
};