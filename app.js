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
    
    // Инициализация делегирования событий для навигации
    initializeEventDelegation();
});

// Инициализация делегирования событий
function initializeEventDelegation() {
    // Делегирование для главного меню
    dom.delegate('.menu-list', 'click', '.menu-item', function(e) {
        e.preventDefault();
        const menuTitle = this.querySelector('.menu-title');
        if (!menuTitle) return;
        
        const title = menuTitle.textContent;
        switch(title) {
            case 'Начать гонку':
                navigation.showRaceMenu();
                break;
            case 'Гараж':
                navigation.showGarageScreen();
                break;
            case 'Магазин':
                navigation.showShopScreen();
                break;
            case 'Задания':
                navigation.showDailyTasksScreen();
                break;
            case 'Рейтинг':
                navigation.showLeaderboardScreen();
                break;
            case 'Выход':
                auth.logout();
                break;
        }
    });
    
    // Делегирование для кнопок "Назад"
    dom.delegate('body', 'click', '.btn-back', function(e) {
        e.preventDefault();
        navigation.goBack();
    });
    
    // Делегирование для вкладок
    dom.delegate('body', 'click', '.tab-btn', function(e) {
        e.preventDefault();
        const parent = this.parentElement;
        if (parent.classList.contains('shop-tabs')) {
            const isFirstTab = this === parent.querySelector('.tab-btn:first-child');
            shop.showShopTab(isFirstTab ? 'buy' : 'sell');
        }
    });
    
    // Делегирование для вкладок гаража
    dom.delegate('.garage-tabs-minimal', 'click', '.tab-minimal', function(e) {
        e.preventDefault();
        const tabIcon = this.querySelector('.tab-icon');
        if (tabIcon) {
            const iconText = tabIcon.textContent;
            switch(iconText) {
                case '🔧':
                    garage.showGarageTab('upgrades');
                    break;
                case '📊':
                    garage.showGarageTab('stats');
                    break;
                case '⚡':
                    garage.showGarageTab('parts');
                    break;
            }
        }
    });
}

// Таймер для ежедневных заданий
function startDailyTasksTimer() {
    dailyTasks.updateDailyTasksTimer();
    setInterval(dailyTasks.updateDailyTasksTimer, 1000);
}

// Оптимизированное сохранение при закрытии/обновлении страницы
let isSaving = false;
window.addEventListener('beforeunload', async (e) => {
    if (gameState.currentUser && gameData && !isSaving) {
        isSaving = true;
        try {
            if (typeof window.saveGameData === 'function') {
                await window.saveGameData(gameData);
            }
        } catch (error) {
            console.error('Не удалось сохранить при закрытии:', error);
        } finally {
            isSaving = false;
        }
    }
});

// Периодическая синхронизация с дебаунсом
const syncGameData = dom.debounce(async () => {
    if (gameState.currentUser && navigator.onLine && !isSaving) {
        isSaving = true;
        try {
            if (typeof window.saveGameData === 'function') {
                await window.saveGameData(gameData);
            }
        } catch (error) {
            // Тихо обрабатываем ошибку
        } finally {
            isSaving = false;
        }
    }
}, 5000);

// Вызываем синхронизацию реже
setInterval(syncGameData, 60000); // Каждую минуту

// Экспортируем для использования в других модулях если нужно
export { gameState, gameData };