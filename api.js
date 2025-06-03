// app.js
// Главный файл приложения без экрана загрузки

import { gameState, gameData, updateGameData } from './modules/game-data.js';
import * as navigation from './modules/navigation.js';
import * as auth from './modules/auth.js';
import * as garage from './modules/garage.js';
import * as race from './modules/race.js';
import * as shop from './modules/shop.js';
import * as profile from './modules/profile.js';
import * as upgrades from './modules/upgrades.js';
import { startAutoSave } from './modules/utils.js';
import * as dailyTasks from './modules/daily-tasks.js';
import { dom } from './modules/dom-manager.js';

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

// Инициализация при загрузке (без экрана загрузки)
window.addEventListener('DOMContentLoaded', async function() {
    console.log('🏁 Street Racing - Запуск игры...');
    
    // Сразу проверяем авторизацию без задержек
    const isAuthorized = await auth.checkAuth();
    
    if (isAuthorized) {
        console.log('✅ Пользователь авторизован, показываем игру');
        auth.showGameFunc();
        startDailyTasksTimer();
    } else {
        console.log('❌ Пользователь не авторизован, показываем авторизацию');
        navigation.showAuthScreen();
    }
    
    console.log('🎮 Игра готова к использованию');
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
                console.log('💾 Данные сохранены при закрытии');
            }
        } catch (error) {
            console.error('❌ Не удалось сохранить при закрытии:', error);
        }
    }
});

// Периодическая синхронизация
setInterval(async () => {
    if (gameState.currentUser && navigator.onLine) {
        try {
            if (typeof window.saveGameData === 'function') {
                await window.saveGameData(gameData);
                console.log('🔄 Автосинхронизация выполнена');
            }
        } catch (error) {
            // Тихо обрабатываем ошибку
            console.warn('⚠️ Ошибка автосинхронизации:', error.message);
        }
    }
}, 60000); // Каждую минуту

// Экспортируем для использования в других модулях если нужно
export { gameState, gameData };