// app.js
// Главный файл приложения

import { gameState, gameData, updateGameData } from './modules/game-data.js';
import * as navigation from './modules/navigation.js';
import * as auth from './modules/auth.js';
import * as garage from './modules/garage.js';
import * as race from './modules/race.js';
import * as shop from './modules/shop.js';
import * as profile from './modules/profile.js';
import * as upgrades from './modules/upgrades.js';
import { startAutoSave, showLoading } from './modules/utils.js';
import * as dailyTasks from './modules/daily-tasks.js';
import { dom } from './modules/dom-manager.js';
import * as achievements from './modules/achievements.js';
import * as chat from './modules/chat.js';
import * as events from './modules/events.js';
import { notifications } from './modules/notifications.js';

// =====================================
// БАЗОВАЯ ЗАЩИТА ОТ КОНСОЛЬНЫХ ЧИТОВ
// =====================================

// Защита от модификации gameData через консоль
(function() {
    'use strict';
    
    // Сохраняем ссылку на настоящий gameData
    let realGameData = null;
    
    // Функция для установки защищенного gameData
    function protectGameData(data) {
        realGameData = data;
        
        // Создаем прокси для перехвата обращений
        return new Proxy(data, {
            set: function(target, property, value) {
                // Разрешаем изменения только изнутри игры
                const stack = new Error().stack;
                const isFromGame = stack.includes('modules/') || 
                                 stack.includes('updateGameData') ||
                                 stack.includes('fetch');
                
                if (!isFromGame && typeof value === 'number' && 
                    ['money', 'level', 'experience'].includes(property)) {
                    console.warn('🚫 Попытка изменения игровых данных заблокирована!');
                    window.notify('🚫 Читерство обнаружено!', 'error');
                    return false;
                }
                
                target[property] = value;
                return true;
            },
            
            get: function(target, property) {
                // Если пытаются получить деньги из консоли - логируем
                if (property === 'money' && new Error().stack.includes('eval')) {
                    console.warn('🚫 Подозрительное обращение к деньгам игрока');
                }
                return target[property];
            }
        });
    }
    
    // Отключаем некоторые консольные функции
    const originalLog = console.log;
    console.log = function(...args) {
        // Проверяем на попытки читерства
        const message = args.join(' ');
        if (message.includes('gameData') || message.includes('money')) {
            originalLog('🚫 Консольные читы не работают в этой игре!');
            return;
        }
        originalLog.apply(console, args);
    };
    
    // Детекция открытых DevTools (базовый)
    let devtools = {
        open: false,
        orientation: null
    };
    
    setInterval(() => {
        if (window.outerHeight - window.innerHeight > 200 || 
            window.outerWidth - window.innerWidth > 200) {
            
            if (!devtools.open) {
                devtools.open = true;
                console.clear();
                console.log(`
                
    ⚠️  ВНИМАНИЕ! ⚠️
    
    Консоль разработчика обнаружена!
    
    Читерство в этой игре:
    ❌ Не работает
    ❌ Может привести к бану аккаунта
    ❌ Портит удовольствие от игры
    
    Играйте честно! 🎮
    
                `);
            }
        } else {
            devtools.open = false;
        }
    }, 1000);
    
    // Перехватываем глобальный доступ к gameData
    Object.defineProperty(window, 'gameData', {
        get: function() {
            return realGameData;
        },
        set: function(value) {
            if (realGameData && typeof value === 'object') {
                realGameData = protectGameData(value);
            } else {
                realGameData = value;
            }
        },
        configurable: false
    });
    
    // Экспортируем функцию защиты
    window.protectGameData = protectGameData;
    
})();

// =====================================
// ЗАЩИТА ОТ ИЗМЕНЕНИЯ WINDOW ОБЪЕКТОВ
// =====================================

// Защищаем основные игровые функции
const protectedFunctions = [
    'updatePlayerInfo',
    'buyCar',
    'upgradeComponent',
    'claimTaskReward',
    'startRace'
];

protectedFunctions.forEach(funcName => {
    const originalFunc = window[funcName];
    if (originalFunc) {
        Object.defineProperty(window, funcName, {
            value: originalFunc,
            writable: false,
            configurable: false
        });
    }
});

// =====================================
// МОНИТОРИНГ ПОДОЗРИТЕЛЬНОЙ АКТИВНОСТИ
// =====================================

// Счетчик подозрительных действий
let suspiciousActivity = 0;
const MAX_SUSPICIOUS = 3;

// Функция для отправки отчета о читерстве
function reportCheating(type, details) {
    suspiciousActivity++;
    
    console.warn(`🚨 Обнаружена подозрительная активность: ${type}`);
    
    if (suspiciousActivity >= MAX_SUSPICIOUS) {
        window.notify('🚨 Обнаружено читерство! Аккаунт может быть заблокирован.', 'error');
        
        // Отправляем отчет на сервер (если нужно)
        if (window.API_URL && localStorage.getItem('authToken')) {
            fetch(`${window.API_URL}/game/report-cheating`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    type: type,
                    details: details,
                    timestamp: Date.now(),
                    userAgent: navigator.userAgent
                })
            }).catch(() => {}); // Игнорируем ошибки
        }
    }
}

// Мониторинг консоли
const originalEval = window.eval;
window.eval = function(code) {
    if (typeof code === 'string' && 
        (code.includes('gameData') || code.includes('money') || code.includes('level'))) {
        reportCheating('console_eval', code.substring(0, 100));
        throw new Error('🚫 Выполнение кода заблокировано');
    }
    return originalEval(code);
};

console.log('🛡️ Система защиты от читерства активирована');

// Делаем функции доступными глобально для onclick в HTML

// Навигация
window.showMainMenu = navigation.showMainMenu;
window.showGarageScreen = navigation.showGarageScreen;
window.showRaceMenu = navigation.showRaceMenu;
window.showShopScreen = navigation.showShopScreen;
window.showProfileScreen = navigation.showProfileScreen;
window.showLeaderboardScreen = navigation.showLeaderboardScreen;
window.showDailyTasksScreen = navigation.showDailyTasksScreen; 
window.goBack = navigation.goBack;

// Авторизация
window.handleLogin = auth.handleLogin;
window.handleRegister = auth.handleRegister;
window.showLoginForm = auth.showLoginForm;
window.showRegisterForm = auth.showRegisterForm;
window.logout = auth.logout;

// Гараж
window.previousCar = garage.previousCar;
window.nextCar = garage.nextCar;
window.showGarageTab = garage.showGarageTab;
window.updateGarageDisplay = garage.updateGarageDisplay;

// Улучшения
window.upgradeComponent = upgrades.upgradeComponent;
window.buySpecialPart = upgrades.buySpecialPart;

// Гонки
window.showRacePreview = race.showRacePreview;
window.confirmRace = race.confirmRace;
window.closeRacePreview = race.closeRacePreview;
window.startRace = race.startRace;
window.displayOpponents = race.displayOpponents;

// Магазин
window.buyCar = shop.buyCar;
window.sellCar = shop.sellCar;
window.showShopTab = shop.showShopTab;
window.updateShopDisplay = shop.updateShopDisplay;

// Профиль
window.updateProfileDisplay = profile.updateProfileDisplay;
window.updateLeaderboard = profile.updateLeaderboard;

// Достижения
window.showAchievementsScreen = navigation.showAchievementsScreen;
window.updateAchievementsDisplay = achievements.updateAchievementsDisplay;
window.checkAllAchievements = achievements.checkAllAchievements;

// Чат и новости
window.showCommunityScreen = navigation.showCommunityScreen;
window.showCommunityTab = navigation.showCommunityTab;
// Чат и новости - функции
window.loadChatMessages = chat.loadChatMessages;
window.sendChatMessage = chat.sendChatMessage;
window.handleChatSubmit = chat.handleChatSubmit;
window.startChatUpdates = chat.startChatUpdates;
window.stopChatUpdates = chat.stopChatUpdates;
window.checkChatScroll = chat.checkChatScroll;
window.loadNews = chat.loadNews;
window.switchNewsCategory = chat.switchNewsCategory;

// Инициализация при загрузке
window.addEventListener('DOMContentLoaded', async function() {
    // Скрываем экран загрузки через секунду
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }, 1000);
    
    // Проверяем авторизацию
    const isAuthorized = await auth.checkAuth();
    
    if (isAuthorized) {
        auth.showGameFunc();
        startDailyTasksTimer();
    } else {
        navigation.showAuthScreen();
    }
});

// Таймер для ежедневных заданий
function startDailyTasksTimer() {
    dailyTasks.updateDailyTasksTimer();
    setInterval(dailyTasks.updateDailyTasksTimer, 1000);
}

// Сохранение при закрытии/обновлении страницы
window.addEventListener('beforeunload', async (e) => {
    if (gameState.currentUser && gameData) {
        try {
            if (typeof window.saveGameData === 'function') {
                await window.saveGameData(gameData);
            }
        } catch (error) {
            console.error('Не удалось сохранить при закрытии:', error);
        }
    }
});

// Периодическая синхронизация
setInterval(async () => {
    if (gameState.currentUser && navigator.onLine) {
        try {
            if (typeof window.saveGameData === 'function') {
                await window.saveGameData(gameData);
            }
        } catch (error) {
            // Тихо обрабатываем ошибку
        }
    }
}, 60000); // Каждую минуту
// Отключаем автосохранение при неактивности
let lastActivity = Date.now();

document.addEventListener('click', () => {
    lastActivity = Date.now();
});

document.addEventListener('keypress', () => {
    lastActivity = Date.now();
});
// Обработчик клика на логотип
document.addEventListener('DOMContentLoaded', function() {
    // Добавляем обработчик клика на секцию с логотипом
    const logoSection = document.querySelector('.header-logo-section');
    if (logoSection) {
        logoSection.addEventListener('click', function() {
            if (window.showMainMenu) {
                window.showMainMenu();
            }
        });
    }
});
// Модифицируем периодическое сохранение
setInterval(async () => {
    // Сохраняем только если была активность в последние 30 секунд
    if (gameState.currentUser && navigator.onLine && (Date.now() - lastActivity < 30000)) {
        try {
            if (typeof window.saveGameData === 'function') {
                await window.saveGameData(gameData);
            }
        } catch (error) {
            // Тихо обрабатываем ошибку
            console.log('Автосохранение пропущено');
        }
    }
}, 60000);

// Экспортируем для использования в других модулях если нужно
export { gameState, gameData };
window.showEventScreen = events.showEventScreen;
window.checkCurrentEvent = events.checkCurrentEvent;
window.startEventChecking = events.startEventChecking;