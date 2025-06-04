// modules/auth.js
// Функции авторизации

import { gameState, gameData, updateGameData } from './game-data.js';
import { storage, updatePlayerInfo, startAutoSave, stopAutoSave, startFuelUpdates, stopFuelUpdates, startInfoBarUpdates, showError } from './utils.js';
import { showAuthScreen, showGame, showMainMenu } from './navigation.js';

// Инициализация улучшений для машины
function initializeCarUpgrades(car) {
    if (!car.upgrades) {
        car.upgrades = {
            engine: 0,
            turbo: 0,
            tires: 0,
            suspension: 0,
            transmission: 0
        };
    }
    
    if (!car.specialParts) {
        car.specialParts = {
            nitro: false,
            bodyKit: false,
            ecuTune: false,
            fuelTank: false
        };
    }
    
    if (car.fuel === undefined) {
        car.fuel = 30;
    }
    if (car.maxFuel === undefined) {
        car.maxFuel = car.specialParts.fuelTank ? 40 : 30;
    }
    if (!car.lastFuelUpdate) {
        car.lastFuelUpdate = new Date().toISOString();
    }
    
    return car;
}

// Регистрация
export async function register(username, password) {
    try {
        console.log('📝 Регистрация пользователя...');
        const data = await window.registerAPI(username, password);
        gameState.currentUser = { username: data.user.username };
        gameState.currentUserId = data.user.id;
        updateGameData(data.user.gameData);
        
        if (!gameData.experience) gameData.experience = 0;
        
        if (gameData.cars) {
            gameData.cars.forEach(car => initializeCarUpgrades(car));
        }
        
        // Синхронизируем достижения с сервером (безопасно)
        try {
            if (typeof window.syncAchievementsWithServer === 'function') {
                await window.syncAchievementsWithServer();
            }
        } catch (error) {
            console.warn('⚠️ Ошибка синхронизации достижений при регистрации:', error.message);
        }
        
        console.log('✅ Регистрация завершена');
        return true;
    } catch (error) {
        console.error('❌ Ошибка регистрации:', error);
        return false;
    }
}

// Вход
export async function login(username, password) {
    try {
        console.log('🔐 Вход в систему...');
        const data = await window.loginAPI(username, password);
        gameState.currentUser = { username: data.user.username };
        gameState.currentUserId = data.user.id;
        updateGameData(data.user.gameData);
        
        if (!gameData.experience) gameData.experience = 0;
        
        console.log('📦 Загруженные данные с сервера:', gameData);
        
        if (gameData.cars) {
            gameData.cars.forEach(car => {
                console.log('🚗 Машина до инициализации:', car);
                initializeCarUpgrades(car);
                console.log('🚗 Машина после инициализации:', car);
            });
        }
        
        // Синхронизируем достижения с сервером (безопасно)
        try {
            if (typeof window.syncAchievementsWithServer === 'function') {
                await window.syncAchievementsWithServer();
            }
        } catch (error) {
            console.warn('⚠️ Ошибка синхронизации достижений при входе:', error.message);
        }
        
        console.log('✅ Вход выполнен успешно');
        return true;
    } catch (error) {
        console.error('❌ Ошибка входа:', error);
        return false;
    }
}

// Выход
export function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        stopAutoSave();
        stopFuelUpdates();
        window.logoutAPI();
        gameState.currentUser = null;
        showAuthScreen();
    }
}

// Проверка авторизации
export async function checkAuth() {
    const token = storage.getItem('authToken');
    if (!token) {
        console.log('🔑 Токен отсутствует');
        return false;
    }
    
    try {
        console.log('🔍 Проверка авторизации...');
        const data = await window.loadGameData();
        gameState.currentUser = { username: data.username };
        gameState.currentUserId = data.userId;
        updateGameData(data.gameData);
        
        if (!gameData.experience) gameData.experience = 0;
        
        if (gameData.cars) {
            gameData.cars.forEach(car => initializeCarUpgrades(car));
        }
        
        // Синхронизируем достижения с сервером (безопасно)
        try {
            if (typeof window.syncAchievementsWithServer === 'function') {
                await window.syncAchievementsWithServer();
            }
        } catch (error) {
            console.warn('⚠️ Ошибка синхронизации достижений при проверке авторизации:', error.message);
        }
        
        console.log('✅ Авторизация подтверждена');
        return true;
    } catch (error) {
        console.error('❌ Ошибка проверки авторизации:', error);
        storage.removeItem('authToken');
        return false;
    }
}

// Обработчики форм
export async function handleLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!username || !password) {
        showError('Введите логин и пароль');
        return;
    }
    
    try {
        const success = await login(username, password);
        if (success) {
            showGameFunc();
        }
    } catch (error) {
        console.log('❌ Вход не удался');
    }
}

export async function handleRegister() {
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;
    
    if (!username || !password) {
        showError('Введите логин и пароль');
        return;
    }
    
    if (username.length < 3) {
        showError('Логин должен быть не менее 3 символов');
        return;
    }
    
    if (password.length < 6) {
        showError('Пароль должен быть не менее 6 символов');
        return;
    }
    
    if (password !== passwordConfirm) {
        showError('Пароли не совпадают!');
        return;
    }
    
    try {
        const success = await register(username, password);
        if (success) {
            showGameFunc();
        }
    } catch (error) {
        console.log('❌ Регистрация не удалась');
    }
}

// Показать форму входа
export function showLoginForm() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) loginForm.classList.add('active');
    if (registerForm) registerForm.classList.remove('active');
}

// Показать форму регистрации
export function showRegisterForm() {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    
    if (registerForm) registerForm.classList.add('active');
    if (loginForm) loginForm.classList.remove('active');
}

// ИСПРАВЛЕНО: убрал дублирование функции showGameFunc
export function showGameFunc() {
    showGame();
    
    // Обновляем аватары с новой цветовой схемой
    const avatars = document.querySelectorAll('.player-avatar, .profile-avatar');
    avatars.forEach(avatar => {
        if (gameState.currentUser) {
            avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(gameState.currentUser.username)}&background=ff4444&color=ffffff&size=100`;
        }
    });
    
    updatePlayerInfo();
    
    // Запускаем автосохранение
    startAutoSave();
    
    // Запускаем обновление топлива
    startFuelUpdates();
    
    // Запускаем обновление информационной панели
    startInfoBarUpdates();
    
    // Обновляем счетчик заданий
    if (window.updateDailyTasksDisplay) {
        window.updateDailyTasksDisplay();
    }
    
    gameState.navigationHistory = [];
    gameState.currentScreen = 'main-menu';
    showMainMenu(false);
}

// Экспортируем showGameFunc
window.showGameFunc = showGameFunc;