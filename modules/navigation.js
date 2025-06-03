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
    
    // Обновляем данные экрана если нужно
    switch(screenId) {
        case 'garage-screen':
            if (window.updateGarageDisplay) {
                setTimeout(() => window.updateGarageDisplay(), 100);
            }
            break;
        case 'race-menu-screen':
            if (window.displayOpponents) {
                setTimeout(() => window.displayOpponents(), 100);
            }
            break;
        case 'shop-screen':
            if (window.updateShopDisplay) {
                setTimeout(() => window.updateShopDisplay(), 100);
            }
            break;
        case 'leaderboard-screen':
            if (window.updateLeaderboard) {
                setTimeout(() => window.updateLeaderboard(), 100);
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
        document.getElementById('player-name').textContent = gameState.currentUser.username;
    }
    
    const gameData = window.gameData;
    if (gameData) {
        document.getElementById('player-level').textContent = gameData.level;
        document.getElementById('player-wins').textContent = gameData.stats.wins;
        document.getElementById('player-cars').textContent = gameData.cars.length;
        
        // Обновляем ресурсы в header
        document.getElementById('header-level').textContent = gameData.level;
        document.getElementById('header-money').textContent = gameData.money.toLocaleString();
        
        const currentCar = gameData.cars[gameData.currentCar];
        if (currentCar) {
            const currentFuel = window.fuelSystem ? 
                window.fuelSystem.getCurrentFuel(currentCar) : 
                currentCar.fuel;
            document.getElementById('header-fuel').textContent = currentFuel;
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
    if (window.updateShopDisplay) window.updateShopDisplay();
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
    // Профиль скрыт в новом дизайне
    showMainMenu(addToHistory);
}