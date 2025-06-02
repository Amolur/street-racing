// modules/profile.js
// Функционал профиля и таблицы лидеров

import { gameData, gameState, levelSystem } from './game-data.js';
import { showError } from './utils.js';

// Обновление отображения профиля
export function updateProfileDisplay() {
    // Обновление имени пользователя
    const profileUsername = document.getElementById('profile-username');
    if (profileUsername && gameState.currentUser) {
        profileUsername.textContent = gameState.currentUser.username;
    }
    
    const profileLevel = document.getElementById('profile-level');
    if (profileLevel) {
        profileLevel.textContent = gameData.level;
    }
    
    // Обновление опыта
    const currentXP = gameData.experience || 0;
    const requiredXP = levelSystem.getRequiredXP(gameData.level);
    const nextLevelXP = levelSystem.getRequiredXP(gameData.level + 1);
    const progressXP = currentXP - requiredXP;
    const neededXP = nextLevelXP - requiredXP;
    const xpPercent = Math.floor((progressXP / neededXP) * 100);
    
    // Обновляем текст опыта
    const profileXP = document.getElementById('profile-xp');
    const profileXPNext = document.getElementById('profile-xp-next');
    const profileXPFill = document.getElementById('profile-xp-fill');
    
    if (profileXP) profileXP.textContent = currentXP;
    if (profileXPNext) profileXPNext.textContent = nextLevelXP;
    if (profileXPFill) profileXPFill.style.width = xpPercent + '%';
    
    // Обновляем быструю статистику
    const profileWins = document.getElementById('profile-wins');
    const profileCars = document.getElementById('profile-cars');
    const profileRating = document.getElementById('profile-rating');
    
    if (profileWins) profileWins.textContent = gameData.stats.wins;
    if (profileCars) profileCars.textContent = gameData.cars.length;
    if (profileRating) profileRating.textContent = '#—';
    
    // Навыки
    const profileSkillsDisplay = document.getElementById('profile-skills-display');
    if (profileSkillsDisplay) {
        profileSkillsDisplay.innerHTML = `
            <div class="skill-item">
                <span class="skill-name">Вождение</span>
                <div class="skill-bar">
                    <div class="skill-progress" style="width: ${gameData.skills.driving * 10}%"></div>
                </div>
                <span class="skill-level">${gameData.skills.driving}</span>
            </div>
            <div class="skill-item">
                <span class="skill-name">Скорость</span>
                <div class="skill-bar">
                    <div class="skill-progress" style="width: ${gameData.skills.speed * 10}%"></div>
                </div>
                <span class="skill-level">${gameData.skills.speed}</span>
            </div>
            <div class="skill-item">
                <span class="skill-name">Реакция</span>
                <div class="skill-bar">
                    <div class="skill-progress" style="width: ${gameData.skills.reaction * 10}%"></div>
                </div>
                <span class="skill-level">${gameData.skills.reaction}</span>
            </div>
            <div class="skill-item">
                <span class="skill-name">Техника</span>
                <div class="skill-bar">
                    <div class="skill-progress" style="width: ${gameData.skills.technique * 10}%"></div>
                </div>
                <span class="skill-level">${gameData.skills.technique}</span>
            </div>
        `;
    }
    
    // Статистика
    const profileStats = document.getElementById('profile-stats');
    if (profileStats) {
        const winRate = gameData.stats.totalRaces > 0 
            ? ((gameData.stats.wins / gameData.stats.totalRaces) * 100).toFixed(1) 
            : 0;
            
        profileStats.innerHTML = `
            <div class="stat-row">
                <span class="stat-label">Всего гонок:</span>
                <span class="stat-value">${gameData.stats.totalRaces}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Побед:</span>
                <span class="stat-value">${gameData.stats.wins}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Поражений:</span>
                <span class="stat-value">${gameData.stats.losses}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Процент побед:</span>
                <span class="stat-value">${winRate}%</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Заработано:</span>
                <span class="stat-value">$${gameData.stats.moneyEarned}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Потрачено:</span>
                <span class="stat-value">$${gameData.stats.moneySpent}</span>
            </div>
        `;
    }
    
    // Обновляем аватар
    const profileAvatar = document.querySelector('.profile-avatar');
    if (profileAvatar && gameState.currentUser) {
        profileAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(gameState.currentUser.username)}&background=4ecdc4&color=1a1a1a&size=100`;
    }
}

// Обновление таблицы лидеров
export async function updateLeaderboard() {
    try {
        const leaderboardList = document.getElementById('leaderboard-list');
        leaderboardList.innerHTML = '<div class="loading">Загрузка...</div>';
        
        const leaders = await getLeaderboard();
        
        leaderboardList.innerHTML = '';
        
        leaders.forEach((player, index) => {
            const isCurrentUser = player.username === gameState.currentUser.username;
            const row = document.createElement('div');
            row.className = `leaderboard-row ${isCurrentUser ? 'current-user' : ''}`;
            
            let positionClass = '';
            if (player.position === 1) positionClass = 'gold';
            else if (player.position === 2) positionClass = 'silver';
            else if (player.position === 3) positionClass = 'bronze';
            
            row.innerHTML = `
                <span class="lb-position ${positionClass}">${player.position}</span>
                <span class="lb-name">${player.username}</span>
                <span class="lb-level">Ур. ${player.level}</span>
                <span class="lb-money">$${player.money.toLocaleString()}</span>
            `;
            
            leaderboardList.appendChild(row);
        });
        
        if (leaders.length === 0) {
            leaderboardList.innerHTML = '<div class="no-data">Пока нет данных</div>';
        }
    } catch (error) {
        console.error('Ошибка загрузки таблицы лидеров:', error);
        document.getElementById('leaderboard-list').innerHTML = 
            '<div class="error">Ошибка загрузки данных</div>';
    }
}

// Обновление полоски опыта
export function updateXPBar() {
    const currentXP = gameData.experience || 0;
    const currentLevelXP = levelSystem.getRequiredXP(gameData.level);
    const nextLevelXP = levelSystem.getRequiredXP(gameData.level + 1);
    const progressXP = currentXP - currentLevelXP;
    const neededXP = nextLevelXP - currentLevelXP;
    const xpPercent = Math.floor((progressXP / neededXP) * 100);
    
    // Обновляем полоску в профиле
    const profileXPFill = document.getElementById('profile-xp-fill');
    if (profileXPFill) {
        profileXPFill.style.width = xpPercent + '%';
    }
    
    // Обновляем текст в профиле
    const profileXP = document.getElementById('profile-xp');
    const profileXPNext = document.getElementById('profile-xp-next');
    if (profileXP) profileXP.textContent = currentXP;
    if (profileXPNext) profileXPNext.textContent = nextLevelXP;
}

// Делаем функции доступными глобально
window.updateProfileDisplay = updateProfileDisplay;
window.updateLeaderboard = updateLeaderboard;