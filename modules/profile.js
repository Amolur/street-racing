// modules/profile.js
// Функционал профиля игрока

import { gameData } from './game-data.js';
import { updatePlayerInfo } from './utils.js';

// Получение расширенной статистики с сервера
async function getExtendedStats() {
    try {
        if (typeof window.getProfileStats === 'function') {
            return await window.getProfileStats();
        }
        
        // Если функция недоступна, возвращаем базовую статистику
        return {
            totalPlayTime: 0,
            averageRaceTime: 0,
            winRate: gameData.stats.totalRaces > 0 ? 
                Math.round((gameData.stats.wins / gameData.stats.totalRaces) * 100) : 0,
            longestWinStreak: 0,
            favoriteOpponent: 'Новичок',
            totalDistance: 0,
            perfectRaces: 0
        };
    } catch (error) {
        console.error('Ошибка получения расширенной статистики:', error);
        return {
            totalPlayTime: 0,
            averageRaceTime: 0,
            winRate: 0,
            longestWinStreak: 0,
            favoriteOpponent: 'Новичок',
            totalDistance: 0,
            perfectRaces: 0
        };
    }
}

// Обновление отображения профиля
export async function updateProfileDisplay() {
    // Базовая информация
    const usernameEl = document.getElementById('profile-username');
    const levelEl = document.getElementById('profile-level');
    const experienceEl = document.getElementById('profile-experience');
    const moneyEl = document.getElementById('profile-money');
    
    if (usernameEl && gameData) {
        usernameEl.textContent = gameData.username || 'Игрок';
    }
    
    if (levelEl && gameData) {
        levelEl.textContent = gameData.level || 1;
    }
    
    if (experienceEl && gameData) {
        experienceEl.textContent = gameData.experience || 0;
    }
    
    if (moneyEl && gameData) {
        moneyEl.textContent = `$${gameData.money?.toLocaleString() || '0'}`;
    }
    
    // Основная статистика
    const winsEl = document.getElementById('profile-wins');
    const totalRacesEl = document.getElementById('profile-total-races');
    const moneyEarnedEl = document.getElementById('profile-money-earned');
    const moneySpentEl = document.getElementById('profile-money-spent');
    
    if (winsEl && gameData.stats) {
        winsEl.textContent = gameData.stats.wins || 0;
    }
    
    if (totalRacesEl && gameData.stats) {
        totalRacesEl.textContent = gameData.stats.totalRaces || 0;
    }
    
    if (moneyEarnedEl && gameData.stats) {
        moneyEarnedEl.textContent = `$${gameData.stats.moneyEarned?.toLocaleString() || '0'}`;
    }
    
    if (moneySpentEl && gameData.stats) {
        moneySpentEl.textContent = `$${gameData.stats.moneySpent?.toLocaleString() || '0'}`;
    }
    
    // Загружаем расширенную статистику
    try {
        const extendedStats = await getExtendedStats();
        updateExtendedStats(extendedStats);
    } catch (error) {
        console.error('Не удалось загрузить расширенную статистику:', error);
        window.notifyError('📊 Ошибка загрузки данных');
    }
}

// Обновление расширенной статистики
function updateExtendedStats(stats) {
    const elements = {
        'profile-playtime': formatPlayTime(stats.totalPlayTime),
        'profile-avg-race-time': `${stats.averageRaceTime}с`,
        'profile-win-rate': `${stats.winRate}%`,
        'profile-win-streak': stats.longestWinStreak,
        'profile-favorite-opponent': stats.favoriteOpponent,
        'profile-total-distance': `${stats.totalDistance}км`,
        'profile-perfect-races': stats.perfectRaces
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

// Форматирование времени игры
function formatPlayTime(minutes) {
    if (minutes < 60) {
        return `${minutes}м`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours < 24) {
        return `${hours}ч ${remainingMinutes}м`;
    }
    
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}д ${remainingHours}ч`;
}

// Обновление информации о машинах в профиле
export function updateProfileCars() {
    const carsCountEl = document.getElementById('profile-cars-count');
    const currentCarEl = document.getElementById('profile-current-car');
    
    if (carsCountEl && gameData.cars) {
        carsCountEl.textContent = gameData.cars.length;
    }
    
    if (currentCarEl && gameData.cars && gameData.currentCar !== undefined) {
        const currentCar = gameData.cars[gameData.currentCar];
        currentCarEl.textContent = currentCar ? currentCar.name : 'Нет машины';
    }
}

// Обновление аватара игрока
export function updatePlayerAvatar() {
    const avatars = document.querySelectorAll('.profile-avatar, .player-avatar');
    
    avatars.forEach(avatar => {
        if (gameData.username) {
            // Используем новую цветовую схему для аватаров
            avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(gameData.username)}&background=ff4444&color=ffffff&size=100&bold=true`;
            avatar.alt = gameData.username;
        }
    });
}

// Инициализация экрана профиля
export function initProfileScreen() {
    updateProfileDisplay();
    updateProfileCars();
    updatePlayerAvatar();
    
    // Обновляем достижения если функция доступна
    if (typeof window.updateAchievementsDisplay === 'function') {
        window.updateAchievementsDisplay();
    }
}

// Экспорт функций для глобального доступа
window.updateProfileDisplay = updateProfileDisplay;
window.updateProfileCars = updateProfileCars;
window.updatePlayerAvatar = updatePlayerAvatar;
window.initProfileScreen = initProfileScreen;