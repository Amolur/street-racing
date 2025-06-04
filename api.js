// API конфигурация
const API_URL = 'https://street-racing-backend-wnse.onrender.com/api';
window.API_URL = API_URL;

// Безопасная работа с localStorage
const storage = {
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

let authToken = storage.getItem('authToken');

// Проверка соединения
function checkConnection() {
    return navigator.onLine;
}

// Показать уведомление об ошибке
function showError(message) {
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

// Базовая функция для API запросов
async function apiRequest(endpoint, options = {}) {
    if (!checkConnection()) {
        showError('Нет соединения с интернетом');
        throw new Error('No internet connection');
    }
    
    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    };
    
    if (authToken) {
        config.headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        
        // Специальная обработка для rate limit
        if (response.status === 429) {
            const data = await response.json();
            throw new Error(data.error || 'Слишком много попыток');
        }
        
        let data;
        
        // Пробуем распарсить JSON
        try {
            data = await response.json();
        } catch (e) {
            // Если не удалось распарсить JSON
            if (!response.ok) {
                throw new Error('Ошибка сервера');
            }
            data = {};
        }
        
        // Если ответ не успешный, выбрасываем ошибку
        if (!response.ok) {
            throw new Error(data.error || 'Ошибка сервера');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        
        // Не показываем техническую ошибку пользователю
        if (error.message.includes('Failed to fetch')) {
            showError('Сервер недоступен. Попробуйте позже.');
        } else if (error.message.includes('Слишком много')) {
            // Уже есть понятное сообщение
            showError(error.message);
        } else if (endpoint.includes('/auth/login') || endpoint.includes('/auth/register')) {
            // Для ошибок авторизации всегда показываем это сообщение
            showError('Неверный логин или пароль');
        } else {
            showError(error.message);
        }
        
        throw error;
    }
}

// Функции авторизации
async function registerAPI(username, password) {
    const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    });
    
    authToken = data.token;
    storage.setItem('authToken', authToken);
    return data;
}

async function loginAPI(username, password) {
    const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    });
    
    authToken = data.token;
    storage.setItem('authToken', authToken);
    return data;
}

function logoutAPI() {
    authToken = null;
    storage.removeItem('authToken');
}

// Игровые функции
async function loadGameData() {
    return await apiRequest('/game/data', { method: 'GET' });
}

async function saveGameData(gameData) {
    console.log('Отправка данных на сервер:', {
        money: gameData.money,
        level: gameData.level,
        carsCount: gameData.cars ? gameData.cars.length : 0,
        hasStats: !!gameData.stats
    });
    
    return await apiRequest('/game/save', {
        method: 'POST',
        body: JSON.stringify({ gameData })
    });
}
// Около строки 98 в api.js
async function saveGameData(gameData) {
    try {
        // Проверяем данные перед отправкой
        if (!gameData || typeof gameData !== 'object') {
            console.error('Неверные данные для сохранения:', gameData);
            return;
        }
        
        // Убедимся, что все числовые поля - числа
        if (gameData.money !== undefined) gameData.money = Number(gameData.money) || 0;
        if (gameData.level !== undefined) gameData.level = Number(gameData.level) || 1;
        if (gameData.experience !== undefined) gameData.experience = Number(gameData.experience) || 0;
        
        return await apiRequest('/game/save', {
            method: 'POST',
            body: JSON.stringify({ gameData })
        });
    } catch (error) {
        console.error('Ошибка сохранения данных:', error);
        throw error;
    }
}

async function getLeaderboard() {
    return await apiRequest('/game/leaderboard', { method: 'GET' });
}

// ================================
// НОВЫЕ ФУНКЦИИ ДЛЯ ДОСТИЖЕНИЙ
// ================================

// Получение достижений
window.getAchievements = async function() {
    try {
        return await apiRequest('/game/achievements', { method: 'GET' });
    } catch (error) {
        console.error('Ошибка получения достижений:', error);
        // Возвращаем пустой массив если ошибка
        return { achievements: [], total: 0 };
    }
};

// Разблокировка одного достижения
window.unlockAchievement = async function(achievementId, name, description) {
    try {
        return await apiRequest('/game/unlock-achievement', {
            method: 'POST',
            body: JSON.stringify({
                achievementId,
                name,
                description
            })
        });
    } catch (error) {
        console.error('Ошибка разблокировки достижения:', error);
        return { success: false, error: error.message };
    }
};

// Массовое разблокирование достижений
window.unlockAchievementsBatch = async function(achievements) {
    try {
        return await apiRequest('/game/unlock-achievements-batch', {
            method: 'POST',
            body: JSON.stringify({
                achievements
            })
        });
    } catch (error) {
        console.error('Ошибка массового разблокирования:', error);
        return { success: false, error: error.message };
    }
};

// Обновление рейтинга игрока
window.updatePlayerRating = async function(ratingChange, reason) {
    try {
        return await apiRequest('/game/update-rating', {
            method: 'POST',
            body: JSON.stringify({
                ratingChange,
                reason
            })
        });
    } catch (error) {
        console.error('Ошибка обновления рейтинга:', error);
        return { success: false, error: error.message };
    }
};

// Получение расширенной статистики профиля
window.getProfileStats = async function() {
    try {
        return await apiRequest('/game/profile-stats', { method: 'GET' });
    } catch (error) {
        console.error('Ошибка получения статистики профиля:', error);
        throw error;
    }
};

// Получение награды за ежедневное задание
window.claimDailyTaskReward = async function(taskId) {
    try {
        return await apiRequest('/game/claim-daily-task', {
            method: 'POST',
            body: JSON.stringify({ taskId })
        });
    } catch (error) {
        console.error('Ошибка получения награды за задание:', error);
        throw error;
    }
};

// Обновление прогресса задания
window.updateTaskProgress = async function(statType, amount = 1) {
    try {
        return await apiRequest('/game/update-task-progress', {
            method: 'POST',
            body: JSON.stringify({ statType, amount })
        });
    } catch (error) {
        console.warn('Ошибка обновления прогресса заданий:', error);
        return { success: false };
    }
};

// Добавление опыта
window.addExperience = async function(amount, source) {
    try {
        return await apiRequest('/game/add-experience', {
            method: 'POST',
            body: JSON.stringify({ amount, source })
        });
    } catch (error) {
        console.error('Ошибка добавления опыта:', error);
        throw error;
    }
};

// Начать гонку
window.startRaceAPI = async function(carIndex, fuelCost, opponentDifficulty, betAmount, won) {
    try {
        return await apiRequest('/game/start-race', {
            method: 'POST',
            body: JSON.stringify({ carIndex, fuelCost, opponentDifficulty, betAmount, won })
        });
    } catch (error) {
        console.error('Ошибка начала гонки:', error);
        throw error;
    }
};

// Получить статус топлива
window.getFuelStatus = async function() {
    try {
        return await apiRequest('/game/fuel-status', { method: 'GET' });
    } catch (error) {
        console.error('Ошибка получения статуса топлива:', error);
        throw error;
    }
};

// Восстановить топливо
window.regenerateFuel = async function() {
    try {
        return await apiRequest('/game/regenerate-fuel', { method: 'POST' });
    } catch (error) {
        console.error('Ошибка восстановления топлива:', error);
        throw error;
    }
};

// Делаем основные функции доступными глобально для совместимости
window.registerAPI = registerAPI;
window.loginAPI = loginAPI;
window.logoutAPI = logoutAPI;
window.loadGameData = loadGameData;
window.saveGameData = saveGameData;
window.getLeaderboard = getLeaderboard;

// Обработчики offline/online
window.addEventListener('online', () => {
    showError('Соединение восстановлено');
});

window.addEventListener('offline', () => {
    showError('Нет соединения с интернетом');
});