// modules/daily-tasks.js
// Система ежедневных заданий

import { gameData, gameState } from './game-data.js';
import { showError, updatePlayerInfo } from './utils.js';

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

// Инициализация ежедневных заданий в gameData
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
        return; // Не сбрасываем на фронтенде, пусть сервер управляет
    }
    
    const now = new Date();
    const expiresAt = new Date(gameData.dailyTasks.expiresAt);
    
    // Проверяем только истечение времени, не сбрасываем сами
    if (now >= expiresAt) {
        showError('⏰ Задания истекли! Обновите страницу для получения новых.');
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
    
    if (!gameData.dailyTasks || !gameData.dailyTasks.tasks || gameData.dailyTasks.tasks.length === 0) {
        tasksContainer.innerHTML = '<p class="no-tasks">Задания загружаются...</p>';
        return;
    }
    
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
    
    // Обновляем счетчик выполненных
    const completedEl = document.getElementById('tasks-completed');
    if (completedEl && gameData.dailyTasks) {
        const completed = gameData.dailyTasks.tasks.filter(t => t.claimed).length;
        completedEl.textContent = `${completed}/3`;
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