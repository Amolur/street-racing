// modules/achievements.js
// Система достижений

import { gameData } from './game-data.js';
import { showError } from './utils.js';

// Список всех достижений
export const allAchievements = [
    // Гоночные достижения
    {
        id: 'first_win',
        name: 'Первая победа',
        description: 'Выиграйте свою первую гонку',
        icon: '🏁',
        category: 'racing',
        condition: () => gameData.stats.wins >= 1,
        progress: () => Math.min(gameData.stats.wins, 1),
        maxProgress: 1
    },
    {
        id: 'speed_demon',
        name: 'Демон скорости',
        description: 'Выиграйте 10 гонок',
        icon: '🔥',
        category: 'racing',
        condition: () => gameData.stats.wins >= 10,
        progress: () => Math.min(gameData.stats.wins, 10),
        maxProgress: 10
    },
    {
        id: 'racing_legend',
        name: 'Легенда гонок',
        description: 'Выиграйте 50 гонок',
        icon: '👑',
        category: 'racing',
        condition: () => gameData.stats.wins >= 50,
        progress: () => Math.min(gameData.stats.wins, 50),
        maxProgress: 50
    },
    {
        id: 'marathon_racer',
        name: 'Марафонец',
        description: 'Проведите 100 гонок',
        icon: '🏃',
        category: 'racing',
        condition: () => gameData.stats.totalRaces >= 100,
        progress: () => Math.min(gameData.stats.totalRaces, 100),
        maxProgress: 100
    },

    // Достижения по деньгам
    {
        id: 'first_thousand',
        name: 'Первая тысяча',
        description: 'Заработайте $10,000',
        icon: '💰',
        category: 'money',
        condition: () => gameData.stats.moneyEarned >= 10000,
        progress: () => Math.min(gameData.stats.moneyEarned, 10000),
        maxProgress: 10000
    },
    {
        id: 'money_maker',
        name: 'Делец',
        description: 'Заработайте $100,000',
        icon: '💎',
        category: 'money',
        condition: () => gameData.stats.moneyEarned >= 100000,
        progress: () => Math.min(gameData.stats.moneyEarned, 100000),
        maxProgress: 100000
    },
    {
        id: 'millionaire',
        name: 'Миллионер',
        description: 'Накопите $1,000,000',
        icon: '🏦',
        category: 'money',
        condition: () => gameData.money >= 1000000,
        progress: () => Math.min(gameData.money, 1000000),
        maxProgress: 1000000
    },

    // Достижения по уровням
    {
        id: 'level_up',
        name: 'Рост',
        description: 'Достигните 5 уровня',
        icon: '⭐',
        category: 'level',
        condition: () => gameData.level >= 5,
        progress: () => Math.min(gameData.level, 5),
        maxProgress: 5
    },
    {
        id: 'experienced',
        name: 'Опытный',
        description: 'Достигните 15 уровня',
        icon: '🌟',
        category: 'level',
        condition: () => gameData.level >= 15,
        progress: () => Math.min(gameData.level, 15),
        maxProgress: 15
    },
    {
        id: 'master',
        name: 'Мастер',
        description: 'Достигните 30 уровня',
        icon: '💫',
        category: 'level',
        condition: () => gameData.level >= 30,
        progress: () => Math.min(gameData.level, 30),
        maxProgress: 30
    },

    // Достижения по машинам
    {
        id: 'car_collector',
        name: 'Коллекционер',
        description: 'Купите 5 машин',
        icon: '🚗',
        category: 'cars',
        condition: () => gameData.cars.length >= 5,
        progress: () => Math.min(gameData.cars.length, 5),
        maxProgress: 5
    },
    {
        id: 'garage_master',
        name: 'Владелец гаража',
        description: 'Купите 10 машин',
        icon: '🏭',
        category: 'cars',
        condition: () => gameData.cars.length >= 10,
        progress: () => Math.min(gameData.cars.length, 10),
        maxProgress: 10
    },

    // Достижения по улучшениям
    {
        id: 'first_upgrade',
        name: 'Первое улучшение',
        description: 'Улучшите любую деталь',
        icon: '🔧',
        category: 'upgrades',
        condition: () => {
            if (!gameData.cars || !gameData.cars[gameData.currentCar]) return false;
            const car = gameData.cars[gameData.currentCar];
            if (!car.upgrades) return false;
            return Object.values(car.upgrades).some(level => level > 0);
        },
        progress: () => {
            if (!gameData.cars || !gameData.cars[gameData.currentCar]) return 0;
            const car = gameData.cars[gameData.currentCar];
            if (!car.upgrades) return 0;
            return Object.values(car.upgrades).some(level => level > 0) ? 1 : 0;
        },
        maxProgress: 1
    },
    // ИСПРАВЛЕНО: добавил недостающие поля для достижения tuning_expert
    {
        id: 'tuning_expert',
        name: 'Эксперт тюнинга',
        description: 'Максимально улучшите одну деталь',
        icon: '⚙️',
        category: 'upgrades',
        condition: () => {
            if (!gameData.cars[gameData.currentCar]?.upgrades) return false;
            return Object.values(gameData.cars[gameData.currentCar].upgrades).some(level => level >= 10);
        },
        progress: () => {
            if (!gameData.cars[gameData.currentCar]?.upgrades) return 0;
            return Math.max(...Object.values(gameData.cars[gameData.currentCar].upgrades));
        },
        maxProgress: 10
    }
];

// Инициализация достижений в gameData
export function initializeAchievements() {
    if (!gameData.achievements) {
        gameData.achievements = [];
    }
}

// Синхронизация достижений с сервером
export async function syncAchievementsWithServer() {
    try {
        if (typeof window.getAchievements !== 'function') {
            console.warn('⚠️ Функция getAchievements недоступна, пропускаем синхронизацию');
            return false;
        }
        
        console.log('🔄 Синхронизация достижений с сервером...');
        const serverAchievements = await window.getAchievements();
        
        // Обновляем локальные данные достижениями с сервера
        gameData.achievements = serverAchievements.achievements || [];
        
        console.log(`✅ Достижения синхронизированы: ${gameData.achievements.length} шт.`);
        
        return true;
    } catch (error) {
        console.error('❌ Ошибка синхронизации достижений:', error);
        return false;
    }
}

// Проверка всех достижений (с сохранением на сервер)
export async function checkAllAchievements() {
    initializeAchievements();
    
    let newAchievements = [];
    
    allAchievements.forEach(achievement => {
        const isUnlocked = gameData.achievements.some(a => a.id === achievement.id);
        
        if (!isUnlocked && achievement.condition()) {
            // Добавляем локально
            gameData.achievements.push({
                id: achievement.id,
                unlockedAt: new Date().toISOString()
            });
            
            newAchievements.push({
                id: achievement.id,
                name: achievement.name,
                description: achievement.description
            });
        }
    });
    
    // Если есть новые достижения - сохраняем на сервер
    if (newAchievements.length > 0) {
        try {
            if (typeof window.unlockAchievementsBatch === 'function') {
                const result = await window.unlockAchievementsBatch(newAchievements);
                
                if (result.success) {
                    // Показываем уведомления о новых достижениях
                    newAchievements.forEach(achievement => {
                        showError(`🏆 Достижение разблокировано: ${achievement.name}!`);
                    });
                    
                    console.log(`✅ ${newAchievements.length} достижений сохранено на сервер`);
                }
            } else {
                console.warn('⚠️ Функция unlockAchievementsBatch недоступна');
                // Показываем уведомления локально
                newAchievements.forEach(achievement => {
                    showError(`🏆 Достижение разблокировано: ${achievement.name}!`);
                });
            }
        } catch (error) {
            console.error('❌ Ошибка сохранения достижений на сервер:', error);
            // Показываем уведомления локально
            newAchievements.forEach(achievement => {
                showError(`🏆 Достижение разблокировано: ${achievement.name}!`);
            });
        }
    }
    
    return newAchievements.length > 0;
}

// Получить статус достижения
export function getAchievementStatus(achievementId) {
    initializeAchievements();
    return gameData.achievements.some(a => a.id === achievementId);
}

// Получить статистику достижений
export function getAchievementsStats() {
    initializeAchievements();
    const unlockedCount = gameData.achievements.length;
    const totalCount = allAchievements.length;
    
    return {
        unlocked: unlockedCount,
        total: totalCount,
        percentage: Math.round((unlockedCount / totalCount) * 100)
    };
}

// Функция для отображения достижений
export function updateAchievementsDisplay() {
    const achievementsList = document.getElementById('achievements-list');
    if (!achievementsList) return;
    
    initializeAchievements();
    
    // Обновляем статистику
    const stats = getAchievementsStats();
    const unlockedEl = document.getElementById('unlocked-achievements');
    const totalEl = document.getElementById('total-achievements');
    const countEl = document.getElementById('achievements-count');
    
    if (unlockedEl) unlockedEl.textContent = stats.unlocked;
    if (totalEl) totalEl.textContent = stats.total;
    if (countEl) countEl.textContent = stats.unlocked;
    
    // Создаем список достижений
    const achievementsHTML = allAchievements.map(achievement => {
        const isUnlocked = getAchievementStatus(achievement.id);
        const progress = achievement.progress();
        const maxProgress = achievement.maxProgress;
        const progressPercent = Math.min((progress / maxProgress) * 100, 100);
        
        return `
            <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-description">${achievement.description}</div>
                    ${!isUnlocked ? `
                        <div class="achievement-progress">
                            Прогресс: ${progress}/${maxProgress}
                        </div>
                        <div class="progress-bar" style="margin-top: 4px; height: 4px;">
                            <div class="progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                    ` : ''}
                </div>
                <div class="achievement-status ${isUnlocked ? 'unlocked' : 'locked'}">
                    ${isUnlocked ? '✓' : `${progress}/${maxProgress}`}
                </div>
            </div>
        `;
    }).join('');
    
    achievementsList.innerHTML = achievementsHTML;
}

// Делаем функции доступными глобально
window.updateAchievementsDisplay = updateAchievementsDisplay;
window.checkAllAchievements = checkAllAchievements;
window.syncAchievementsWithServer = syncAchievementsWithServer;