// modules/race.js
// Гоночная логика с серверной валидацией

import { gameData, gameState } from './game-data.js';
import { showError, updatePlayerInfo } from './utils.js';
import { showRaceResultScreen, showRaceMenu, showMainMenu } from './navigation.js';
import { createOpponentListItem, createRacePreviewModal, createRaceResult } from './ui-components.js';

// ИСПРАВЛЕНО: получаем API_URL и authToken из глобальных переменных
const getAPI_URL = () => window.API_URL || 'https://street-racing-backend-wnse.onrender.com/api';
const getAuthToken = () => window.getAuthToken ? window.getAuthToken() : null;

// Загрузка соперников с сервера
let serverOpponents = [];

// Загрузить соперников с сервера
async function loadOpponents() {
    try {
        const response = await fetch(`${getAPI_URL()}/game/opponents`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            serverOpponents = data.opponents;
            return true;
        }
        return false;
    } catch (error) {
        console.error('Ошибка загрузки соперников:', error);
        return false;
    }
}

// Отображение соперников
export async function displayOpponents() {
    const opponentsList = document.getElementById('opponents-list');
    if (!opponentsList) return;
    
    const currentCar = gameData.cars[gameData.currentCar];
    
    // Обновляем информацию
    const raceCurrentCarEl = document.getElementById('race-current-car');
    const raceCarFuelEl = document.getElementById('race-car-fuel');
    const raceBalanceEl = document.getElementById('race-balance');
    
    if (raceCurrentCarEl) raceCurrentCarEl.textContent = currentCar.name;
    if (raceCarFuelEl) raceCarFuelEl.textContent = `${currentCar.fuel}/${currentCar.maxFuel || 30}`;
    if (raceBalanceEl) raceBalanceEl.textContent = gameData.money;
    
    // Загружаем соперников с сервера
    opponentsList.innerHTML = '<div class="loading">Загрузка соперников...</div>';
    
    const loaded = await loadOpponents();
    if (!loaded) {
        opponentsList.innerHTML = '<p class="error">Ошибка загрузки соперников</p>';
        return;
    }
    
    // Дополняем данные для отображения
    const opponents = serverOpponents.map((opp, index) => ({
        ...opp,
        name: getOpponentName(opp.difficultyClass),
        car: getOpponentCar(opp.difficultyClass),
        betAmount: Math.floor(opp.reward / 2)
    }));
    
    // Создаем список
    const opponentsHTML = opponents.map((opponent, index) => {
        const canAfford = gameData.money >= opponent.betAmount && currentCar.fuel >= opponent.fuelCost;
        return createOpponentListItem(opponent, index, canAfford);
    }).join('');
    
    opponentsList.innerHTML = opponentsHTML;
}

// Вспомогательные функции для генерации имен
function getOpponentName(difficultyClass) {
    const names = {
        easy: ["Новичок", "Студент", "Таксист", "Курьер"],
        medium: ["Гонщик", "Дрифтер", "Стритрейсер", "Спидстер"],
        hard: ["Профи", "Мастер", "Чемпион", "Ветеран"],
        extreme: ["Легенда", "Призрак", "Босс", "Король"]
    };
    const nameList = names[difficultyClass] || names.easy;
    return nameList[Math.floor(Math.random() * nameList.length)];
}

function getOpponentCar(difficultyClass) {
    const cars = {
        easy: ["Handa Civic", "Toyata Corolla"],
        medium: ["Mazta RX-7", "Nisan 240SX"],
        hard: ["BMV M3", "Subare WRX"],
        extreme: ["Nisan GT-R", "Toyata Supra"]
    };
    const carList = cars[difficultyClass] || cars.easy;
    return carList[Math.floor(Math.random() * carList.length)];
}

// Показать превью гонки
export function showRacePreview(opponentIndex) {
    const opponent = serverOpponents[opponentIndex];
    if (!opponent) return;
    
    opponent.index = opponentIndex;
    opponent.name = getOpponentName(opponent.difficultyClass);
    opponent.car = getOpponentCar(opponent.difficultyClass);
    
    const currentCar = gameData.cars[gameData.currentCar];
    const betAmount = Math.floor(opponent.reward / 2);
    const fuelCost = opponent.fuelCost;
    const currentFuel = currentCar.fuel;
    
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

// Старт гонки - ТЕПЕРЬ ЧЕРЕЗ СЕРВЕР
export async function startRace(opponentIndex) {
    const opponent = serverOpponents[opponentIndex];
    if (!opponent) return;
    
    const currentCar = gameData.cars[gameData.currentCar];
    const betAmount = Math.floor(opponent.reward / 2);
    
    if (gameData.money < betAmount) {
        if (window.notify) {
            window.notify(`Недостаточно денег! Нужно минимум $${betAmount}`, 'error');
        } else {
            showError(`Недостаточно денег! Нужно минимум $${betAmount}`);
        }
        return;
    }
    
    if (currentCar.fuel < opponent.fuelCost) {
        if (window.notify) {
            window.notify(`Недостаточно топлива! Нужно ${opponent.fuelCost}, а у вас ${currentCar.fuel}`, 'error');
        } else {
            showError(`Недостаточно топлива! Нужно ${opponent.fuelCost}, а у вас ${currentCar.fuel}`);
        }
        return;
    }
    
    try {
        // Отправляем запрос на сервер для проведения гонки
        const response = await fetch(`${getAPI_URL()}/game/race`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({
                carIndex: gameData.currentCar,
                opponentIndex: opponentIndex,
                betAmount: betAmount
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            if (window.notify) {
                window.notify(error.error || 'Ошибка проведения гонки', 'error');
            } else {
                showError(error.error || 'Ошибка проведения гонки');
            }
            return;
        }
        
        const result = await response.json();
        
        // Обновляем локальные данные из ответа сервера
        gameData.money = result.gameData.money;
        gameData.experience = result.gameData.experience;
        gameData.level = result.gameData.level;
        currentCar.fuel = result.gameData.fuel;
        
        // КРИТИЧЕСКОЕ СОХРАНЕНИЕ после гонки
        if (window.queueSave) {
            await window.queueSave(gameData, 'critical');
        }
        
        // Показываем уведомления
        if (result.result.nitroActivated) {
            if (window.notify) {
                window.notify("🚀 Нитро активировано!", 'info');
            } else {
                showError("🚀 Нитро активировано!");
            }
        }
        
        if (result.result.leveledUp) {
            if (window.notify) {
                window.notify(`🎉 Новый ${result.gameData.level} уровень! +$${result.result.levelReward}`, 'level');
            } else {
                showError(`🎉 Новый ${result.gameData.level} уровень! +$${result.result.levelReward}`);
            }
        }
        
        // Проверяем достижения
        if (window.checkAllAchievements) {
            window.checkAllAchievements();
        }
        
        // Проверяем получение навыка
        if (window.skillSystem) {
            const skillResult = window.skillSystem.tryGetSkill(result.result.won);
            if (skillResult.success) {
                const skillNames = {
                    driving: 'Вождение',
                    speed: 'Скорость',
                    reaction: 'Реакция',
                    technique: 'Техника'
                };
                if (window.notify) {
                    window.notify(`⚡ "${skillNames[skillResult.skill]}" повышен до ${skillResult.newLevel}!`, 'skill');
                } else {
                    showError(`⚡ "${skillNames[skillResult.skill]}" повышен до ${skillResult.newLevel}!`);
                }
            }
        }
        
        // Показываем результат
        showRaceResult(
            result.result.won,
            {
                name: getOpponentName(opponent.difficultyClass),
                car: getOpponentCar(opponent.difficultyClass),
                reward: opponent.reward
            },
            result.result.playerTime,
            result.result.opponentTime,
            result.result.xpGained
        );
        
        updatePlayerInfo();
        
    } catch (error) {
        console.error('Ошибка гонки:', error);
        if (window.notify) {
            window.notify('Ошибка соединения с сервером', 'error');
        } else {
            showError('Ошибка соединения с сервером');
        }
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