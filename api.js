// API конфигурация
const API_URL = 'https://street-racing-backend-wnse.onrender.com/api';

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

javascript// Базовая функция для API запросов
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
    return await apiRequest('/game/save', {
        method: 'POST',
        body: JSON.stringify({ gameData })
    });
}

async function getLeaderboard() {
    return await apiRequest('/game/leaderboard', { method: 'GET' });
}

// Обработчики offline/online
window.addEventListener('online', () => {
    showError('Соединение восстановлено');
});

window.addEventListener('offline', () => {
    showError('Нет соединения с интернетом');
});