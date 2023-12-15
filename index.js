const TelegramBot = require('node-telegram-bot-api')

const token = '6340920226:AAGf5lQFLZg3__1_kDA12u3D76bVuiNKNFs'

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
    
Здесь вы можете поделиться новостью или получить консультацию  у специалиста. Просто выберите команду, которая вас интересует. Мы здесь, чтобы помочь вам!
    `;

    const options = {
        reply_markup: {
            keyboard: [
                allowedButtonLabels.map((label) => ({ text: label })),
                ],
            resize_keyboard:  false,
            one_time_keyboard: false, // Одноразовая клавиатура, исчезает после использования
        }
    };

    bot.sendMessage(chatId, welcomeMessage, options);

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
        // bot.sendMessage(chatId, 'Ваше сообщение получено. Ожидайте обработки.');
        
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

bot.on('polling_error', (error) => {
    console.error(error); // Выводим ошибку в консоль
}); 