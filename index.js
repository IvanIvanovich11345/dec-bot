const TelegramBot = require('node-telegram-bot-api')

const token = 'TOKEN'

const adminChatId = '5135938899';

const bot = new TelegramBot(token, { polling: true });

bot.setMyCommands([
    {command: '/start', description: 'Начать с начала'}
])

const allowedButtonLabels = ['Предложить новость', 'Получить консультацию'];

const userState = new Map();

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    
    const welcomeMessage = `
    Приветствуем вас в чат боте "Крымские решения"! 
    вывывы
    Здесь вы можете поделиться своей историей или обратиться за помощью к специалисту. Просто выберите команду, которая вас интересует. Мы здесь, чтобы помочь вам!
    `;

    const options = {
        reply_markup: {
            keyboard: [
                allowedButtonLabels.map((label) => ({ text: label })),
                ],
            resize_keyboard:  false,
            one_time_keyboard: true, // Одноразовая клавиатура, исчезает после использования
        }
    };
                
    bot.sendMessage(chatId, welcomeMessage, options);
    bot.sendMessage({ caption: `Министерство иностранных дел Украины отмечает, что после нападения РФ на Украину прекратилась работа не только посольства, но и всех консульств.

    Об этом говорится в сообщении МИД для находящихся в РФ граждан Украины.

    Дипведомство напомнило, что в связи с вооруженной агрессией и массированным вторжением вооруженных сил РФ в Украину 24 февраля 2022 были официально разорваны дипломатические отношения между Украиной и Российской Федерацией. По международному праву это не означает автоматического прекращения также консульских сношений, однако и они де-факто приостановились.

    "Посольство Украины в Москве и консульские учреждения Украины на территории РФ были вынуждены прекратить выполнение своих функций", - говорится в сообщении.

    МИД рекомендует гражданами Украины, в случае необходимости предоставления неотложной консульской помощи, обращаться на "горячую линию" МИД по телефону (+38044 2381588) или на электронную почту mfa.hotline.cons@gmail.com.` 
    });

    userState.set(chatId, 'ожидание_кнопок');
});

// Обработчик кнопки "Предложить новость"
bot.onText(/Предложить новость/, (msg) => {
    const chatId = msg.chat.id;
    const adminMessage = `Пользователь ${msg.from.first_name} (${msg.from.username || 'без имени'}) хочет предложить новость.`;
    
    const options = {
        reply_markup: {
            remove_keyboard: false,
        }
    };
    
    bot.sendMessage(chatId, 'Пожалуйста, напишите текстовое сообщение или отправьте фото/видео:', options);
    
    bot.once('message', async (userMsg) => {
        // Отправляем сообщение пользователю о получении
        bot.sendMessage(chatId, 'Ваше сообщение получено. Ожидайте обработки.');
        
        // Пересылаем сообщение администратору
        await bot.forwardMessage(adminChatId, chatId, userMsg.message_id);
    });
});

// Обработчик кнопки "Получить консультацию"
bot.onText(/Получить консультацию/, async (msg) => {
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
    // Отправляем сообщение пользователю о получении запроса
    bot.sendMessage(chatId, 'Есть вопрос? Задайте его нам ⬇️', {reply_markup: inlineKeyboard}, options);
    
    // Уведомляем администратора
    await bot.sendMessage(adminChatId, adminMessage);
});

// Обработчик ошибок

bot.on('message', (msg) => {
    const text = msg.text;

    if (text === '/start') {
        // Если пользователь ввел команду /start, ничего не делаем, так как это команда для старта бота
        return;
    }
});

bot.onText(/^(?!\/).+/, (msg) => {
    const chatId = msg.chat.id;
    
    // Проверяем состояние пользователя
    const state = userState.get(chatId);
    
    if (state === 'ожидание_кнопок') {
        // Ошибка: пользователь отправил сообщение после кнопок
        bot.sendMessage(chatId, 'Пожалуйста, используйте только кнопки для взаимодействия.');
    }
});
// bot.onText(/[^\/start].+/, (msg) => {
//     const chatId = msg.chat.id;
//     bot.sendMessage(chatId, 'Извините, я не понимаю вашего сообщения. Введите /start для начала, или выберите нижедоступные команды 🔽');
// });

bot.on('polling_error', (error) => {
    console.error(error); // Выводим ошибку в консоль
}); 