// modules/race.js
// Гоночная логика

import { gameData, levelSystem, fuelSystem } from './game-data.js';
import { showError, updatePlayerInfo } from './utils.js';
import { calculateTotalStats, initializeCarUpgrades } from './upgrades.js';
import { showRaceResultScreen, showRaceMenu, showMainMenu } from './navigation.js';

// Функция для генерации динамических соперников
export function generateDynamicOpponents() {
    const playerLevel = gameData.level;
    const baseOpponents = [];
    
    // Генерируем 4 соперника разной сложности
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
    
    const surnames = ["Иван", "Петр", "Алексей", "Максим", "Артем", "Денис", "Виктор", "Сергей"];
    
    difficulties.forEach(diff => {
        const settings = difficultySettings[diff];
        const randomName = settings.names[Math.floor(Math.random() * settings.names.length)];
        const randomSurname = surnames[Math.floor(Math.random() * surnames.length)];
        
        // Выбираем подходящую машину для соперника
        const maxCarPrice = 5000 + (playerLevel * 5000);
        const availableCars = allCars.filter(car => car.price <= maxCarPrice && car.price > 0);
        const randomCar = availableCars[Math.floor(Math.random() * availableCars.length)] || allCars[1];
        
        // Расчет сложности и награды
        const baseDifficulty = 0.7 + (playerLevel * 0.02);
        const difficulty = Number((baseDifficulty * settings.diffMult).toFixed(2));
        const baseReward = 200 + (playerLevel * 100);
        const reward = Math.floor(baseReward * settings.rewardMult / 50) * 50;
        
        baseOpponents.push({
            name: `${randomName} ${randomSurname}`,
            car: randomCar.name,
            difficulty: difficulty,
            reward: reward
        });
    });
    
    return baseOpponents;
}

// Отображение списка соперников
export function displayOpponents() {
    const opponentsList = document.getElementById('opponents-list');
    if (!opponentsList) return;
    
    // Добавляем информацию о топливе
    const currentCar = gameData.cars[gameData.currentCar];
    const currentFuel = fuelSystem.getCurrentFuel(currentCar);
    
    // Обновляем баннер с топливом
    const raceInfoBanner = document.querySelector('.race-info-banner');
    if (raceInfoBanner) {
        raceInfoBanner.innerHTML = `
            <p>Ваша машина: <strong id="race-current-car">${currentCar.name}</strong></p>
            <p>Топливо: <strong id="race-car-fuel">⛽ ${currentFuel}/${currentCar.maxFuel || 30}</strong></p>
            <p>Баланс: <strong>$<span id="race-balance">${gameData.money}</span></strong></p>
        `;
    }
    
    opponentsList.innerHTML = '';
    
    // Генерируем динамических соперников
    const opponents = generateDynamicOpponents();
    
    opponents.forEach((opponent, index) => {
        const betAmount = Math.floor(opponent.reward / 2);
        const fuelCost = fuelSystem.calculateFuelCost(opponent.difficulty);
        const canAfford = gameData.money >= betAmount && currentFuel >= fuelCost;
        
        const opponentCard = document.createElement('div');
        opponentCard.className = 'opponent-card';
        opponentCard.style.opacity = canAfford ? '1' : '0.5';
        
        // Добавляем цветовую индикацию сложности
        let difficultyColor = '';
        if (opponent.difficulty < 1.0) difficultyColor = 'easy';
        else if (opponent.difficulty < 1.4) difficultyColor = 'medium';
        else if (opponent.difficulty < 1.8) difficultyColor = 'hard';
        else difficultyColor = 'extreme';
        
        opponentCard.innerHTML = `
            <div class="opponent-info">
                <h3>${opponent.name}</h3>
                <p class="opponent-car">Машина: ${opponent.car}</p>
                <p class="opponent-difficulty ${difficultyColor}">
                    Сложность: ${opponent.difficulty < 1.0 ? '⭐' : 
                                opponent.difficulty < 1.4 ? '⭐⭐' :
                                opponent.difficulty < 1.8 ? '⭐⭐⭐' : '⭐⭐⭐⭐'}
                </p>
                <div class="opponent-stakes">
                    <span class="stake-item">
                        <span class="stake-label">Ставка:</span>
                        <span class="stake-value">${betAmount}</span>
                    </span>
                    <span class="stake-item">
                        <span class="stake-label">Выигрыш:</span>
                        <span class="stake-value">${opponent.reward}</span>
                    </span>
                    <span class="stake-item">
                        <span class="stake-label">Топливо:</span>
                        <span class="stake-value fuel-cost">⛽ ${fuelCost}</span>
                    </span>
                </div>
            </div>
            <button class="btn-primary race-btn" onclick="showRacePreview(${index}); return false;" 
                    ${!canAfford ? 'disabled' : ''}>
                ${gameData.money < betAmount ? `Нужно ${betAmount}` : 
                  currentFuel < fuelCost ? `Нужно ⛽${fuelCost}` : 'Вызвать на гонку'}
            </button>
        `;
        opponentsList.appendChild(opponentCard);
    });
}

// Показать превью гонки
export function showRacePreview(opponentIndex) {
    const opponents = generateDynamicOpponents();
    const opponent = opponents[opponentIndex];
    const currentCar = gameData.cars[gameData.currentCar];
    const betAmount = Math.floor(opponent.reward / 2);
    const fuelCost = fuelSystem.calculateFuelCost(opponent.difficulty);
    const currentFuel = fuelSystem.getCurrentFuel(currentCar);
    
    const modal = document.createElement('div');
    modal.className = 'race-preview-modal';
    modal.onclick = function(e) {
        if (e.target === modal) closeRacePreview();
    };
    
    modal.innerHTML = `
        <div class="race-preview-content">
            <button class="close-modal" onclick="closeRacePreview()">×</button>
            <h2>Вызов на гонку</h2>
            
            <div class="race-comparison">
                <div class="racer-info player">
                    <h3>${gameState.currentUser.username}</h3>
                    <div class="car-info">
                        <div class="car-image">🚗</div>
                        <h4>${currentCar.name}</h4>
                        <p class="fuel-status">⛽ ${currentFuel}/${currentCar.maxFuel || 30}</p>
                    </div>
                    
                    <div class="stats-section">
                        <h5>Характеристики</h5>
                        <div class="stat-comparison">
                            <span>Мощность</span>
                            <div class="stat-bar-comparison">
                                <div class="stat-fill" style="width: ${currentCar.power}%"></div>
                            </div>
                            <span class="stat-number">${currentCar.power}</span>
                        </div>
                        <div class="stat-comparison">
                            <span>Скорость</span>
                            <div class="stat-bar-comparison">
                                <div class="stat-fill" style="width: ${currentCar.speed}%"></div>
                            </div>
                            <span class="stat-number">${currentCar.speed}</span>
                        </div>
                    </div>
                </div>
                
                <div class="vs-divider">
                    <div class="vs-circle">VS</div>
                    <div class="race-info">
                        <p>Ставка: <strong>${betAmount}</strong></p>
                        <p>Выигрыш: <strong>${opponent.reward}</strong></p>
                        <p>Расход топлива: <strong>⛽ ${fuelCost}</strong></p>
                    </div>
                </div>
                
                <div class="racer-info opponent">
                    <h3>${opponent.name}</h3>
                    <div class="car-info">
                        <div class="car-image">🏎️</div>
                        <h4>${opponent.car}</h4>
                    </div>
                    
                    <div class="stats-section">
                        <h5>Уровень сложности</h5>
                        <div class="difficulty-bar">
                            <div class="difficulty-fill" style="width: ${opponent.difficulty * 60}%"></div>
                        </div>
                        <p class="difficulty-text">${
                            opponent.difficulty < 1 ? 'Легко' :
                            opponent.difficulty < 1.3 ? 'Средне' :
                            opponent.difficulty < 1.5 ? 'Сложно' : 'Очень сложно'
                        }</p>
                    </div>
                </div>
            </div>
            
            <div class="modal-buttons">
                <button class="btn-primary race-start-btn" onclick="confirmRace(${opponentIndex}); return false;"
                        ${currentFuel < fuelCost ? 'disabled' : ''}>
                    ${currentFuel < fuelCost ? `Недостаточно топлива (нужно ${fuelCost})` : 'Начать гонку!'}
                </button>
                <button class="btn-secondary" onclick="closeRacePreview(); return false;">Отмена</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Закрыть превью гонки
export function closeRacePreview() {
    const modal = document.querySelector('.race-preview-modal');
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

// Проверка повышения уровня
function checkLevelUp() {
    const currentXP = gameData.experience || 0;
    const currentLevelXP = levelSystem.getRequiredXP(gameData.level);
    const nextLevelXP = levelSystem.getRequiredXP(gameData.level + 1);
    
    if (currentXP >= nextLevelXP) {
        gameData.level++;
        const reward = levelSystem.getLevelReward(gameData.level);
        gameData.money += reward;
        
        showError(`🎉 Поздравляем! Вы достигли ${gameData.level} уровня!\nНаграда: $${reward}`);
        
        // Проверяем еще раз
        checkLevelUp();
    }
}

// Расчет получения навыков
function calculateSkillGain(isWin) {
    const skillNames = ['driving', 'speed', 'reaction', 'technique'];
    const skillNamesRu = {
        driving: 'Вождение',
        speed: 'Скорость',
        reaction: 'Реакция',
        technique: 'Техника'
    };
    
    let gainedSkills = [];
    
    const attempts = Math.random() < 0.7 ? 1 : 2;
    const baseChance = isWin ? 0.9 : 0.45;
    
    for (let i = 0; i < attempts; i++) {
        const randomSkill = skillNames[Math.floor(Math.random() * skillNames.length)];
        
        if (gainedSkills.find(s => s.skill === randomSkill)) {
            continue;
        }
        
        const currentSkillLevel = gameData.skills[randomSkill];
        const chance = baseChance / (1 + currentSkillLevel * 0.01);
        
        if (Math.random() < chance && currentSkillLevel < 10) {
            gameData.skills[randomSkill]++;
            gainedSkills.push({
                skill: randomSkill,
                name: skillNamesRu[randomSkill],
                newLevel: gameData.skills[randomSkill],
                chance: (chance * 100).toFixed(1)
            });
        }
    }
    
    return gainedSkills;
}

// Старт гонки
export async function startRace(opponentIndex) {
    const opponents = generateDynamicOpponents();
    const opponent = opponents[opponentIndex];
    const currentCar = gameData.cars[gameData.currentCar];
    
    initializeCarUpgrades(currentCar);
    
    const betAmount = Math.floor(opponent.reward / 2);
    const fuelCost = fuelSystem.calculateFuelCost(opponent.difficulty);
    const currentFuel = fuelSystem.getCurrentFuel(currentCar);
    
    if (gameData.money < betAmount) {
        alert(`Недостаточно денег для участия! Нужно минимум ${betAmount}`);
        return;
    }
    
    if (currentFuel < fuelCost) {
        alert(`Недостаточно топлива! Нужно ${fuelCost}, а у вас ${currentFuel}`);
        return;
    }
    
    // Тратим топливо
    currentCar.fuel = currentFuel - fuelCost;
    currentCar.lastFuelUpdate = new Date().toISOString();
    
    // Получаем характеристики с учетом улучшений
    const totalStats = calculateTotalStats(currentCar);
    
    // Расчет параметров
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

// ДОБАВЬТЕ ЭТИ СТРОКИ:
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
    showRaceResult(won, opponent, playerTime, opponentTime, xpGained, gainedSkills, fuelCost, currentCar);
    
    updatePlayerInfo();
    
    // Сохраняем результат
    try {
        await saveGameData(gameData);
        console.log('Результат гонки сохранен на сервер');
    } catch (error) {
        console.error('Ошибка сохранения результата гонки:', error);
        showError('⚠️ Результат гонки может не сохраниться. Проверьте соединение.');
    }
}

// Показ результата гонки
function showRaceResult(won, opponent, playerTime, opponentTime, xpGained, gainedSkills, fuelCost, car) {
    showRaceResultScreen();
    
    const resultDiv = document.getElementById('race-result');
    let skillsHTML = '';
    
    if (gainedSkills.length > 0) {
        skillsHTML = '<div class="skill-gain"><h4>Получены навыки:</h4>';
        gainedSkills.forEach(skill => {
            skillsHTML += `<p class="skill-gain-item">✨ ${skill.name} +1 (уровень ${skill.newLevel})</p>`;
        });
        skillsHTML += '</div>';
    }
    
    // Отображение полоски опыта
    const currentXP = gameData.experience || 0;
    const currentLevelXP = levelSystem.getRequiredXP(gameData.level);
    const nextLevelXP = levelSystem.getRequiredXP(gameData.level + 1);
    const progressXP = currentXP - currentLevelXP;
    const neededXP = nextLevelXP - currentLevelXP;
    const xpPercent = Math.floor((progressXP / neededXP) * 100);
    
    // Информация о топливе
    const fuelInfo = `
        <div class="fuel-spent-info">
            <p>⛽ Потрачено топлива: ${fuelCost}</p>
            <p>⛽ Осталось: ${car.fuel}/${car.maxFuel || 30}</p>
        </div>
    `;
    
    if (won) {
        resultDiv.innerHTML = `
            <div class="result-container">
                <h2 class="result-title win">🏆 ПОБЕДА!</h2>
                <div class="result-animation">🎉</div>
                
                <div class="result-info">
                    <p>Вы обогнали <strong>${opponent.name}</strong>!</p>
                    
                    <div class="race-times">
                        <div class="time-block player">
                            <h4>Ваше время</h4>
                            <p class="time-value">${playerTime.toFixed(2)} сек</p>
                        </div>
                        <div class="time-block opponent">
                            <h4>Время соперника</h4>
                            <p class="time-value">${opponentTime.toFixed(2)} сек</p>
                        </div>
                    </div>
                    
                    <div class="result-rewards">
                        <p class="reward-item">💰 Выигрыш: <span class="money-gain">+${opponent.reward}</span></p>
                        <p class="reward-item">⭐ Опыт: <span class="xp-gain">+${xpGained} XP</span></p>
                        <p class="balance">Баланс: ${gameData.money}</p>
                    </div>
                    
                    ${fuelInfo}
                    
                    <div class="xp-progress-section">
                        <p>Уровень ${gameData.level}: ${currentXP} / ${nextLevelXP} XP</p>
                        <div class="xp-progress-bar">
                            <div class="xp-progress-fill" style="width: ${xpPercent}%"></div>
                        </div>
                    </div>
                    
                    ${skillsHTML}
                </div>
                
                <div class="result-actions">
                    <button class="btn-primary" onclick="showRaceMenu()">Новая гонка</button>
                    <button class="btn-secondary" onclick="showMainMenu()">В главное меню</button>
                </div>
            </div>
        `;
    } else {
        resultDiv.innerHTML = `
            <div class="result-container">
                <h2 class="result-title lose">😔 ПОРАЖЕНИЕ</h2>
                
                <div class="result-info">
                    <p><strong>${opponent.name}</strong> оказался быстрее!</p>
                    
                    <div class="race-times">
                        <div class="time-block player">
                            <h4>Ваше время</h4>
                            <p class="time-value">${playerTime.toFixed(2)} сек</p>
                        </div>
                        <div class="time-block opponent">
                            <h4>Время соперника</h4>
                            <p class="time-value">${opponentTime.toFixed(2)} сек</p>
                        </div>
                    </div>
                    
                    <div class="result-rewards">
                        <p class="reward-item">💸 Проигрыш: <span class="money-loss">-${Math.floor(opponent.reward / 2)}</span></p>
                        <p class="reward-item">⭐ Опыт: <span class="xp-gain">+${xpGained} XP</span></p>
                        <p class="balance">Баланс: ${gameData.money}</p>
                    </div>
                    
                    ${fuelInfo}
                    
                    <div class="xp-progress-section">
                        <p>Уровень ${gameData.level}: ${currentXP} / ${nextLevelXP} XP</p>
                        <div class="xp-progress-bar">
                            <div class="xp-progress-fill" style="width: ${xpPercent}%"></div>
                        </div>
                    </div>
                    
                    ${skillsHTML}
                </div>
                
                <div class="result-actions">
                    <button class="btn-primary" onclick="showRaceMenu()">Попробовать снова</button>
                    <button class="btn-secondary" onclick="showMainMenu()">В главное меню</button>
                </div>
            </div>
        `;
    }
}

// Импортируем необходимые данные
import { gameState, allCars } from './game-data.js';

// Делаем функцию доступной глобально
window.displayOpponents = displayOpponents;