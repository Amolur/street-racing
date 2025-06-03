// modules/profile.js
// Функционал таблицы лидеров с новым UI

import { gameData, gameState } from './game-data.js';
import { showError } from './utils.js';

// Обновление таблицы лидеров
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

// Заглушки для совместимости
export function updateProfileDisplay() {
    // Профиль скрыт в новом дизайне
}

export function updateXPBar() {
    // XP бар скрыт в новом дизайне
}

// Делаем функции доступными глобально
window.updateLeaderboard = updateLeaderboard;
window.updateProfileDisplay = updateProfileDisplay;

// Добавляем стили для таблицы лидеров
const leaderboardStyles = `
    .leaderboard-item {
        display: flex;
        align-items: center;
        gap: var(--ui-spacing);
    }
    
    .leaderboard-item .position {
        font-size: 20px;
        font-weight: 700;
        min-width: 40px;
        text-align: center;
    }
    
    .position.gold {
        color: #FFD700;
    }
    
    .position.silver {
        color: #C0C0C0;
    }
    
    .position.bronze {
        color: #CD7F32;
    }
    
    .leaderboard-item.current-user {
        background: var(--ui-surface-dark);
    }
    
    .loading {
        text-align: center;
        padding: var(--ui-spacing-large);
        color: var(--ui-text-secondary);
    }
    
    .error {
        text-align: center;
        padding: var(--ui-spacing-large);
        color: var(--ui-accent);
    }
    
    .no-data {
        text-align: center;
        padding: var(--ui-spacing-large);
        color: var(--ui-text-secondary);
    }
`;

// Добавляем стили в head
const styleSheet = document.createElement('style');
styleSheet.textContent = leaderboardStyles;
document.head.appendChild(styleSheet);