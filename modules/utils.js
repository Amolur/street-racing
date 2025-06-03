// modules/utils.js
// Вспомогательные функции с новым UI

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

// Показать/скрыть индикатор загрузки
export function showLoading(show) {
    let loadingIndicator = document.getElementById('loading-indicator');
    
    if (!loadingIndicator) {
        loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'loading-indicator';
        loadingIndicator.className = 'loading-overlay';
        loadingIndicator.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
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
    // Обновляем ресурсы в header
    if (gameData) {
        document.getElementById('header-level').textContent = gameData.level;
        document.getElementById('header-money').textContent = gameData.money.toLocaleString();
        
        const currentCar = gameData.cars[gameData.currentCar];
        if (currentCar) {
            const currentFuel = fuelSystem.getCurrentFuel(currentCar);
            document.getElementById('header-fuel').textContent = currentFuel;
        }
        
        // Обновляем информацию в главном меню
        if (gameState.currentScreen === 'main-menu') {
            document.getElementById('player-level').textContent = gameData.level;
            document.getElementById('player-wins').textContent = gameData.stats.wins;
            document.getElementById('player-cars').textContent = gameData.cars.length;
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
    document.getElementById('header-fuel').textContent = currentFuel;
    
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
export function startInfoBarUpdates() {}

// Добавляем стили для индикатора загрузки
const loadingStyles = `
    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    }
    
    .loading-content {
        text-align: center;
        color: white;
    }
    
    .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 16px;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;

// Добавляем стили в head
const styleSheet = document.createElement('style');
styleSheet.textContent = loadingStyles;
document.head.appendChild(styleSheet);