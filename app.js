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

// Экспортируем для использования в других модулях если нужно
export { gameState, gameData };