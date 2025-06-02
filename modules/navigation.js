// modules/navigation.js
// Управление навигацией между экранами

import { gameState } from './game-data.js';
import { showPlayerInfoBar, hidePlayerInfoBar, updateQuickStats } from './utils.js';

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
    
    if (gameState.currentScreen === 'main-menu') {
        showPlayerInfoBar();
    }
}

// Функция скрытия всех экранов
export function hideAllScreens() {
    document.querySelectorAll('.game-screen').forEach(screen => {
        screen.classList.remove('active');
    });
}

// Базовая функция навигации
export function navigateTo(screenId) {
    hideAllScreens();
    
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
        navigateToScreen(screenId);
    }
    
    // Обновляем данные экрана если нужно
    switch(screenId) {
        case 'garage-screen':
            // Будет импортировано из garage.js позже
            if (window.updateGarageDisplay) window.updateGarageDisplay();
            break;
        case 'race-menu-screen':
            // Будет импортировано из race.js позже
            if (window.displayOpponents) window.displayOpponents();
            break;
        case 'profile-screen':
            // Будет импортировано из profile.js позже
            if (window.updateProfileDisplay) window.updateProfileDisplay();
            break;
        case 'shop-screen':
            // Будет импортировано из shop.js позже
            if (window.updateShopDisplay) window.updateShopDisplay();
            break;
        case 'leaderboard-screen':
            // Будет импортировано из profile.js позже
            if (window.updateLeaderboard) window.updateLeaderboard();
            break;
    }
}

// Функции навигации для конкретных экранов
export function showMainMenu(addToHistory = true) {
    hideAllScreens();
    document.getElementById('main-menu').classList.add('active');
    if (addToHistory) navigateToScreen('main-menu');
    updateQuickStats();
    
    // Проверяем и обновляем ежедневные задания
    if (window.checkAndResetDailyTasks) {
        window.checkAndResetDailyTasks();
    }
    if (window.updateDailyTasksDisplay) {
        window.updateDailyTasksDisplay();
    }
    
    // Всегда показываем информационную панель на главном экране
    setTimeout(() => {
        showPlayerInfoBar();
    }, 100);
}

export function showGarageScreen(addToHistory = true) {
    hidePlayerInfoBar();
    hideAllScreens();
    document.getElementById('garage-screen').classList.add('active');
    if (window.updateGarageDisplay) window.updateGarageDisplay();
    if (addToHistory) navigateToScreen('garage-screen');
}

export function showRaceMenu(addToHistory = true) {
    hidePlayerInfoBar();
    hideAllScreens();
    document.getElementById('race-menu-screen').classList.add('active');
    if (window.displayOpponents) window.displayOpponents();
    if (addToHistory) navigateToScreen('race-menu-screen');
}

export function showProfileScreen(addToHistory = true) {
    hidePlayerInfoBar();
    hideAllScreens();
    document.getElementById('profile-screen').classList.add('active');
    if (window.updateProfileDisplay) window.updateProfileDisplay();
    if (addToHistory) navigateToScreen('profile-screen');
}

export function showShopScreen(addToHistory = true) {
    hidePlayerInfoBar();
    hideAllScreens();
    document.getElementById('shop-screen').classList.add('active');
    if (window.updateShopDisplay) window.updateShopDisplay();
    if (addToHistory) navigateToScreen('shop-screen');
}

export async function showLeaderboardScreen(addToHistory = true) {
    hidePlayerInfoBar();
    hideAllScreens();
    document.getElementById('leaderboard-screen').classList.add('active');
    if (addToHistory) navigateToScreen('leaderboard-screen');
    if (window.updateLeaderboard) await window.updateLeaderboard();
}

export function showRaceResultScreen() {
    hidePlayerInfoBar();
    hideAllScreens();
    document.getElementById('race-result-screen').classList.add('active');
}

// Показать экран авторизации
export function showAuthScreen() {
    document.getElementById('auth-container').style.display = 'flex';
    document.querySelector('.game-container').style.display = 'none';
    
    // Очищаем поля
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('register-username').value = '';
    document.getElementById('register-password').value = '';
    document.getElementById('register-password-confirm').value = '';
}

// Показать игру
export function showGame() {
    document.getElementById('auth-container').style.display = 'none';
    document.querySelector('.game-container').style.display = 'block';
}

export function showDailyTasksScreen(addToHistory = true) {
    hidePlayerInfoBar();
    hideAllScreens();
    document.getElementById('daily-tasks-screen').classList.add('active');
    if (addToHistory) navigateToScreen('daily-tasks-screen');
    
    // Обновляем задания при открытии
    // Импортируем функции из daily-tasks
    if (window.checkAndResetDailyTasks) {
        window.checkAndResetDailyTasks();
    }
    if (window.updateDailyTasksDisplay) {
        window.updateDailyTasksDisplay();
    }
}