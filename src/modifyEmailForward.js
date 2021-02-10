"use strict";
const { Builder, By, Key, until } = require('selenium-webdriver'),
    config = require("../config/config");


module.exports.setEmailForward = async function setEmailForward(email, forwardEmail, checkStatus) {
    let userName = email.match(/(.+)@config.mail.domain/);
    try {
        let driver = await new Builder().forBrowser('chrome').build();
        await driver.get(config.mail.url);
        await driver.sleep(1000);
        await driver.findElement(By.id('username')).sendKeys(config.mail.username);
        await driver.findElement(By.id('password')).sendKeys(config.mail.password);
        console.log('Entering credentials...')
        await driver.findElement(By.id('Logon')).click();
        await driver.sleep(1000);


        await driver.findElement(By.id('AccountsLink')).click();
        await driver.sleep(1000);


        await driver.findElement(By.id('filter_button')).click();
        await driver.sleep(5000);

        await driver.switchTo().frame(driver.findElement(By.id("dialog:userlist_filter.wdm")));
        await driver.findElement(By.id('filterPattern')).clear();
        await driver.findElement(By.id('filterPattern')).sendKeys(userName[1]);
        await driver.findElement(By.id('ApplyButton')).click();
        await driver.sleep(1000);


        await driver.switchTo().defaultContent();
        let a = await driver.findElement(By.xpath(`//tr[@glc_form_waform_selectid='${userName[0]}']`));
        await driver.actions().doubleClick(a).perform();
        await driver.sleep(1000);


        await driver.switchTo().frame(driver.findElement(By.id("dialog:useredit_account.wdm")));
        await driver.findElement(By.id('MAForwarding')).click();
        await driver.sleep(1000);

        if (checkStatus) {
            await driver.findElement(By.xpath("//label[@for='EnableForwarding']")).click();
            await driver.findElement(By.xpath("//input[@name='Address']")).clear();
            await driver.findElement(By.xpath("//input[@name='Address']")).sendKeys(`${forwardEmail}`);
        } else {
            await driver.findElement(By.xpath("//input[@name='Address']")).clear();
            await driver.findElement(By.xpath("//label[@for='EnableForwarding']")).click();
        }

        await driver.findElement(By.id('SaveAndCloseButton')).click();
        await driver.sleep(5000);
        await driver.switchTo().defaultContent();
        await driver.findElement(By.id('SignOut')).click();
        await driver.sleep(5000);
        driver.quit();

    } catch (e) {
        console.log(e);
    }
};