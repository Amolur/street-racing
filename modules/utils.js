// modules/utils.js
// Вспомогательные функции

import { gameState, gameData, fuelSystem } from './game-data.js';
import { dom } from './dom-manager.js';

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

// Оптимизированное обновление информации игрока
export function updatePlayerInfo() {
    // Батчинг всех обновлений денег
    dom.batchUpdate(() => {
        const money = gameData.money.toLocaleString();
        dom.setText('#race-balance', money);
        dom.setText('#upgrade-balance', money);
        dom.setText('#info-money', money);
    });
    
    // Батчинг обновлений уровня
    dom.batchUpdate(() => {
        const level = gameData.level;
        dom.setText('#profile-level', level);
        dom.setText('#info-level', level);
    });
    
    // Обновление машины только если элемент существует
    const raceCurrentCar = dom.get('#race-current-car');
    if (raceCurrentCar && gameData.cars[gameData.currentCar]) {
        dom.setText('#race-current-car', gameData.cars[gameData.currentCar].name);
    }
    
    updateQuickStats();
    
    if (gameState.currentScreen === 'main-menu') {
        updatePlayerInfoBar();
    }
}

// Дебаунсинг для частых обновлений
const debouncedUpdatePlayerInfo = dom.debounce(updatePlayerInfo, 100);

// Оптимизированное обновление быстрой статистики
export function updateQuickStats() {
    dom.batchUpdate(() => {
        dom.setText('#quick-wins', gameData.stats.wins);
        dom.setText('#quick-cars', gameData.cars.length);
        dom.setText('#quick-rating', '#—');
    });
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

// Оптимизированная информационная панель
let lastMoneyValue = null;

export function updatePlayerInfoBar() {
    if (gameState.currentScreen !== 'main-menu' || !gameState.currentUser || !gameData) {
        return;
    }
    
    dom.show('#player-info-bar');
    
    // Обновляем только если изменилось
    if (gameState.currentUser.username) {
        dom.setText('#info-username', gameState.currentUser.username);
    }
    
    dom.setText('#info-level', gameData.level);
    
    // Анимация только при изменении денег
    const newMoney = gameData.money;
    if (lastMoneyValue !== null && lastMoneyValue !== newMoney) {
        const moneyEl = dom.get('#info-money');
        if (moneyEl) {
            dom.addClass('#info-money', 'updating');
            setTimeout(() => dom.removeClass('#info-money', 'updating'), 300);
        }
    }
    
    dom.setText('#info-money', newMoney.toLocaleString());
    lastMoneyValue = newMoney;
    
    updateFuelInfoBarDirect();
}

// Оптимизированное обновление топлива
const updateFuelInfoBarDirect = dom.throttle(() => {
    if (!gameData.cars || !gameData.cars[gameData.currentCar]) return;
    
    const currentCar = gameData.cars[gameData.currentCar];
    const currentFuel = fuelSystem.getCurrentFuel(currentCar);
    const maxFuel = currentCar.maxFuel || 30;
    
    dom.batchUpdate(() => {
        dom.setText('#info-fuel', `${currentFuel}/${maxFuel}`);
        
        const fuelPercent = currentFuel / maxFuel;
        const color = fuelPercent <= 0.2 ? 'var(--neon-red)' : 
                      fuelPercent <= 0.5 ? 'var(--neon-orange)' : 
                      'var(--neon-yellow)';
        
        dom.setStyle('#info-fuel', 'color', color);
    });
    
    const fuelTimerEl = dom.get('#info-fuel-timer');
    if (fuelTimerEl && currentFuel < maxFuel) {
        updateFuelTimerMini(currentCar, fuelTimerEl);
    } else if (fuelTimerEl) {
        dom.setText('#info-fuel-timer', '');
    }
}, 500);

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

// Оптимизированное отображение топлива
export function updateFuelDisplay() {
    const car = gameData.cars[gameData.currentCar];
    if (!car) return;
    
    const currentFuel = fuelSystem.getCurrentFuel(car);
    const maxFuel = car.maxFuel || 30;
    const fuelPercent = (currentFuel / maxFuel) * 100;
    
    const fuelDisplay = dom.get('#current-car-fuel');
    if (fuelDisplay) {
        const fuelHTML = `
            <div class="fuel-info">
                <span class="fuel-icon">⛽</span>
                <span class="fuel-text">${currentFuel}/${maxFuel}</span>
                ${currentFuel < maxFuel ? '<span class="fuel-timer" id="fuel-timer"></span>' : ''}
            </div>
            <div class="fuel-bar">
                <div class="fuel-bar-fill" style="width: ${fuelPercent}%"></div>
            </div>
        `;
        
        dom.setHTML('#current-car-fuel', fuelHTML);
        
        if (currentFuel < maxFuel) {
            updateFuelTimer(car);
        }
    }
    
    const raceCarFuel = dom.get('#race-car-fuel');
    if (raceCarFuel) {
        dom.setHTML('#race-car-fuel', `⛽ ${currentFuel}/${maxFuel}`);
    }
    
    if (gameState.currentScreen === 'main-menu') {
        updateFuelInfoBarDirect();
    }
}

// Оптимизированный таймер топлива
let fuelTimerInterval = null;

export function updateFuelTimer(car) {
    const timerElement = dom.get('#fuel-timer');
    if (!timerElement) return;
    
    // Очищаем старый интервал
    if (fuelTimerInterval) {
        clearInterval(fuelTimerInterval);
    }
    
    const update = () => {
        const now = new Date();
        const lastUpdate = new Date(car.lastFuelUpdate || now);
        const minutesPassed = (now - lastUpdate) / 60000;
        const minutesUntilNextFuel = fuelSystem.regenRate - (minutesPassed % fuelSystem.regenRate);
        
        if (minutesUntilNextFuel > 0) {
            const minutes = Math.floor(minutesUntilNextFuel);
            const seconds = Math.floor((minutesUntilNextFuel - minutes) * 60);
            dom.setText('#fuel-timer', `(${minutes}:${seconds.toString().padStart(2, '0')})`);
        }
    };
    
    update();
    fuelTimerInterval = setInterval(update, 1000);
}