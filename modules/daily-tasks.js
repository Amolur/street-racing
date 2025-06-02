// modules/daily-tasks.js
// Система ежедневных заданий

import { gameData, gameState } from './game-data.js';
import { showError, updatePlayerInfo } from './utils.js';

// Конфигурация ежедневных заданий
const DAILY_TASKS_CONFIG = [
    {
        id: 'daily_races',
        name: '🏁 Гонщик дня',
        description: 'Проведи 3 гонки',
        required: 3,
        reward: 500,
        trackStat: 'totalRaces'
    },
    {
        id: 'daily_wins',
        name: '🏆 Победитель',
        description: 'Выиграй 2 гонки',
        required: 2,
        reward: 1000,
        trackStat: 'wins'
    },
    {
        id: 'daily_fuel',
        name: '⛽ Экономист',
        description: 'Потрать 15 топлива',
        required: 15,
        reward: 300,
        trackStat: 'fuelSpent'
    },
    {
        id: 'daily_upgrade',
        name: '🔧 Механик',
        description: 'Купи 1 улучшение',
        required: 1,
        reward: 800,
        trackStat: 'upgradesBought'
    },
    {
        id: 'daily_money',
        name: '💰 Богач',
        description: 'Заработай $2000',
        required: 2000,
        reward: 500,
        trackStat: 'moneyEarned'
    }
];

// Инициализация ежедневных заданий в gameData
export function initializeDailyTasks() {
    if (!gameData.dailyTasks) {
        gameData.dailyTasks = {
            tasks: [],
            lastReset: new Date().toDateString(),
            completedToday: 0
        };
    }
    
    // Проверяем, нужен ли сброс заданий
    checkAndResetDailyTasks();
}

// Проверка и сброс заданий в полночь
export function checkAndResetDailyTasks() {
    const today = new Date().toDateString();
    
    if (gameData.dailyTasks.lastReset !== today) {
        // Новый день - генерируем новые задания
        generateDailyTasks();
        gameData.dailyTasks.lastReset = today;
        gameData.dailyTasks.completedToday = 0;
        
        // Сбрасываем счетчики для отслеживания
        if (!gameData.dailyStats) {
            gameData.dailyStats = {};
        }
        gameData.dailyStats.totalRaces = gameData.stats.totalRaces;
        gameData.dailyStats.wins = gameData.stats.wins;
        gameData.dailyStats.fuelSpent = 0;
        gameData.dailyStats.upgradesBought = 0;
        gameData.dailyStats.moneyEarned = gameData.stats.moneyEarned;
        
        showError('🌅 Новый день! Доступны новые задания!');
    }
}

// Генерация случайных заданий на день
function generateDailyTasks() {
    // Перемешиваем задания и выбираем 3
    const shuffled = [...DAILY_TASKS_CONFIG].sort(() => Math.random() - 0.5);
    const selectedTasks = shuffled.slice(0, 3);
    
    gameData.dailyTasks.tasks = selectedTasks.map(config => ({
        ...config,
        progress: 0,
        completed: false,
        claimed: false
    }));
}

// Обновление прогресса заданий
export function updateTaskProgress(statType, amount = 1) {
    if (!gameData.dailyTasks || !gameData.dailyTasks.tasks) return;
    
    gameData.dailyTasks.tasks.forEach(task => {
        if (task.completed || task.trackStat !== statType) return;
        
        // Обновляем прогресс в зависимости от типа
        switch (statType) {
            case 'totalRaces':
                task.progress = gameData.stats.totalRaces - (gameData.dailyStats.totalRaces || 0);
                break;
            case 'wins':
                task.progress = gameData.stats.wins - (gameData.dailyStats.wins || 0);
                break;
            case 'fuelSpent':
                gameData.dailyStats.fuelSpent = (gameData.dailyStats.fuelSpent || 0) + amount;
                task.progress = gameData.dailyStats.fuelSpent;
                break;
            case 'upgradesBought':
                gameData.dailyStats.upgradesBought = (gameData.dailyStats.upgradesBought || 0) + amount;
                task.progress = gameData.dailyStats.upgradesBought;
                break;
            case 'moneyEarned':
                task.progress = gameData.stats.moneyEarned - (gameData.dailyStats.moneyEarned || 0);
                break;
        }
        
        // Проверяем выполнение
        if (task.progress >= task.required) {
            task.progress = task.required;
            task.completed = true;
            showError(`✅ Задание "${task.name}" выполнено!`);
        }
    });
}

// Получение награды за задание
export async function claimTaskReward(taskId) {
    const task = gameData.dailyTasks.tasks.find(t => t.id === taskId);
    
    if (!task) {
        showError('Задание не найдено!');
        return;
    }
    
    if (!task.completed) {
        showError('Задание еще не выполнено!');
        return;
    }
    
    if (task.claimed) {
        showError('Награда уже получена!');
        return;
    }
    
    // Даем награду
    gameData.money += task.reward;
    task.claimed = true;
    gameData.dailyTasks.completedToday++;
    
    updatePlayerInfo();
    updateDailyTasksDisplay();
    
    showError(`🎁 Получено $${task.reward} за задание "${task.name}"!`);
    
    // Бонус за выполнение всех заданий
    if (gameData.dailyTasks.completedToday === 3) {
        const bonus = 1000;
        gameData.money += bonus;
        showError(`🌟 Бонус за все задания дня: $${bonus}!`);
    }
    
    // Сохраняем
    try {
        await saveGameData(gameData);
    } catch (error) {
        console.error('Ошибка сохранения:', error);
    }
}

// Обновление отображения заданий
export function updateDailyTasksDisplay() {
    const tasksContainer = document.getElementById('daily-tasks-list');
    if (!tasksContainer) return;
    
    const tasksHTML = gameData.dailyTasks.tasks.map(task => {
        const progressPercent = Math.min((task.progress / task.required) * 100, 100);
        const statusClass = task.claimed ? 'claimed' : task.completed ? 'completed' : 'active';
        
        return `
            <div class="daily-task-card ${statusClass}">
                <div class="task-header">
                    <span class="task-name">${task.name}</span>
                    <span class="task-reward">$${task.reward}</span>
                </div>
                <div class="task-description">${task.description}</div>
                <div class="task-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                    <span class="progress-text">${task.progress} / ${task.required}</span>
                </div>
                ${task.completed && !task.claimed ? 
                    `<button class="btn-claim" onclick="claimTaskReward('${task.id}')">Получить награду</button>` : 
                    task.claimed ? '<span class="task-claimed">✅ Получено</span>' : ''
                }
            </div>
        `;
    }).join('');
    
    tasksContainer.innerHTML = tasksHTML || '<p class="no-tasks">Задания загружаются...</p>';
    
    // Обновляем счетчик
    const taskCounter = document.getElementById('daily-tasks-counter');
    if (taskCounter) {
        const activeTasks = gameData.dailyTasks.tasks.filter(t => t.completed && !t.claimed).length;
        if (activeTasks > 0) {
            taskCounter.style.display = 'block';
            taskCounter.textContent = activeTasks;
        } else {
            taskCounter.style.display = 'none';
        }
    }
}

// Функция для отображения экрана заданий
export function initDailyTasksScreen() {
    checkAndResetDailyTasks();
    updateDailyTasksDisplay();
}

// Делаем функции доступными глобально
window.claimTaskReward = claimTaskReward;
window.showDailyTasksScreen = initDailyTasksScreen;
window.initDailyTasksScreen = initDailyTasksScreen; // ← Добавьте эту строку
window.updateTaskProgress = updateTaskProgress;
window.updateDailyTasksDisplay = updateDailyTasksDisplay;
window.checkAndResetDailyTasks = checkAndResetDailyTasks;