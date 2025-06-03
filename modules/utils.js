// modules/utils.js
// Вспомогательные функции с новым UI (без загрузки)

import { gameState, gameData, fuelSystem } from './game-data.js';
import { showNotification } from './ui-components.js';

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
    showNotification(message, 'error');
}

// Показать/скрыть индикатор загрузки (отключено)
export function showLoading(show) {
    // Функция отключена - нет индикаторов загрузки
    console.log(show ? 'Начало операции...' : 'Операция завершена');
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
                console.log('✅ Автосохранение выполнено');
            } catch (error) {
                console.error('❌ Ошибка автосохранения:', error);
            }
        }
    }, 300000); // Увеличьте до 5 минут (300000 мс) вместо 1 минуты
}

export function stopAutoSave() {
    if (gameState.autoSaveInterval) {
        clearInterval(gameState.autoSaveInterval);
        gameState.autoSaveInterval = null;
    }
}

// Обновление информации игрока
export function updatePlayerInfo() {
    // Обновляем ресурсы в header
    if (gameData) {
        const headerLevelEl = document.getElementById('header-level');
        const headerMoneyEl = document.getElementById('header-money');
        const headerFuelEl = document.getElementById('header-fuel');
        
        if (headerLevelEl) headerLevelEl.textContent = gameData.level;
        if (headerMoneyEl) headerMoneyEl.textContent = gameData.money.toLocaleString();
        
        const currentCar = gameData.cars[gameData.currentCar];
        if (currentCar && headerFuelEl) {
            const currentFuel = fuelSystem.getCurrentFuel(currentCar);
            headerFuelEl.textContent = currentFuel;
        }
        
        // Обновляем информацию в главном меню
        if (gameState.currentScreen === 'main-menu') {
            const playerLevelEl = document.getElementById('player-level');
            const playerWinsEl = document.getElementById('player-wins');
            const playerCarsEl = document.getElementById('player-cars');
            
            if (playerLevelEl) playerLevelEl.textContent = gameData.level;
            if (playerWinsEl) playerWinsEl.textContent = gameData.stats.wins;
            if (playerCarsEl) playerCarsEl.textContent = gameData.cars.length;
        }
        
        // Обновляем другие экраны
        const raceBalance = document.getElementById('race-balance');
        if (raceBalance) {
            raceBalance.textContent = gameData.money;
        }
    }
}

// Обновление быстрой статистики
export function updateQuickStats() {
    updatePlayerInfo();
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
    const car = gameData.cars[gameData.currentCar];
    if (!car) return;
    
    const currentFuel = fuelSystem.getCurrentFuel(car);
    
    // Обновляем в header
    const headerFuelEl = document.getElementById('header-fuel');
    if (headerFuelEl) {
        headerFuelEl.textContent = currentFuel;
    }
    
    // Обновляем в гараже
    const carFuelDisplay = document.getElementById('car-fuel-display');
    if (carFuelDisplay) {
        carFuelDisplay.textContent = `${currentFuel}/${car.maxFuel || 30}`;
    }
    
    // Обновляем в меню гонок
    const raceCarFuel = document.getElementById('race-car-fuel');
    if (raceCarFuel) {
        raceCarFuel.textContent = `${currentFuel}/${car.maxFuel || 30}`;
    }
}

// Заглушки для совместимости
export function showPlayerInfoBar() {}
export function hidePlayerInfoBar() {}
export function updatePlayerInfoBar() {}
export function startInfoBarUpdates() {
    // Запускаем обновление основной информации вместо инфобара
    updatePlayerInfo();
    
    // Периодически обновляем данные
    if (!gameState.infoBarUpdateInterval) {
        gameState.infoBarUpdateInterval = setInterval(() => {
            updatePlayerInfo();
        }, 5000);
    }
}