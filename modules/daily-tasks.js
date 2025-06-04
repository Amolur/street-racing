// modules/daily-tasks.js
// Система ежедневных заданий с ЗАЩИЩЕННЫМИ наградами

import { gameData, gameState } from './game-data.js';
import { updatePlayerInfo } from './utils.js';
import { createTaskCard } from './ui-components.js';

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

// Обновление прогресса заданий (БЕЗ ИЗМЕНЕНИЯ ДЕНЕГ)
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
            window.notify(`✅ Задание "${task.name}" выполнено!`, 'success');
        }
    });
    
    updateDailyTasksDisplay();
}

// ИСПРАВЛЕННАЯ функция получения награды - ВСЁ ЧЕРЕЗ СЕРВЕР
export async function claimTaskReward(taskId) {
    // Находим задание для проверки
    const task = gameData.dailyTasks.tasks.find(t => t.id === taskId);
    
    if (!task) {
        window.notify('Задание не найдено!', 'error');
        return;
    }
    
    if (!task.completed) {
        window.notify('Задание еще не выполнено!', 'warning');
        return;
    }
    
    if (task.claimed) {
        window.notify('Награда уже получена!', 'info');
        return;
    }
    
    try {
        console.log('🎁 Получение награды через сервер...');
        
        // ЗАЩИТА: ВСЯ ЛОГИКА НАГРАДЫ НА СЕРВЕРЕ
        const response = await fetch(`${window.API_URL}/game/claim-daily-task`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ taskId })
        });
        
        if (!response.ok) {
            const error = await response.json();
            window.notify(error.error || 'Ошибка получения награды', 'error');
            return;
        }
        
        const result = await response.json();
        
        console.log('✅ Награда успешно получена с сервера');
        
        // ВАЖНО: Обновляем данные ТОЛЬКО из ответа сервера
        gameData.money = result.gameData.money;
        gameData.dailyTasks = result.gameData.dailyTasks;
        
        updatePlayerInfo();
        updateDailyTasksDisplay();
        
        // Показываем сообщение с сервера
        window.notify(result.message, 'reward');
        
        // Бонус за выполнение всех заданий (если есть)
        if (result.bonusReward && result.bonusReward > 0) {
            setTimeout(() => {
                window.notify(`🌟 Бонус за все задания дня: $${result.bonusReward}!`, 'reward');
            }, 1000);
        }
        
    } catch (error) {
        console.error('❌ Ошибка получения награды:', error);
        window.notify('❌ Ошибка соединения с сервером! Попробуйте позже.', 'error');
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