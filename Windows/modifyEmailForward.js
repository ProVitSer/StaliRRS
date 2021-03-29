const { Builder, By } = require('selenium-webdriver'),
    config = require("./config/config"),
    logger = require('./logger/logger');

// Выход из админской учетки и завершение работы
async function quiteFromMailWeb(driver) {
    await driver.sleep(5000);
    await driver.switchTo().defaultContent();
    await driver.findElement(By.id('SignOut')).click();
    await driver.sleep(5000);
    driver.quit();
    return 'ok';
}

// Кнопка отмены в меню переадресации почты
async function сancelButton(driver) {
    await driver.findElement(By.id('CancelButton')).click();
    quiteFromMailWeb(driver);
}

// Сохранить изменения в меню переадресации почты
async function saveChanges(driver) {
    await driver.findElement(By.id('SaveAndCloseButton')).click();
    quiteFromMailWeb(driver);
}

async function setEmailForward(email, forwardEmail, checkStatus) {
    const userName = email.match(/(.+)@(.+)/);
    try {
        const driver = await new Builder().forBrowser('chrome').build();
        await driver.get(config.mail.url);
        await driver.sleep(1000);
        await driver.findElement(By.id('username')).sendKeys(config.mailusername);
        await driver.findElement(By.id('password')).sendKeys(config.mailpassword);
        await driver.findElement(By.id('Logon')).click();
        await driver.sleep(1000);

        //Раскрываем полностью окно браузера
        driver.manage().window().maximize();


        // Переходво во вкладку Администрирования почты
        await driver.findElement(By.xpath(`//div[@onclick="RA.views.load('V_USERLIST', 'MainWindow=1');"]`)).click();
        await driver.sleep(1000);

        // Нажатие кнопки фильтрации для поиска
        await driver.findElement(By.id('filter_button')).click();
        await driver.sleep(5000);

        // Проваливаемся в открывшееся диалоговое окно. Очищаем бокс поиска и заполянем именем пользователя, который которго требуется найти
        await driver.switchTo().frame(driver.findElement(By.id('dialog:userlist_filter.wdm')));
        await driver.findElement(By.id('filterPattern')).clear();
        await driver.findElement(By.id('filterPattern')).sendKeys(userName[1]);
        await driver.findElement(By.id('ApplyButton')).click();
        await driver.sleep(1000);

        // Возвращаемся в основное окно
        await driver.switchTo().defaultContent();

        // Поиск пользователя по полному совпадению пользователь@домен, двойное нажатие
        const item = await driver.findElement(By.xpath(`//tr[@glc_form_waform_selectid='${userName[0]}']`));
        await driver.actions().doubleClick(item).perform();
        await driver.sleep(1000);

        // Проваливаемся в открывшееся диалоговое окно,переход в раздел переадресации
        await driver.switchTo().frame(driver.findElement(By.id('dialog:useredit_account.wdm')));
        await driver.findElement(By.id('MAForwarding')).click();
        await driver.sleep(1000);

        try {
            // Проверка включена переадресация или нет
            // <input type="checkbox" name="EnableForwarding" id="EnableForwarding" onclick="Enable();RA.setIsDirty()" checked="true">
            await driver.findElement(By.xpath("//label[@for='EnableForwarding']/input[@checked='true']"));
            if (checkStatus) {
                // Ранее уже была установлена переадресация
                console.log('Переадресация уже включена');
                сancelButton(driver);
            } else {
                // Убираем ранее включенную переадресацию
                await driver.findElement(By.xpath("//input[@name='Address']")).clear();
                await driver.findElement(By.xpath("//label[@for='EnableForwarding']")).click();
                saveChanges(driver);
            }
        } catch (e) {
            if (checkStatus) {
                // Переадресация не была включена, включаем и заполняем данными на кого требуется сделать переадресацию
                await driver.findElement(By.xpath("//label[@for='EnableForwarding']")).click();
                await driver.findElement(By.xpath("//input[@name='Address']")).clear();
                await driver.findElement(By.xpath("//input[@name='Address']")).sendKeys(`${forwardEmail}`);
                saveChanges(driver);
            } else {
                // Ранее переадресация уже была выключена
                logger.info('Переадресация уже выключена');
                сancelButton(driver);
            }
        }
    } catch (e) {
        logger.error(`Проблемы с изменением переадресации почты ${e}`);
        return e;
    }
}

module.exports.modifyForwardRules = setEmailForward;