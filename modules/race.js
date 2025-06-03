// modules/race.js
// Гоночная логика с серверной валидацией

import { gameData, gameState } from './game-data.js';
import { showError, updatePlayerInfo } from './utils.js';
import { showRaceResultScreen, showRaceMenu, showMainMenu } from './navigation.js';
import { createOpponentListItem, createRacePreviewModal, createRaceResult } from './ui-components.js';

// Загрузка соперников с сервера
let serverOpponents = [];

// Загрузить соперников с сервера
async function loadOpponents() {
    try {
        const response = await fetch(`${API_URL}/game/opponents`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
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
    document.getElementById('race-current-car').textContent = currentCar.name;
    document.getElementById('race-car-fuel').textContent = `${currentCar.fuel}/${currentCar.maxFuel || 30}`;
    document.getElementById('race-balance').textContent = gameData.money;
    
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
        showError(`Недостаточно денег! Нужно минимум $${betAmount}`);
        return;
    }
    
    if (currentCar.fuel < opponent.fuelCost) {
        showError(`Недостаточно топлива! Нужно ${opponent.fuelCost}, а у вас ${currentCar.fuel}`);
        return;
    }
    
    try {
        // Отправляем запрос на сервер для проведения гонки
        const response = await fetch(`${API_URL}/game/race`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                carIndex: gameData.currentCar,
                opponentIndex: opponentIndex,
                betAmount: betAmount
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            showError(error.error || 'Ошибка проведения гонки');
            return;
        }
        
        const result = await response.json();
        
        // Обновляем локальные данные из ответа сервера
        gameData.money = result.gameData.money;
        gameData.experience = result.gameData.experience;
        gameData.level = result.gameData.level;
        currentCar.fuel = result.gameData.fuel;
        
        // Показываем уведомления
        if (result.result.nitroActivated) {
            showError("🚀 Нитро активировано!");
        }
        
        if (result.result.leveledUp) {
            showError(`🎉 Поздравляем! Вы достигли ${result.gameData.level} уровня! Награда: $${result.result.levelReward}`);
        }
        
        // Проверяем достижения
        if (window.checkAllAchievements) {
            window.checkAllAchievements();
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
        showError('Ошибка соединения с сервером');
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

window.displayOpponents = displayOpponents;
window.showRacePreview = showRacePreview;
window.closeRacePreview = closeRacePreview;
window.confirmRace = confirmRace;
window.startRace = startRace;