// modules/utils.js
// Вспомогательные функции

import { gameState, gameData } from './game-data.js';

// Безопасная работа с localStorage
export const storage = {
    getItem: (key) => {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn('localStorage недоступен:', e);
            return null;
        }
    },
    setItem: (key, value) => {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn('Не удалось сохранить в localStorage:', e);
        }
    },
    removeItem: (key) => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn('Не удалось удалить из localStorage:', e);
        }
    }
};

// Показать уведомление об ошибке
export function showError(message) {
    let notification = document.getElementById('error-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'error-notification';
        notification.className = 'error-notification';
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

// Показать/скрыть индикатор загрузки
export function showLoading(show) {
    let loadingIndicator = document.getElementById('loading-indicator');
    
    if (!loadingIndicator) {
        loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'loading-indicator';
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner-ring"></div>
                <p>Загрузка...</p>
            </div>
        `;
        document.body.appendChild(loadingIndicator);
    }
    
    loadingIndicator.style.display = show ? 'flex' : 'none';
}

// Автосохранение
export function startAutoSave() {
    if (gameState.autoSaveInterval) {
        clearInterval(gameState.autoSaveInterval);
    }
    
    gameState.autoSaveInterval = setInterval(async () => {
        if (gameState.currentUser) {
            try {
                await saveGameData(gameData);
                console.log('Автосохранение выполнено');
            } catch (error) {
                console.error('Ошибка автосохранения:', error);
            }
        }
    }, 60000); // 60 секунд
}

export function stopAutoSave() {
    if (gameState.autoSaveInterval) {
        clearInterval(gameState.autoSaveInterval);
        gameState.autoSaveInterval = null;
    }
}

// Обновление информации игрока
export function updatePlayerInfo() {
    const moneyElements = [
        document.getElementById('race-balance'),
        document.getElementById('upgrade-balance')
    ];
    
    moneyElements.forEach(element => {
        if (element) element.textContent = gameData.money;
    });
    
    const levelElements = [
        document.getElementById('profile-level')
    ];
    
    levelElements.forEach(element => {
        if (element) element.textContent = gameData.level;
    });
    
    const raceCurrentCar = document.getElementById('race-current-car');
    if (raceCurrentCar && gameData.cars[gameData.currentCar]) {
        raceCurrentCar.textContent = gameData.cars[gameData.currentCar].name;
    }
    
    updateQuickStats();
    
    if (gameState.currentScreen === 'main-menu') {
        updatePlayerInfoBar();
    }
}

// Обновление быстрой статистики
export function updateQuickStats() {
    const quickWins = document.getElementById('quick-wins');
    const quickCars = document.getElementById('quick-cars');
    const quickRating = document.getElementById('quick-rating');
    
    if (quickWins) quickWins.textContent = gameData.stats.wins;
    if (quickCars) quickCars.textContent = gameData.cars.length;
    if (quickRating) quickRating.textContent = '#—';
}

// Информационная панель игрока
export function showPlayerInfoBar() {
    const infoBar = document.getElementById('player-info-bar');
    if (infoBar) {
        infoBar.style.display = 'flex';
        updatePlayerInfoBar();
    }
}

export function hidePlayerInfoBar() {
    const infoBar = document.getElementById('player-info-bar');
    if (infoBar) {
        infoBar.style.display = 'none';
    }
}

export function updatePlayerInfoBar() {
    if (gameState.currentScreen === 'main-menu' && gameState.currentUser && gameData) {
        const infoBar = document.getElementById('player-info-bar');
        if (infoBar) {
            infoBar.style.display = 'flex';
        }
    }
    
    if (!gameState.currentUser || !gameData) return;
    
    const usernameEl = document.getElementById('info-username');
    if (usernameEl) {
        usernameEl.textContent = gameState.currentUser.username;
    }
    
    const levelEl = document.getElementById('info-level');
    if (levelEl) {
        levelEl.textContent = gameData.level;
    }
    
    const moneyEl = document.getElementById('info-money');
    if (moneyEl) {
        const oldMoney = parseInt(moneyEl.textContent.replace(/,/g, '')) || 0;
        const newMoney = gameData.money;
        
        if (oldMoney !== newMoney) {
            moneyEl.parentElement.classList.add('updating');
            setTimeout(() => {
                moneyEl.parentElement.classList.remove('updating');
            }, 300);
        }
        
        moneyEl.textContent = newMoney.toLocaleString();
    }
    
    updateFuelInfoBarDirect();
}

// Обновление топлива в информационной панели
export function updateFuelInfoBarDirect() {
    if (!gameData.cars || !gameData.cars[gameData.currentCar]) return;
    
    const currentCar = gameData.cars[gameData.currentCar];
    const currentFuel = fuelSystem.getCurrentFuel(currentCar);
    const maxFuel = currentCar.maxFuel || 30;
    
    const fuelEl = document.getElementById('info-fuel');
    const fuelTimerEl = document.getElementById('info-fuel-timer');
    
    if (fuelEl) {
        fuelEl.textContent = `${currentFuel}/${maxFuel}`;
        
        const fuelPercent = currentFuel / maxFuel;
        if (fuelPercent <= 0.2) {
            fuelEl.style.color = 'var(--neon-red)';
        } else if (fuelPercent <= 0.5) {
            fuelEl.style.color = 'var(--neon-orange)';
        } else {
            fuelEl.style.color = 'var(--neon-yellow)';
        }
    }
    
    if (fuelTimerEl && currentFuel < maxFuel) {
        updateFuelTimerMini(currentCar, fuelTimerEl);
    } else if (fuelTimerEl) {
        fuelTimerEl.textContent = '';
    }
}

// Мини-таймер топлива
export function updateFuelTimerMini(car, timerElement) {
    const update = () => {
        const now = new Date();
        const lastUpdate = new Date(car.lastFuelUpdate || now);
        const minutesPassed = (now - lastUpdate) / 60000;
        const minutesUntilNextFuel = fuelSystem.regenRate - (minutesPassed % fuelSystem.regenRate);
        
        if (minutesUntilNextFuel > 0) {
            const minutes = Math.floor(minutesUntilNextFuel);
            const seconds = Math.floor((minutesUntilNextFuel - minutes) * 60);
            timerElement.textContent = `(${minutes}:${seconds.toString().padStart(2, '0')})`;
        } else {
            timerElement.textContent = '';
        }
    };
    
    update();
    
    if (window.miniTimerInterval) clearInterval(window.miniTimerInterval);
    window.miniTimerInterval = setInterval(update, 1000);
}

// Запуск обновления информационной панели
export function startInfoBarUpdates() {
    if (gameState.infoBarUpdateInterval) {
        clearInterval(gameState.infoBarUpdateInterval);
    }
    
    gameState.infoBarUpdateInterval = setInterval(() => {
        if (gameState.currentScreen === 'main-menu' && gameState.currentUser && gameData) {
            updateFuelInfoBarDirect();
        }
    }, 5000);
}

// Запуск обновления топлива
export function startFuelUpdates() {
    if (gameState.fuelUpdateInterval) clearInterval(gameState.fuelUpdateInterval);
    
    gameState.fuelUpdateInterval = setInterval(() => {
        updateFuelDisplay();
    }, 10000);
}

export function stopFuelUpdates() {
    if (gameState.fuelUpdateInterval) {
        clearInterval(gameState.fuelUpdateInterval);
        gameState.fuelUpdateInterval = null;
    }
}

// Обновление отображения топлива
export function updateFuelDisplay() {
    const fuelDisplay = document.getElementById('current-car-fuel');
    if (fuelDisplay && gameData.cars[gameData.currentCar]) {
        const car = gameData.cars[gameData.currentCar];
        const currentFuel = fuelSystem.getCurrentFuel(car);
        const maxFuel = car.maxFuel || 30;
        
        fuelDisplay.innerHTML = `
            <div class="fuel-info">
                <span class="fuel-icon">⛽</span>
                <span class="fuel-text">${currentFuel}/${maxFuel}</span>
                ${currentFuel < maxFuel ? `<span class="fuel-timer" id="fuel-timer"></span>` : ''}
            </div>
            <div class="fuel-bar">
                <div class="fuel-bar-fill" style="width: ${(currentFuel / maxFuel) * 100}%"></div>
            </div>
        `;
        
        if (currentFuel < maxFuel) {
            updateFuelTimer(car);
        }
    }
    
    const raceCarFuel = document.getElementById('race-car-fuel');
    if (raceCarFuel && gameData.cars[gameData.currentCar]) {
        const car = gameData.cars[gameData.currentCar];
        const currentFuel = fuelSystem.getCurrentFuel(car);
        raceCarFuel.innerHTML = `⛽ ${currentFuel}/${car.maxFuel || 30}`;
    }
    
    if (gameState.currentScreen === 'main-menu') {
        updateFuelInfoBarDirect();
    }
}

// Обновление таймера топлива
export function updateFuelTimer(car) {
    const timerElement = document.getElementById('fuel-timer');
    if (!timerElement) return;
    
    const update = () => {
        const now = new Date();
        const lastUpdate = new Date(car.lastFuelUpdate || now);
        const minutesPassed = (now - lastUpdate) / 60000;
        const minutesUntilNextFuel = fuelSystem.regenRate - (minutesPassed % fuelSystem.regenRate);
        
        if (minutesUntilNextFuel > 0) {
            const minutes = Math.floor(minutesUntilNextFuel);
            const seconds = Math.floor((minutesUntilNextFuel - minutes) * 60);
            timerElement.textContent = `(${minutes}:${seconds.toString().padStart(2, '0')})`;
        }
    };
    
    update();
    const interval = setInterval(update, 1000);
    
    if (window.fuelTimerInterval) clearInterval(window.fuelTimerInterval);
    window.fuelTimerInterval = interval;
}

// Импортируем fuelSystem для использования в функциях
import { fuelSystem } from './game-data.js';