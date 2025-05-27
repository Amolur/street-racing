// API конфигурация
const API_URL = 'https://street-racing-backend-xxx.onrender.com/api'; // Измените на ваш сервер
let authToken = localStorage.getItem('authToken');

// Базовая функция для API запросов
async function apiRequest(endpoint, options = {}) {
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
        
        // Проверяем, что получили JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Сервер вернул не JSON ответ");
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Ошибка сервера');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
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
    localStorage.setItem('authToken', authToken);
    return data;
}

async function loginAPI(username, password) {
    const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    });
    
    authToken = data.token;
    localStorage.setItem('authToken', authToken);
    return data;
}

function logoutAPI() {
    authToken = null;
    localStorage.removeItem('authToken');
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
