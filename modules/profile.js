// modules/profile.js
// Функционал профиля игрока и таблицы лидеров

import { gameData, gameState, levelSystem } from './game-data.js';
import { showError } from './utils.js';
import { checkAllAchievements, getAchievementsStats } from './achievements.js';

// Обновление отображения профиля
export function updateProfileDisplay() {
    if (!gameData || !gameState.currentUser) return;
    
    // Обновляем базовую информацию
    const usernameEl = document.getElementById('profile-username');
    const levelEl = document.getElementById('profile-level');
    const avatarEl = document.getElementById('profile-avatar');
    
    if (usernameEl) usernameEl.textContent = gameState.currentUser.username;
    if (levelEl) levelEl.textContent = gameData.level;
    if (avatarEl) {
        avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(gameState.currentUser.username)}&background=ff4444&color=ffffff&size=160`;
    }
    
    // Обновляем XP
    updateXPBar();
    
    // Обновляем статистику
    updateProfileStats();
    
    // Обновляем навыки
    updateProfileSkills();
    
    // Проверяем достижения
    checkAllAchievements();
    
    // Обновляем счетчик достижений
    updateAchievementsCount();
}

// Обновление XP бара
export function updateXPBar() {
    const currentXP = gameData.experience || 0;
    const currentLevel = gameData.level;
    const nextLevelXP = levelSystem.getRequiredXP(currentLevel + 1);
    const prevLevelXP = currentLevel > 1 ? levelSystem.getRequiredXP(currentLevel) : 0;
    
    const xpInCurrentLevel = currentXP - prevLevelXP;
    const xpNeededForLevel = nextLevelXP - prevLevelXP;
    const progressPercent = Math.min((xpInCurrentLevel / xpNeededForLevel) * 100, 100);
    
    const xpCurrentEl = document.getElementById('profile-xp');
    const xpNextEl = document.getElementById('profile-xp-next');
    const xpFillEl = document.getElementById('profile-xp-fill');
    
    if (xpCurrentEl) xpCurrentEl.textContent = xpInCurrentLevel;
    if (xpNextEl) xpNextEl.textContent = xpNeededForLevel;
    if (xpFillEl) xpFillEl.style.width = `${progressPercent}%`;
}

// Обновление статистики профиля
function updateProfileStats() {
    const statsContainer = document.getElementById('profile-stats');
    if (!statsContainer) return;
    
    // Проверяем наличие gameData и stats
    if (!gameData) {
        statsContainer.innerHTML = '<p class="no-data">Данные недоступны</p>';
        return;
    }
    
    // Убеждаемся, что stats существует
    if (!gameData.stats) {
        gameData.stats = {
            totalRaces: 0,
            wins: 0,
            losses: 0,
            moneyEarned: 0,
            moneySpent: 0
        };
    }
    
    const winRate = gameData.stats.totalRaces > 0 
        ? Math.round((gameData.stats.wins / gameData.stats.totalRaces) * 100)
        : 0;
    
    const stats = [
        { label: 'Побед', value: gameData.stats.wins || 0 },
        { label: 'Гонок', value: gameData.stats.totalRaces || 0 },
        { label: 'Процент побед', value: `${winRate}%` },
        { label: 'Машин', value: gameData.cars ? gameData.cars.length : 1 },
        { label: 'Заработано', value: `$${(gameData.stats.moneyEarned || 0).toLocaleString()}` },
        { label: 'Потрачено', value: `$${(gameData.stats.moneySpent || 0).toLocaleString()}` }
    ];
    
    const statsHTML = stats.map(stat => `
        <div class="profile-stat-item">
            <span class="profile-stat-value">${stat.value}</span>
            <span class="profile-stat-label">${stat.label}</span>
        </div>
    `).join('');
    
    statsContainer.innerHTML = statsHTML;
}

// Обновление навыков
function updateProfileSkills() {
    const skillsContainer = document.getElementById('profile-skills-display');
    if (!skillsContainer) return;
    
    // Проверяем наличие gameData и skills
    if (!gameData || !gameData.skills) {
        if (gameData) {
            gameData.skills = {
                driving: 1,
                speed: 1,
                reaction: 1,
                technique: 1
            };
        } else {
            skillsContainer.innerHTML = '<p class="no-data">Навыки недоступны</p>';
            return;
        }
    }
    
    const skillNames = {
        driving: 'Вождение',
        speed: 'Скорость',
        reaction: 'Реакция',
        technique: 'Техника'
    };
    
    const skillsHTML = Object.keys(skillNames).map(skillKey => {
        const skillLevel = gameData.skills[skillKey] || 1;
        const skillName = skillNames[skillKey];
        
        return `
            <div class="skill-item">
                <span class="skill-name">${skillName}</span>
                <span class="skill-level">${skillLevel}</span>
            </div>
        `;
    }).join('');
    
    skillsContainer.innerHTML = skillsHTML;
}

// Обновление счетчика достижений
function updateAchievementsCount() {
    const stats = getAchievementsStats();
    const countEl = document.getElementById('achievements-count');
    if (countEl) {
        countEl.textContent = stats.unlocked;
    }
}

// Обновление таблицы лидеров (оставляем как было)
export async function updateLeaderboard() {
    try {
        const leaderboardList = document.getElementById('leaderboard-list');
        leaderboardList.innerHTML = '<div class="loading">Загрузка...</div>';
        
        const leaders = await getLeaderboard();
        
        leaderboardList.innerHTML = '';
        
        const leaderboardHTML = leaders.map((player, index) => {
            const isCurrentUser = player.username === gameState.currentUser.username;
            
            let positionClass = '';
            if (player.position === 1) positionClass = 'gold';
            else if (player.position === 2) positionClass = 'silver';
            else if (player.position === 3) positionClass = 'bronze';
            
            return `
                <div class="list-item leaderboard-item ${isCurrentUser ? 'current-user' : ''}">
                    <div class="position ${positionClass}">${player.position}</div>
                    <div class="list-item-content">
                        <div class="list-item-title">${player.username}</div>
                        <div class="list-item-subtitle">
                            Уровень ${player.level} • $${player.money.toLocaleString()}
                        </div>
                    </div>
                    <div class="list-item-action">${player.wins} побед</div>
                </div>
            `;
        }).join('');
        
        leaderboardList.innerHTML = leaderboardHTML || '<p class="no-data">Пока нет данных</p>';
        
    } catch (error) {
        console.error('Ошибка загрузки таблицы лидеров:', error);
        document.getElementById('leaderboard-list').innerHTML = 
            '<p class="error">Ошибка загрузки данных</p>';
    }
}

// Делаем функции доступными глобально
window.updateLeaderboard = updateLeaderboard;
window.updateProfileDisplay = updateProfileDisplay;