// modules/navigation.js
// Управление навигацией между экранами с новым UI

import { gameState } from './game-data.js';

// Очистка кеша DOM при переходах
export function clearDOMCache() {
    if (window.dom && window.dom.clearCache) {
        window.dom.clearCache();
    }
}

// Функция для отслеживания навигации
export function navigateToScreen(screenId) {
    if (gameState.currentScreen !== screenId) {
        gameState.navigationHistory.push(gameState.currentScreen);
        gameState.currentScreen = screenId;
    }
}

// Функция возврата на предыдущий экран
export function goBack() {
    if (gameState.navigationHistory.length > 0) {
        const previousScreen = gameState.navigationHistory.pop();
        gameState.currentScreen = previousScreen;
        navigateTo(previousScreen);
    } else {
        navigateTo('main-menu');
    }
}

// Функция скрытия всех экранов
export function hideAllScreens() {
    document.querySelectorAll('.mobile-screen').forEach(screen => {
        screen.classList.remove('active');
    });
}

// Базовая функция навигации
export function navigateTo(screenId) {
    hideAllScreens();
    clearDOMCache();
    
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
        navigateToScreen(screenId);
    }
    
    // Прокручиваем наверх при переходе между экранами
    const mainContainer = document.querySelector('.mobile-main');
    if (mainContainer) {
        mainContainer.scrollTop = 0;
    }
    
    // Обновляем данные экрана если нужно
    switch(screenId) {
        case 'garage-screen':
            if (window.updateGarageDisplay) {
                setTimeout(() => window.updateGarageDisplay(), 50);
            }
            break;
        case 'race-menu-screen':
            if (window.displayOpponents) {
                setTimeout(() => window.displayOpponents(), 50);
            }
            break;
        case 'shop-screen':
            if (window.updateShopDisplay) {
                setTimeout(() => window.updateShopDisplay(), 50);
            }
            break;
        case 'leaderboard-screen':
            if (window.updateLeaderboard) {
                setTimeout(() => window.updateLeaderboard(), 50);
            }
            break;
    }
}

// Функции навигации для конкретных экранов
export function showMainMenu(addToHistory = true) {
    hideAllScreens();
    document.getElementById('main-menu').classList.add('active');
    if (addToHistory) navigateToScreen('main-menu');
    
    // Обновляем информацию игрока
    updateMainMenuInfo();
    
    if (window.updateDailyTasksDisplay) {
        window.updateDailyTasksDisplay();
    }
}

function updateMainMenuInfo() {
    if (gameState.currentUser) {
        // Обновляем только имя в приветствии (если есть)
        const welcomeUsername = document.getElementById('welcome-username');
        if (welcomeUsername) {
            welcomeUsername.textContent = gameState.currentUser.username;
        }
    }
    
    const gameData = window.gameData;
    if (gameData) {
        // Обновляем ресурсы в header
        const headerLevelEl = document.getElementById('header-level');
        const headerMoneyEl = document.getElementById('header-money');
        const headerFuelEl = document.getElementById('header-fuel');
        
        if (headerLevelEl) headerLevelEl.textContent = gameData.level;
        if (headerMoneyEl) headerMoneyEl.textContent = gameData.money.toLocaleString();
        
        const currentCar = gameData.cars[gameData.currentCar];
        if (currentCar && headerFuelEl) {
            const currentFuel = window.fuelSystem ? 
                window.fuelSystem.getCurrentFuel(currentCar) : 
                currentCar.fuel;
            headerFuelEl.textContent = currentFuel;
        }
    }
}

export function showGarageScreen(addToHistory = true) {
    hideAllScreens();
    document.getElementById('garage-screen').classList.add('active');
    if (window.updateGarageDisplay) {
        window.updateGarageDisplay();
        // Убедимся, что первая вкладка активна
        if (window.showGarageTab) {
            window.showGarageTab('upgrades');
        }
    }
    if (addToHistory) navigateToScreen('garage-screen');
}

export function showRaceMenu(addToHistory = true) {
    hideAllScreens();
    document.getElementById('race-menu-screen').classList.add('active');
    if (window.displayOpponents) window.displayOpponents();
    if (addToHistory) navigateToScreen('race-menu-screen');
}

export function showShopScreen(addToHistory = true) {
    hideAllScreens();
    document.getElementById('shop-screen').classList.add('active');
    if (window.updateShopDisplay) {
        window.updateShopDisplay();
        // Убеждаемся что активна вкладка покупки
        if (window.showShopTab) {
            window.showShopTab('buy');
        }
    }
    if (addToHistory) navigateToScreen('shop-screen');
}

export async function showLeaderboardScreen(addToHistory = true) {
    hideAllScreens();
    document.getElementById('leaderboard-screen').classList.add('active');
    if (addToHistory) navigateToScreen('leaderboard-screen');
    if (window.updateLeaderboard) await window.updateLeaderboard();
}

export function showRaceResultScreen() {
    hideAllScreens();
    document.getElementById('race-result-screen').classList.add('active');
    // Прокручиваем наверх для показа результата
    const mainContainer = document.querySelector('.mobile-main');
    if (mainContainer) {
        mainContainer.scrollTop = 0;
    }
}

export function showDailyTasksScreen(addToHistory = true) {
    hideAllScreens();
    document.getElementById('daily-tasks-screen').classList.add('active');
    if (addToHistory) navigateToScreen('daily-tasks-screen');
    
    if (window.initDailyTasksScreen) {
        window.initDailyTasksScreen();
    }
}

// Показать экран авторизации
export function showAuthScreen() {
    document.getElementById('auth-container').style.display = 'flex';
    document.querySelector('.mobile-container').style.display = 'none';
}

// Показать игру
export function showGame() {
    document.getElementById('auth-container').style.display = 'none';
    document.querySelector('.mobile-container').style.display = 'block';
}

// Функции для совместимости
export function showProfileScreen(addToHistory = true) {
    hideAllScreens();
    document.getElementById('profile-screen').classList.add('active');
    if (addToHistory) navigateToScreen('profile-screen');
    
    // Обновляем профиль
    if (window.updateProfileDisplay) {
        window.updateProfileDisplay();
    }
}

// Добавь новую функцию для экрана достижений
export function showAchievementsScreen(addToHistory = true) {
    hideAllScreens();
    document.getElementById('achievements-screen').classList.add('active');
    if (addToHistory) navigateToScreen('achievements-screen');
    
    if (window.updateAchievementsDisplay) {
        window.updateAchievementsDisplay();
    }
}

// Показать экран сообщества
export function showCommunityScreen(addToHistory = true) {
    hideAllScreens();
    document.getElementById('community-screen').classList.add('active');
    if (addToHistory) navigateToScreen('community-screen');
    
    // Загружаем чат и новости при открытии
    if (window.loadChatMessages) {
        window.loadChatMessages();
    }
    if (window.loadNews) {
        window.loadNews('all');
    }
    
    // Запускаем автообновление чата
    if (window.startChatUpdates) {
        window.startChatUpdates();
    }
}

// Переключение вкладок сообщества
export function showCommunityTab(tab) {
    // Удаляем активные классы
    document.querySelectorAll('#community-screen .tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('#community-screen .tab-content').forEach(content => content.classList.remove('active'));
    
    if (tab === 'chat') {
        document.querySelector('#community-screen .tab-button:first-child').classList.add('active');
        document.getElementById('community-chat').classList.add('active');
        
        // Загружаем чат
        if (window.loadChatMessages) {
            window.loadChatMessages();
        }
        // Запускаем автообновление
        if (window.startChatUpdates) {
            window.startChatUpdates();
        }
    } else {
        document.querySelector('#community-screen .tab-button:last-child').classList.add('active');
        document.getElementById('community-news').classList.add('active');
        
        // Останавливаем автообновление чата
        if (window.stopChatUpdates) {
            window.stopChatUpdates();
        }
        // Загружаем новости
        if (window.loadNews) {
            window.loadNews('all');
        }
    }
}

// Делаем функции доступными глобально
window.showMainMenu = showMainMenu;
window.showGarageScreen = showGarageScreen;
window.showRaceMenu = showRaceMenu;
window.showShopScreen = showShopScreen;
window.showProfileScreen = showProfileScreen;
window.showLeaderboardScreen = showLeaderboardScreen;
window.showDailyTasksScreen = showDailyTasksScreen;
window.showAchievementsScreen = showAchievementsScreen;
window.showCommunityScreen = showCommunityScreen;
window.showCommunityTab = showCommunityTab;
window.goBack = goBack;