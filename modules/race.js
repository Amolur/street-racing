// modules/race.js
// Гоночная логика с новым UI

import { gameData, gameState, levelSystem, fuelSystem } from './game-data.js';
import { showError, updatePlayerInfo } from './utils.js';
import { calculateTotalStats, initializeCarUpgrades } from './upgrades.js';
import { showRaceResultScreen, showRaceMenu, showMainMenu } from './navigation.js';
import { createOpponentListItem, createRacePreviewModal, createRaceResult } from './ui-components.js';

// Генерация соперников
export function generateDynamicOpponents() {
    const playerLevel = gameData.level;
    const baseOpponents = [];
    
    const difficulties = ['easy', 'medium', 'hard', 'extreme'];
    const difficultySettings = {
        easy: { 
            diffMult: 0.8, 
            rewardMult: 0.8,
            names: ["Новичок", "Студент", "Таксист", "Курьер"]
        },
        medium: { 
            diffMult: 1.0, 
            rewardMult: 1.0,
            names: ["Гонщик", "Дрифтер", "Стритрейсер", "Спидстер"]
        },
        hard: { 
            diffMult: 1.3, 
            rewardMult: 1.5,
            names: ["Профи", "Мастер", "Чемпион", "Ветеран"]
        },
        extreme: { 
            diffMult: 1.6, 
            rewardMult: 2.0,
            names: ["Легенда", "Призрак", "Босс", "Король"]
        }
    };
    
    const carNames = ["BMW M3", "Subaru WRX", "Mazda RX-7", "Nissan GT-R", "Toyota Supra"];
    
    difficulties.forEach(diff => {
        const settings = difficultySettings[diff];
        const randomName = settings.names[Math.floor(Math.random() * settings.names.length)];
        const randomCar = carNames[Math.floor(Math.random() * carNames.length)];
        
        const baseDifficulty = 0.7 + (playerLevel * 0.02);
        const difficulty = Number((baseDifficulty * settings.diffMult).toFixed(2));
        const baseReward = 200 + (playerLevel * 100);
        const reward = Math.floor(baseReward * settings.rewardMult / 50) * 50;
        
        baseOpponents.push({
            name: randomName,
            car: randomCar,
            difficulty: difficulty,
            reward: reward,
            difficultyClass: diff,
            fuelCost: fuelSystem.calculateFuelCost(difficulty)
        });
    });
    
    return baseOpponents;
}

// Отображение соперников
export function displayOpponents() {
    const opponentsList = document.getElementById('opponents-list');
    if (!opponentsList) return;
    
    const currentCar = gameData.cars[gameData.currentCar];
    const currentFuel = fuelSystem.getCurrentFuel(currentCar);
    
    // Обновляем информацию
    document.getElementById('race-current-car').textContent = currentCar.name;
    document.getElementById('race-car-fuel').textContent = `${currentFuel}/${currentCar.maxFuel || 30}`;
    document.getElementById('race-balance').textContent = gameData.money;
    
    // Генерируем соперников
    const opponents = generateDynamicOpponents();
    
    // Создаем список
    const opponentsHTML = opponents.map((opponent, index) => {
        const betAmount = Math.floor(opponent.reward / 2);
        const canAfford = gameData.money >= betAmount && currentFuel >= opponent.fuelCost;
        
        return createOpponentListItem(opponent, index, canAfford);
    }).join('');
    
    opponentsList.innerHTML = opponentsHTML;
}

// Показать превью гонки
export function showRacePreview(opponentIndex) {
    const opponents = generateDynamicOpponents();
    const opponent = opponents[opponentIndex];
    opponent.index = opponentIndex;
    
    const currentCar = gameData.cars[gameData.currentCar];
    const betAmount = Math.floor(opponent.reward / 2);
    const fuelCost = opponent.fuelCost;
    const currentFuel = fuelSystem.getCurrentFuel(currentCar);
    
    const modal = createRacePreviewModal(opponent, currentCar, betAmount, fuelCost, currentFuel);
    
    // Создаем временный div для модального окна
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = modal;
    document.body.appendChild(modalDiv.firstElementChild);
}

// Закрыть превью гонки
export function closeRacePreview() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// Подтвердить и начать гонку
export function confirmRace(opponentIndex) {
    closeRacePreview();
    setTimeout(() => {
        startRace(opponentIndex);
    }, 100);
}

// Старт гонки
export async function startRace(opponentIndex) {
    const opponents = generateDynamicOpponents();
    const opponent = opponents[opponentIndex];
    const currentCar = gameData.cars[gameData.currentCar];
    
    initializeCarUpgrades(currentCar);
    
    const betAmount = Math.floor(opponent.reward / 2);
    const fuelCost = opponent.fuelCost;
    const currentFuel = fuelSystem.getCurrentFuel(currentCar);
    
    if (gameData.money < betAmount) {
        showError(`Недостаточно денег! Нужно минимум $${betAmount}`);
        return;
    }
    
    if (currentFuel < fuelCost) {
        showError(`Недостаточно топлива! Нужно ${fuelCost}, а у вас ${currentFuel}`);
        return;
    }
    
    // Тратим топливо
    currentCar.fuel = currentFuel - fuelCost;
    currentCar.lastFuelUpdate = new Date().toISOString();
    
    // Получаем характеристики
    const totalStats = calculateTotalStats(currentCar);
    const carPower = (totalStats.power + totalStats.speed + totalStats.handling + totalStats.acceleration) / 4;
    
    // Бонус от навыков
    const skillMultiplier = 1 + (
        gameData.skills.driving * 0.002 +
        gameData.skills.speed * 0.002 +
        gameData.skills.reaction * 0.0015 +
        gameData.skills.technique * 0.0015
    );
    
    let playerEfficiency = carPower * skillMultiplier;
    
    // Проверяем нитро
    if (currentCar.specialParts && currentCar.specialParts.nitro && Math.random() < 0.3) {
        playerEfficiency *= 1.2;
        showError("🚀 Нитро активировано!");
    }
    
    // Эффективность соперника
    const opponentEfficiency = 60 * opponent.difficulty;
    
    // Расчет времени
    const trackBaseTime = 60;
    const playerRandomFactor = 0.95 + Math.random() * 0.1;
    const opponentRandomFactor = 0.95 + Math.random() * 0.1;
    
    const playerTime = trackBaseTime * (100 / playerEfficiency) * playerRandomFactor;
    const opponentTime = trackBaseTime * (100 / opponentEfficiency) * opponentRandomFactor;
    
    const won = playerTime < opponentTime;
    
    // Расчет опыта
    const xpGained = levelSystem.calculateXPGain(won, opponent.difficulty, betAmount);
    gameData.experience = (gameData.experience || 0) + xpGained;
    
    // Обновляем статистику
    gameData.stats.totalRaces++;
    if (won) {
        gameData.stats.wins++;
        gameData.stats.moneyEarned += opponent.reward;
        gameData.money += opponent.reward;
    } else {
        gameData.stats.losses++;
        gameData.stats.moneySpent += betAmount;
        gameData.money -= betAmount;
    }

    // Обновляем прогресс заданий
    if (window.updateTaskProgress) {
        window.updateTaskProgress('totalRaces');
        window.updateTaskProgress('fuelSpent', fuelCost);
        if (won) {
            window.updateTaskProgress('wins');
            window.updateTaskProgress('moneyEarned', opponent.reward);
        }
    }
    
    // Получение навыков
    const gainedSkills = calculateSkillGain(won);
    
    // Проверка повышения уровня
    checkLevelUp();
    
    // Показываем результат
    showRaceResult(won, opponent, playerTime, opponentTime, xpGained);
    
    updatePlayerInfo();
    
    // Сохраняем результат
    try {
        await saveGameData(gameData);
    } catch (error) {
        console.error('Ошибка сохранения результата гонки:', error);
    }
}

// Расчет получения навыков
function calculateSkillGain(isWin) {
    const skillNames = ['driving', 'speed', 'reaction', 'technique'];
    let gainedSkills = [];
    
    const attempts = Math.random() < 0.7 ? 1 : 2;
    const baseChance = isWin ? 0.9 : 0.45;
    
    for (let i = 0; i < attempts; i++) {
        const randomSkill = skillNames[Math.floor(Math.random() * skillNames.length)];
        
        const currentSkillLevel = gameData.skills[randomSkill];
        const chance = baseChance / (1 + currentSkillLevel * 0.01);
        
        if (Math.random() < chance && currentSkillLevel < 10) {
            gameData.skills[randomSkill]++;
            gainedSkills.push(randomSkill);
        }
    }
    
    return gainedSkills;
}

// Проверка повышения уровня
function checkLevelUp() {
    const currentXP = gameData.experience || 0;
    const nextLevelXP = levelSystem.getRequiredXP(gameData.level + 1);
    
    if (currentXP >= nextLevelXP) {
        gameData.level++;
        const reward = levelSystem.getLevelReward(gameData.level);
        gameData.money += reward;
        
        showError(`🎉 Поздравляем! Вы достигли ${gameData.level} уровня! Награда: $${reward}`);
        
        // Проверяем еще раз
        checkLevelUp();
    }
}

// Показать результат гонки
export function showRaceResult(won, opponent, playerTime, opponentTime, xpGained) {
    showRaceResultScreen();
    
    const resultDiv = document.getElementById('race-result');
    if (!resultDiv) return;
    
    const rewards = {
        money: won ? opponent.reward : 0,
        bet: Math.floor(opponent.reward / 2),
        xp: xpGained
    };
    
    resultDiv.innerHTML = createRaceResult(won, opponent, playerTime, opponentTime, rewards);
}

// Делаем функции доступными глобально
window.displayOpponents = displayOpponents;
window.showRacePreview = showRacePreview;
window.closeRacePreview = closeRacePreview;
window.confirmRace = confirmRace;
window.startRace = startRace;