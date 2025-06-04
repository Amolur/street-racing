// modules/daily-tasks.js
// Система ежедневных заданий с новым UI

import { gameData, gameState } from './game-data.js';
import { showError, updatePlayerInfo } from './utils.js';

// ИСПРАВЛЕНО: убрал импорт несуществующей функции createTaskCard
// Создаем функцию createTaskCard локально
function createTaskCard(task) {
    const progressPercent = Math.min((task.progress / task.required) * 100, 100);
    const statusClass = task.claimed ? 'claimed' : task.completed ? 'completed' : 'active';
    
    return `
        <div class="card task-card ${statusClass}">
            <div class="card-header">
                <h3 class="card-title">${task.name}</h3>
                <span class="task-reward">$${task.reward}</span>
            </div>
            <div class="card-body">
                <p class="task-description">${task.description}</p>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercent}%"></div>
                </div>
                <p class="progress-text">${task.progress} / ${task.required}</p>
                ${task.completed && !task.claimed ? 
                    `<button class="action-button success" onclick="claimTaskReward('${task.id}')">
                        Получить награду
                    </button>` : 
                    task.claimed ? '<p class="task-status">✓ Получено</p>' : ''
                }
            </div>
        </div>
    `;
}

// Обновление таймера заданий
export function updateDailyTasksTimer() {
    const timerEl = document.getElementById('tasks-timer');
    if (!timerEl || !gameData.dailyTasks || !gameData.dailyTasks.expiresAt) return;
    
    const now = new Date();
    const expiresAt = new Date(gameData.dailyTasks.expiresAt);
    const timeLeft = expiresAt - now;
    
    if (timeLeft <= 0) {
        timerEl.textContent = 'Обновление доступно!';
        return;
    }
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    timerEl.textContent = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Инициализация ежедневных заданий
export function initializeDailyTasks() {
    if (!gameData.dailyTasks) {
        gameData.dailyTasks = {
            tasks: [],
            expiresAt: null,
            completedToday: 0
        };
    }
}

// Проверка и сброс заданий
export function checkAndResetDailyTasks() {
    if (!gameData.dailyTasks || !gameData.dailyTasks.expiresAt) {
        return;
    }
    
    const now = new Date();
    const expiresAt = new Date(gameData.dailyTasks.expiresAt);
    
    if (now >= expiresAt) {
        window.notify('⏰ Задания истекли! Обновите страницу для получения новых.', 'warning');
    }
}

// Обновление прогресса заданий
export function updateTaskProgress(statType, amount = 1) {
    if (!gameData.dailyTasks || !gameData.dailyTasks.tasks) return;
    
    gameData.dailyTasks.tasks.forEach(task => {
        if (task.completed || task.trackStat !== statType) return;
        
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
        
        if (task.progress >= task.required) {
            task.progress = task.required;
            task.completed = true;
            window.notifySuccess(`📋 Задание "${task.name}" выполнено!`);
        }
    });
    
    updateDailyTasksDisplay();
}

// Получение награды за задание
export async function claimTaskReward(taskId) {
    const task = gameData.dailyTasks.tasks.find(t => t.id === taskId);
    
    if (!task) {
        window.notifyError('📋 Задание не найдено!');
        return;
    }
    
    if (!task.completed) {
        window.notifyError('📋 Задание еще не выполнено!');
        return;
    }
    
    if (task.claimed) {
        window.notifyError('📋 Награда уже получена!');
        return;
    }
    
    gameData.money += task.reward;
    task.claimed = true;
    gameData.dailyTasks.completedToday++;
    
    updatePlayerInfo();
    updateDailyTasksDisplay();
    
    window.notifyReward(`🎁 Получено $${task.reward} за задание "${task.name}"!`);
    
    // Бонус за выполнение всех заданий
    if (gameData.dailyTasks.completedToday === 3) {
        const bonus = 1000;
        gameData.money += bonus;
        window.notifyReward(`🌟 Бонус за все задания дня: $${bonus}!`);
    }
    
    // Сохраняем через очередь
    if (window.queueSave) {
        await window.queueSave(gameData, 'normal');
    }
}

// Обновление отображения заданий
export function updateDailyTasksDisplay() {
    const tasksContainer = document.getElementById('daily-tasks-list');
    if (!tasksContainer) return;
    
    if (!gameData.dailyTasks || !gameData.dailyTasks.tasks || gameData.dailyTasks.tasks.length === 0) {
        tasksContainer.innerHTML = '<p class="no-data">Задания загружаются...</p>';
        return;
    }
    
    const tasksHTML = gameData.dailyTasks.tasks.map(task => createTaskCard(task)).join('');
    
    tasksContainer.innerHTML = tasksHTML;
    
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
    updateDailyTasksTimer();
}

// Делаем функции доступными глобально
window.claimTaskReward = claimTaskReward;
window.updateTaskProgress = updateTaskProgress;
window.updateDailyTasksDisplay = updateDailyTasksDisplay;
window.initDailyTasksScreen = initDailyTasksScreen;