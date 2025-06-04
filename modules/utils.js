// modules/utils.js
// Вспомогательные функции с новым UI (без загрузки)

import { gameState, gameData, fuelSystem } from './game-data.js';

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

// Система очереди сохранения
let saveQueue = [];
let isSaving = false;
let unsavedChanges = false;

// Система очереди сохранения
export async function queueSave(gameData, priority = 'normal') {
    unsavedChanges = true;
    
    // Добавляем в очередь
    saveQueue.push({
        data: JSON.parse(JSON.stringify(gameData)), // Глубокая копия
        priority: priority,
        timestamp: Date.now()
    });
    
    // Если критическое сохранение - сохраняем сразу
    if (priority === 'critical') {
        await processSaveQueue();
    }
}

// Обработка очереди сохранения
async function processSaveQueue() {
    if (isSaving || saveQueue.length === 0) return;
    
    isSaving = true;
    updateSaveIndicator(null); // Показываем процесс сохранения
    
    // Берем последнее состояние (самое актуальное)
    const latestSave = saveQueue[saveQueue.length - 1];
    saveQueue = []; // Очищаем очередь
    
    try {
        // ИСПРАВЛЕНО: используем глобальную функцию saveGameData
        if (window.saveGameData) {
            await window.saveGameData(latestSave.data);
        } else {
            throw new Error('saveGameData не найдена');
        }
        unsavedChanges = false;
        updateSaveIndicator(true);
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        saveQueue.push(latestSave); // Возвращаем в очередь
        updateSaveIndicator(false);
    } finally {
        isSaving = false;
    }
}

// Запускаем обработку очереди каждые 5 секунд
setInterval(processSaveQueue, 5000);

// Предупреждение при закрытии страницы
window.addEventListener('beforeunload', async (e) => {
    if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = 'У вас есть несохраненные изменения!';
        
        // Пытаемся сохранить синхронно
        try {
            const latestSave = saveQueue[saveQueue.length - 1] || { data: gameData };
            if (window.saveGameData) {
                await window.saveGameData(latestSave.data);
            }
        } catch (error) {
            console.error('Не удалось сохранить при закрытии');
        }
    }
});

// Обновление индикатора сохранения
export function updateSaveIndicator(success = null) {
    const indicator = document.getElementById('save-indicator');
    if (!indicator) return;
    
    indicator.classList.remove('saving', 'saved', 'error', 'show');
    
    // Можете оставить только критические ошибки (по желанию)
    if (success === false) {
        indicator.classList.add('show', 'error');
        const saveText = indicator.querySelector('.save-text');
        if (saveText) saveText.textContent = 'Ошибка!';
        setTimeout(() => {
            indicator.classList.remove('show');
        }, 3000);
    }
}

// Показать уведомление об ошибке
export function showError(message) {
    if (window.notify) {
        window.notify(message, 'error');
    } else {
        // Fallback для случаев когда notify недоступна
        showNotificationFallback(message, 'error');
    }
}

// ИСПРАВЛЕНО: добавил fallback функцию для уведомлений
function showNotificationFallback(message, type = 'error') {
    let notification = document.getElementById('error-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'error-notification';
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
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
        if (gameState.currentUser && gameData) {
            try {
                await queueSave(gameData, 'normal');
                // console.log('✅ Автосохранение добавлено в очередь'); // ЗАКОММЕНТИРУЙТЕ
            } catch (error) {
                console.error('❌ Ошибка автосохранения:', error);
            }
        }
    }, 60000);
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
    
    // Обновляем каждые 30 секунд
    gameState.fuelUpdateInterval = setInterval(() => {
        updateFuelDisplay();
        checkFuelRegeneration();
    }, 30000);
    
    // Первое обновление сразу
    updateFuelDisplay();
}

export function stopFuelUpdates() {
    if (gameState.fuelUpdateInterval) {
        clearInterval(gameState.fuelUpdateInterval);
        gameState.fuelUpdateInterval = null;
    }
}

// Проверка восстановления топлива с уведомлением
function checkFuelRegeneration() {
    const car = gameData.cars[gameData.currentCar];
    if (!car) return;
    
    const oldFuel = car.fuel;
    const currentFuel = fuelSystem.getCurrentFuel(car);
    
    // Если топливо восстановилось
    if (currentFuel > oldFuel) {
        car.fuel = currentFuel;
        car.lastFuelUpdate = new Date().toISOString();
        
        // Если топливо полное - уведомляем
        if (currentFuel === car.maxFuel) {
            if (window.notify) {
                window.notify('⛽ Топливо полностью восстановлено!', 'success');
            }
        }
        
        updateFuelDisplay();
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

// Экспорт функции очереди для других модулей
window.queueSave = queueSave;