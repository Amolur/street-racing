// modules/race.js
// Гоночная логика с новыми режимами гонок

import { gameData, gameState, fuelSystem } from './game-data.js';
import { showError, updatePlayerInfo } from './utils.js';
import { showRaceResultScreen, showRaceMenu, showMainMenu } from './navigation.js';
import { createOpponentListItem, createRacePreviewModal, createRaceResult } from './ui-components.js';

// Типы гонок
export const raceTypes = {
    classic: {
        name: "Классика",
        icon: "🏁",
        description: "Обычная гонка на скорость",
        fuelMultiplier: 1,
        rewardMultiplier: 1,
        xpMultiplier: 1,
        mainStat: "speed"
    },
    drift: {
        name: "Дрифт",
        icon: "🌀",
        description: "Оценивается техника вождения",
        fuelMultiplier: 0.8,
        rewardMultiplier: 1.2,
        xpMultiplier: 1.5,
        mainStat: "technique"
    },
    sprint: {
        name: "Спринт",
        icon: "⚡",
        description: "Короткая гонка на максимальной скорости",
        fuelMultiplier: 0.5,
        rewardMultiplier: 0.7,
        xpMultiplier: 0.8,
        mainStat: "acceleration"
    },
    endurance: {
        name: "Выносливость",
        icon: "🏃",
        description: "Длинная гонка на выносливость",
        fuelMultiplier: 2,
        rewardMultiplier: 2,
        xpMultiplier: 2.5,
        mainStat: "handling"
    }
};

// Текущий выбранный тип гонки
let currentRaceType = 'classic';

// Загрузка соперников с сервера
let serverOpponents = [];

// Функция переключения типа гонки
export function switchRaceType(type) {
    if (raceTypes[type]) {
        currentRaceType = type;
        displayOpponents();
        
        // Обновляем активную кнопку
        document.querySelectorAll('.race-type-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.querySelector(`[data-race-type="${type}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }
}

// Загрузить соперников с сервера
async function loadOpponents() {
    try {
        const response = await fetch(`${window.API_URL}/game/opponents`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
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
    const raceType = raceTypes[currentRaceType];
    
    // Обновляем информацию
    document.getElementById('race-current-car').textContent = currentCar.name;
    
    // ВАЖНО: Получаем актуальное топливо с учетом регенерации
    const currentFuel = fuelSystem.getCurrentFuel(currentCar);
    
    // Обновляем отображение топлива
    document.getElementById('race-car-fuel').textContent = `${currentFuel}/${currentCar.maxFuel || 30}`;
    document.getElementById('race-balance').textContent = gameData.money;
    
    // Обновляем топливо в header
    const headerFuelEl = document.getElementById('header-fuel');
    if (headerFuelEl) {
        headerFuelEl.textContent = currentFuel;
    }
    
    // Показываем описание режима
    const raceTypeInfo = document.getElementById('race-type-info');
    if (raceTypeInfo) {
        raceTypeInfo.innerHTML = `
            <div class="race-type-description">
                <span class="race-type-icon">${raceType.icon}</span>
                <span class="race-type-name">${raceType.name}:</span>
                <span class="race-type-desc">${raceType.description}</span>
            </div>
        `;
    }
    
    // Загружаем соперников с сервера
    opponentsList.innerHTML = '<div class="loading">Загрузка соперников...</div>';
    
    const loaded = await loadOpponents();
    if (!loaded) {
        opponentsList.innerHTML = '<p class="error">Ошибка загрузки соперников</p>';
        return;
    }
    
    // Дополняем данные для отображения с учетом типа гонки
    const opponents = serverOpponents.map((opp, index) => {
        const baseFuelCost = opp.fuelCost;
        const adjustedFuelCost = Math.ceil(baseFuelCost * raceType.fuelMultiplier);
        const adjustedReward = Math.floor(opp.reward * raceType.rewardMultiplier);
        
        return {
            ...opp,
            name: getOpponentName(opp.difficultyClass, currentRaceType),
            car: getOpponentCar(opp.difficultyClass),
            betAmount: Math.floor(adjustedReward / 2),
            fuelCost: adjustedFuelCost,
            reward: adjustedReward,
            originalIndex: index
        };
    });
    
    // Создаем список
    const opponentsHTML = opponents.map((opponent, index) => {
        const canAfford = gameData.money >= opponent.betAmount && currentFuel >= opponent.fuelCost;
        return createOpponentListItem(opponent, index, canAfford);
    }).join('');
    
    opponentsList.innerHTML = opponentsHTML;
}

// Вспомогательные функции для генерации имен
function getOpponentName(difficultyClass, raceType) {
    const names = {
        classic: {
            easy: ["Новичок", "Студент", "Таксист", "Курьер"],
            medium: ["Гонщик", "Стритрейсер", "Спидстер", "Ветеран"],
            hard: ["Профи", "Мастер", "Чемпион", "Эксперт"],
            extreme: ["Легенда", "Призрак", "Босс", "Король"]
        },
        drift: {
            easy: ["Слайдер", "Дрифтер", "Юнец", "Ученик"],
            medium: ["Токийский дрифтер", "Боковой гонщик", "Мастер заноса", "Скользящий"],
            hard: ["Король дрифта", "Мастер угла", "Дымовой демон", "Профи дрифта"],
            extreme: ["Легенда Токио", "Дрифт-босс", "Повелитель заносов", "Дым-машина"]
        },
        sprint: {
            easy: ["Спринтер", "Быстрый", "Резвый", "Торопыга"],
            medium: ["Молния", "Ракета", "Стрела", "Вспышка"],
            hard: ["Сверхзвук", "Турбо-гонщик", "Нитро-мастер", "Скорость"],
            extreme: ["Световая скорость", "Соник", "Флэш", "Молниеносный"]
        },
        endurance: {
            easy: ["Стойкий", "Упорный", "Выносливый", "Марафонец"],
            medium: ["Железный", "Неутомимый", "Дальнобой", "Стальной"],
            hard: ["Несокрушимый", "Титан", "Машина", "Терминатор"],
            extreme: ["Вечный двигатель", "Неостановимый", "Легенда трассы", "Король дистанции"]
        }
    };
    
    const typeNames = names[raceType] || names.classic;
    const nameList = typeNames[difficultyClass] || typeNames.easy;
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
    
    const raceType = raceTypes[currentRaceType];
    opponent.index = opponentIndex;
    opponent.name = getOpponentName(opponent.difficultyClass, currentRaceType);
    opponent.car = getOpponentCar(opponent.difficultyClass);
    
    const currentCar = gameData.cars[gameData.currentCar];
    const betAmount = Math.floor(opponent.reward * raceType.rewardMultiplier / 2);
    const fuelCost = Math.ceil(opponent.fuelCost * raceType.fuelMultiplier);
    const currentFuel = fuelSystem.getCurrentFuel(currentCar);
    
    // Модифицируем данные для превью
    const modifiedOpponent = {
        ...opponent,
        reward: Math.floor(opponent.reward * raceType.rewardMultiplier),
        fuelCost: fuelCost,
        raceType: raceType
    };
    
    const modal = createRacePreviewModal(modifiedOpponent, currentCar, betAmount, fuelCost, currentFuel);
    
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

// Подтверждение гонки
export function confirmRace(opponentIndex) {
    closeRacePreview();
    startRace(opponentIndex);
}

export async function startRace(opponentIndex) {
    const opponent = serverOpponents[opponentIndex];
    if (!opponent) return;
    
    const currentCar = gameData.cars[gameData.currentCar];
    const raceType = raceTypes[currentRaceType];
    const betAmount = Math.floor(opponent.reward * raceType.rewardMultiplier / 2);
    const fuelCost = Math.ceil(opponent.fuelCost * raceType.fuelMultiplier);
    
    // Простые проверки на клиенте (дублируются на сервере)
    if (gameData.money < betAmount) {
        window.notify(`Недостаточно денег! Нужно минимум $${betAmount}`, 'error');
        return;
    }
    
    const currentFuel = fuelSystem.getCurrentFuel(currentCar);
    if (currentFuel < fuelCost) {
        window.notify(`Недостаточно топлива! Нужно ${fuelCost}, а у вас ${currentFuel}`, 'error');
        return;
    }
    
    try {
        // ВСЁ отправляем на сервер - никаких расчетов на клиенте!
        const response = await fetch(`${window.API_URL}/game/race`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                carIndex: gameData.currentCar,
                opponentIndex: opponentIndex,
                betAmount: betAmount,
                raceType: currentRaceType,
                fuelCost: fuelCost
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            window.notify(error.error || 'Ошибка проведения гонки', 'error');
            return;
        }
        
        const result = await response.json();
        
        // ВАЖНО: Обновляем ВСЕ данные только из ответа сервера
        gameData.money = result.gameData.money;
        gameData.experience = result.gameData.experience;
        gameData.level = result.gameData.level;
        gameData.stats = result.gameData.stats;
        gameData.skills = result.gameData.skills;
        currentCar.fuel = result.gameData.fuel;
        
        // Обновляем интерфейс
        updatePlayerInfo();
        if (window.updateFuelDisplay) {
            window.updateFuelDisplay();
        }
        
        // Показываем результат
        showRaceResult(
            result.result.won,
            {
                name: getOpponentName(opponent.difficultyClass, currentRaceType),
                car: getOpponentCar(opponent.difficultyClass),
                reward: Math.floor(opponent.reward * raceType.rewardMultiplier)
            },
            result.result.playerTime,
            result.result.opponentTime,
            result.result.xpGained,
            currentRaceType
        );
        
    } catch (error) {
        console.error('Ошибка гонки:', error);
        window.notify('Ошибка соединения с сервером', 'error');
    }
}

// Показать результат гонки
export function showRaceResult(won, opponent, playerTime, opponentTime, xpGained, raceType) {
    showRaceResultScreen();
    
    const resultDiv = document.getElementById('race-result');
    if (!resultDiv) return;
    
    const rewards = {
        money: won ? opponent.reward : 0,
        bet: Math.floor(opponent.reward / 2),
        xp: xpGained,
        raceType: raceTypes[raceType] || raceTypes.classic
    };
    
    resultDiv.innerHTML = createRaceResult(won, opponent, playerTime, opponentTime, rewards);
    
    // НОВОЕ: Обновляем отображение после показа результата
    setTimeout(() => {
        if (window.updateFuelDisplay) {
            window.updateFuelDisplay();
        }
        if (window.updatePlayerInfo) {
            window.updatePlayerInfo();
        }
    }, 100);
}

window.displayOpponents = displayOpponents;
window.showRacePreview = showRacePreview;
window.closeRacePreview = closeRacePreview;
window.confirmRace = confirmRace;
window.startRace = startRace;
window.switchRaceType = switchRaceType;