// modules/auth.js
// Функции авторизации

import { gameState, gameData, updateGameData } from './game-data.js';
import { showLoading, storage, updatePlayerInfo, startAutoSave, stopAutoSave, startFuelUpdates, stopFuelUpdates, startInfoBarUpdates, showError } from './utils.js';
import { showAuthScreen, showGame, showMainMenu } from './navigation.js';
import { initializeDailyTasks } from './daily-tasks.js';

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
        showLoading(true);
        const data = await registerAPI(username, password);
        gameState.currentUser = { username: data.user.username };
        updateGameData(data.user.gameData);
        
        if (!gameData.experience) gameData.experience = 0;
        
        if (gameData.cars) {
            gameData.cars.forEach(car => initializeCarUpgrades(car));
        }
        
        showLoading(false);
        return true;
    } catch (error) {
        showLoading(false);
        return false;
    }
}

// Вход
export async function login(username, password) {
    try {
        showLoading(true);
        const data = await loginAPI(username, password);
        gameState.currentUser = { username: data.user.username };
        updateGameData(data.user.gameData);
        
        if (!gameData.experience) gameData.experience = 0;
        
        console.log('Загруженные данные с сервера:', gameData);
        
        if (gameData.cars) {
            gameData.cars.forEach(car => {
                console.log('Машина до инициализации:', car);
                initializeCarUpgrades(car);
                console.log('Машина после инициализации:', car);
            });
        }
        
        showLoading(false);
        return true;
    } catch (error) {
        showLoading(false);
        return false;
    }
}

// Выход
export function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        stopAutoSave();
        stopFuelUpdates();
        logoutAPI();
        gameState.currentUser = null;
        showAuthScreen();
    }
}

// Проверка авторизации
export async function checkAuth() {
    const token = storage.getItem('authToken');
    if (!token) return false;
    
    try {
        showLoading(true);
        const data = await loadGameData();
        gameState.currentUser = { username: data.username };
        updateGameData(data.gameData);
        
        if (!gameData.experience) gameData.experience = 0;
        
        if (gameData.cars) {
            gameData.cars.forEach(car => initializeCarUpgrades(car));
        }
        
        showLoading(false);
        return true;
    } catch (error) {
        showLoading(false);
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
        console.log('Login failed');
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
        console.log('Registration failed');
    }
}

// Показать форму входа
export function showLoginForm() {
    document.getElementById('login-form').classList.add('active');
    document.getElementById('register-form').classList.remove('active');
}

// Показать форму регистрации
export function showRegisterForm() {
    document.getElementById('register-form').classList.add('active');
    document.getElementById('login-form').classList.remove('active');
}

// Функция для показа игры после входа
export function showGameFunc() {
    showGame();
    
    // Обновляем аватары
    const avatars = document.querySelectorAll('.player-avatar, .profile-avatar');
    avatars.forEach(avatar => {
        if (gameState.currentUser) {
            avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(gameState.currentUser.username)}&background=4ecdc4&color=1a1a1a&size=100`;
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