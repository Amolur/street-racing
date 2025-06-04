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
        case 'community-screen':
            if (window.loadChatMessages) {
                setTimeout(() => window.loadChatMessages(), 50);
            }
            if (window.loadNews) {
                setTimeout(() => window.loadNews(), 50);
            }
            if (window.startChatUpdates) {
                setTimeout(() => window.startChatUpdates(), 50);
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

// Функция для экрана достижений
export function showAchievementsScreen(addToHistory = true) {
    hideAllScreens();
    document.getElementById('achievements-screen').classList.add('active');
    if (addToHistory) navigateToScreen('achievements-screen');
    
    if (window.updateAchievementsDisplay) {
        window.updateAchievementsDisplay();
    }
}

// Функция для экрана сообщества
export function showCommunityScreen(addToHistory = true) {
    console.log('showCommunityScreen вызвана');
    hideAllScreens();
    const communityScreen = document.getElementById('community-screen');
    if (communityScreen) {
        communityScreen.classList.add('active');
        console.log('Экран сообщества активирован');
    } else {
        console.error('Элемент community-screen не найден');
    }
    
    if (addToHistory) navigateToScreen('community-screen');
    
    // Загружаем чат и новости при открытии
    setTimeout(() => {
        if (window.loadChatMessages) {
            console.log('Загружаем сообщения чата');
            window.loadChatMessages();
        }
        if (window.loadNews) {
            console.log('Загружаем новости');
            window.loadNews();
        }
        if (window.startChatUpdates) {
            console.log('Запускаем обновления чата');
            window.startChatUpdates();
        }
    }, 100);
}

// Функция для переключения вкладок сообщества  
export function showCommunityTab(tab) {
    console.log('showCommunityTab вызвана с параметром:', tab);
    
    // Удаляем активные классы
    document.querySelectorAll('#community-screen .tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('#community-screen .tab-content').forEach(content => content.classList.remove('active'));
    
    // Активируем нужную вкладку
    if (tab === 'chat') {
        const chatBtn = document.querySelector('#community-screen .tab-button:first-child');
        const chatContent = document.getElementById('community-chat');
        
        if (chatBtn) chatBtn.classList.add('active');
        if (chatContent) chatContent.classList.add('active');
        
        // Загружаем сообщения чата
        if (window.loadChatMessages) {
            window.loadChatMessages();
        }
        // Запускаем обновления чата
        if (window.startChatUpdates) {
            window.startChatUpdates();
        }
    } else if (tab === 'news') {
        const newsBtn = document.querySelector('#community-screen .tab-button:last-child');
        const newsContent = document.getElementById('community-news');
        
        if (newsBtn) newsBtn.classList.add('active');
        if (newsContent) newsContent.classList.add('active');
        
        // Загружаем новости
        if (window.loadNews) {
            window.loadNews();
        }
        // Останавливаем обновления чата
        if (window.stopChatUpdates) {
            window.stopChatUpdates();
        }
    }
}