const TelegramBot = require('node-telegram-bot-api')

const token = '6340920226:AAGf5lQFLZg3__1_kDA12u3D76bVuiNKNFs'

const adminChatId = '5135938899';

const bot = new TelegramBot(token, { polling: true });

bot.setMyCommands([
    {command: '/start', description: 'Начать с начала'}
])

const allowedButtonLabels = ['📬 Предложить новость', '💼 Получить консультацию', '📚 Образование'];

const userState = new Map();

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    
    const welcomeMessage = `
    Приветствуем вас в чат боте "Крымские решения"! 
    
Здесь вы можете поделиться новостью или получить консультацию  у специалиста. Просто выберите команду, которая вас интересует. Мы здесь, чтобы помочь вам!
    `;

    const keyboardButtons = allowedButtonLabels.map((label) => [{ text: label, callback_data: label }]);

    const options = {
        reply_markup: {
            keyboard: keyboardButtons,
            resize_keyboard: false,
            one_time_keyboard: false, // Одноразовая клавиатура, исчезает после использования
        }
    };

    bot.sendMessage(chatId, welcomeMessage, options);

    userState.set(chatId, 'ожидание_кнопок');
});

// Обработчик кнопки "Предложить новость"
bot.onText(/Предложить новость/, (msg) => {
    const path = require('path');
    const chatId = msg.chat.id;
    const adminMessage = `Пользователь ${msg.from.first_name} (${msg.from.username || 'без имени'}) хочет предложить новость.`;
    
    const options = {
        reply_markup: {
            remove_keyboard: false,
        }
    };
    
    const image = path.join(__dirname, 'images', 'send-message.jpg');
    const image2 = path.join(__dirname, 'images', 'message-sent.jpg');

    bot.sendPhoto(chatId, image, options);
    
    bot.once('message', async (userMsg) => {
        // Отправляем сообщение пользователю о получении
        bot.sendPhoto(chatId, image2);
        
        // Пересылаем сообщение администратору
        await bot.forwardMessage(adminChatId, chatId, userMsg.message_id);
    });
});

// Обработчик кнопки "Получить консультацию"
bot.onText(/Получить консультацию/, async (msg) => {
    const path = require('path');
    const chatId = msg.chat.id;
    const adminMessage = `Пользователь ${msg.from.first_name} https://t.me/${msg.from.username || 'без имени'} хочет получить консультацию.`;

    const inlineKeyboard = {
        inline_keyboard: [
            [
                { text: 'Задать вопрос', url: 'https://t.me/crimean_diskurs', callback_data: 'button1' },
            ]
        ],
    };

    const options = {
        reply_markup: {
            remove_keyboard: false,
        }
    };
    // Отправляем изображение вместо текстового сообщения
    const image = path.join(__dirname, 'images', 'consultation.jpg');
    bot.sendPhoto(chatId, image, {reply_markup: inlineKeyboard});

    // Уведомляем администратора
    await bot.sendMessage(adminChatId, adminMessage);
});

// Обработчик кнопки "Образование"


// Обработчик кнопки "Образование"
bot.onText(/Образование/, (msg) => {
    const fs = require('fs');
    const path = require('path');
    const chatId = msg.chat.id;

    // Путь к локальным изображениям
    const imagePath1 = path.join(__dirname, 'images', 'document-green.jpg');
    const imagePath2 = path.join(__dirname, 'images', 'document-red.jpg');
    const imagePath3 = path.join(__dirname, 'images', 'uni-list.jpg');

    // Путь к локальным файлам .pdf
    const pdfPath1 = path.join(__dirname, 'files', 'document-green.pdf');
    const pdfPath2 = path.join(__dirname, 'files', 'document-red.pdf');
    const pdfPath3 = path.join(__dirname, 'files', 'uni-list.pdf');

    // Отправляем фото и документы поочередно
    bot.sendPhoto(chatId, fs.createReadStream(imagePath1))
        .then(() => {
            return bot.sendDocument(chatId, fs.createReadStream(pdfPath1));
        })
        .then(() => {
            return bot.sendPhoto(chatId, fs.createReadStream(imagePath2));
        })
        .then(() => {
            return bot.sendDocument(chatId, fs.createReadStream(pdfPath2));
        })
        .then(() => {
            return bot.sendPhoto(chatId, fs.createReadStream(imagePath3));
        })
        .then(() => {
            return bot.sendDocument(chatId, fs.createReadStream(pdfPath3));
        })
        .catch((error) => {
            console.error('Error sending media:', error);
        });
});

// Обработчик ошибок

bot.on('message', (msg) => {
    const text = msg.text;

    if (text === '/start') {
        // Если пользователь ввел команду /start, ничего не делаем, так как это команда для старта бота
        return;
    }
});

// Обработчик ввода пользователя в режиме ожидания новости
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const state = userState.get(chatId);

    // Если пользователь находится в режиме ожидания новости
    if (state === 'ожидание_новости') {
        // Пересылаем сообщение администратору
        await bot.forwardMessage(adminChatId, chatId, msg.message_id);
        
        // Уведомляем пользователя о том, что его новость отправлена администратору
        bot.sendMessage(chatId, 'Ваша новость отправлена администратору. Ожидайте рассмотрения.');

        // Переключаем состояние пользователя обратно на ожидание кнопок
        userState.set(chatId, 'ожидание_кнопок');
    } else {
        // Если пользователь не находится в режиме ожидания новости, игнорируем его сообщение
        return;
    }
});

bot.on('message', (msg) => {
    const text = msg.text;

    // Если это команда /start, ничего не делаем
    if (text === '/start') {
        return;
    }

    // Если сообщение содержит текст, реагируем только на него
    const chatId = msg.chat.id;
    const state = userState.get(chatId);
    if (state === 'ожидание_кнопок') {
        // Проверяем, соответствует ли текст одной из кнопок меню
        if (allowedButtonLabels.includes(text)) {
            return; // Если соответствует, не отправляем сообщение о необходимости использовать только кнопки
        } else {
            bot.sendMessage(chatId, 'Пожалуйста, используйте только кнопки для взаимодействия.');
        }
    }
});

bot.on('polling_error', (error) => {
    console.error(error); // Выводим ошибку в консоль
}); 
