"use strict";
const { Builder, By, Key, until } = require('selenium-webdriver'),
    config = require("../config/config");


async function setInternalForwarding(driver, forwardRule, typeCall) {
    try {
        /*
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

        typeCall
        switch (forwardRule) {
            case 'mobile':
                await driver.findElement(By.xpath(`//fwd-type-control[@fwd='profile.${typeCall}._value']/select-enum-control[@prop='fwd.ForwardType']/div[@ng-hide='prop.hide']/select[@ng-model='prop.value']/option[@label='Forward to Mobile']`)).click();
                await driver.sleep(1000);
                break;
            case 'exten':
                await driver.findElement(By.xpath(`//fwd-type-control[@fwd='profile.${typeCall}._value']/select-enum-control[@prop='fwd.ForwardType']/div[@ng-hide='prop.hide']/select[@ng-model='prop.value']/option[@label='Forward to Extension']`)).click();
                await driver.sleep(1000);
                let a = "TypeOfExtensionForward.DN";
                await driver.findElement(By.xpath(`//fwd-type-control[@fwd='profile.${typeCall}._value']/div[@ng-if="fwd.ForwardType.selected=='TypeOfExtensionForward.DN'"]/select-control[@prop='fwd.ForwardDN']`)).click();
                await driver.findElement(By.xpath(`//fwd-type-control[@fwd='profile.${typeCall}._value']/div[@ng-if="fwd.ForwardType.selected=='TypeOfExtensionForward.DN'"]/select-control[@prop='fwd.ForwardDN']/div[@ng-hide="prop.hide"]/div[@ng-if="prop.lazy"]/div[@ng-model="prop.value"]/input[@type="search"]`)).sendKeys('101');
                await driver.sleep(10000);

                let checkSearchExtension = await driver.findElement(By.xpath("//span[@ng-bind-html='label(item)']")).then(function(elem) {
                    elem.click();
                    return true;
                }, function(err) {
                    //logger error не найден добавочный номера
                    return false;
                });
                break;
            case 'number':
                await driver.findElement(By.xpath(`//fwd-type-control[@fwd='profile.${typeCall}._value']/select-enum-control[@prop='fwd.ForwardType']/div[@ng-hide='prop.hide']/select[@ng-model='prop.value']/option[@label='Forward to number']`)).click();
                await driver.sleep(1000);
                break;
        }
        return;

    } catch (e) {
        return e;
    }
};

async function setExternalForwarding(driver, forwardRule) {
    try {
        //If I am away forward external calls to:
        //Выбираем какая переадресация нам требуется 
        /*
        Forward to Voicemail
        Forward to extension's Voicemail
        Forward to Mobile
        Forward to Extension
        Forward to number
        End Call		
        */
        switch (forwardRule) {
            case 'mobile':
                await driver.findElement(By.xpath("//fwd-type-control[@fwd='profile.ExternalForwarding._value']/select-enum-control[@prop='fwd.ForwardType']/div[@ng-hide='prop.hide']/select[@ng-model='prop.value']/option[@label='Forward to Mobile']")).click();
                await driver.sleep(1000);
                break;
            case 'exten':
                await driver.findElement(By.xpath("//fwd-type-control[@fwd='profile.ExternalForwarding._value']/select-enum-control[@prop='fwd.ForwardType']/div[@ng-hide='prop.hide']/select[@ng-model='prop.value']/option[@label='Forward to Extension']")).click();
                await driver.sleep(1000);
                let a = "TypeOfExtensionForward.DN";
                await driver.findElement(By.xpath(`//fwd-type-control[@fwd='profile.ExternalForwarding._value']/div[@ng-if="fwd.ForwardType.selected=='TypeOfExtensionForward.DN'"]/select-control[@prop='fwd.ForwardDN']`)).click();
                await driver.findElement(By.xpath(`//fwd-type-control[@fwd='profile.ExternalForwarding._value']/div[@ng-if="fwd.ForwardType.selected=='TypeOfExtensionForward.DN'"]/select-control[@prop='fwd.ForwardDN']/div[@ng-hide="prop.hide"]/div[@ng-if="prop.lazy"]/div[@ng-model="prop.value"]/input[@type="search"]`)).sendKeys('101');
                await driver.sleep(10000);

                let checkSearchExtension = await driver.findElement(By.xpath("//span[@ng-bind-html='label(item)']")).then(function(elem) {
                    elem.click();
                    return true;
                }, function(err) {
                    //logger error не найден добавочный номера
                    return false;
                });
                break;
            case 'number':
                await driver.findElement(By.xpath("//fwd-type-control[@fwd='profile.ExternalForwarding._value']/select-enum-control[@prop='fwd.ForwardType']/div[@ng-hide='prop.hide']/select[@ng-model='prop.value']/option[@label='Forward to number']")).click();
                await driver.sleep(1000);
                break;
        }
        return;

    } catch (e) {
        console.log(e);
    }
}



async function setQueueStatus(extension, forwardStatus, forwardRule) {
    try {
        let extensionStatus;
        let driver = await new Builder().forBrowser('chrome').build();
        await driver.get(`https://${config.PBX3cx.url}/#/login`);
        await driver.wait(until.elementLocated(By.className('btn btn-lg btn-primary btn-block ng-scope')), 10 * 10000);
        await driver.findElement(By.xpath("//input[@placeholder='User name or extension number']")).sendKeys(config.PBX3cx.username);
        await driver.findElement(By.xpath("//input[@placeholder='Password']")).sendKeys(config.PBX3cx.password);
        await driver.findElement(By.className('btn btn-lg btn-primary btn-block ng-scope')).click();
        await driver.get(`https://${config.PBX3cx.url}/#/app/extensions`);
        await driver.wait(until.elementLocated(By.className('btn btn-sm btn-success btn-responsive ng-scope')), 10 * 10000);

        //Поиск определенного добавочного номера, и переход в него
        await driver.findElement(By.xpath("//input[@id='inputSearch']")).sendKeys(extension);
        await driver.wait(until.elementLocated(By.xpath("//label[@tabindex='0']")), 10 * 10000);
        await driver.sleep(1000);
        await driver.findElement(By.xpath("//tr[@tabindex='0']")).click();
        await driver.sleep(5000);

        //Выбираем по какому статусу нам нужно добавить данные по переадресации
        /*
        Available
        Away
        Out of office
        Custom 1
        Custom 2	
        */
        await driver.findElement(By.xpath("//a[@ui-sref='.forwarding_rules']")).click();
        await driver.sleep(1000);
        await driver.findElement(By.xpath("//select[@name='status']")).click();
        await driver.sleep(1000);
        await driver.findElement(By.css("option[value='Away']")).click();
        await driver.sleep(2000);



        await setInternalForwarding(driver, forwardRule, 'InternalForwarding');
        await setExternalForwarding(driver, forwardRule, 'ExternalForwarding');





        await driver.sleep(5000);
        await driver.findElement(By.id('btnSave')).click();
        await driver.sleep(5000);
        //driver.quit();






        /*
		await driver.wait(until.elementLocated(By.xpath("//label[@tabindex='0']")), 10 * 10000);
		await driver.sleep(1000);
        await driver.findElement(By.xpath("//label[@tabindex='0']")).click();
		await driver.sleep(1000);
		await driver.findElement(By.id('btnStatus')).click();
		await driver.sleep(1000);
		await driver.findElement(By.xpath("//select[@ng-model='currentProfile']")).click();
		forwardStatus ? extensionStatus = 'Available' : extensionStatus = 'Away';
		await driver.findElement(By.css(`option[value=${extensionStatus}]`)).click();
		await driver.findElement(By.className('close')).click();
		await driver.sleep(5000);
		
		
		
		await driver.findElement(By.xpath("//li[@is-open='user.isopen']")).click();
		await driver.findElement(By.xpath("//li[@ng-controller='LogoutCtrl']")).click();
		await driver.sleep(5000);
		driver.quit();
		
		let a = await driver.findElement(By.css("option[label='Forward to Mobile']")).getAttribute("innerHTML").then(function(elem){
			console.log(elem);
		})
		*/
    } catch (e) {
        console.log(e);
    }
};




setQueueStatus('623', true, 'mobile');