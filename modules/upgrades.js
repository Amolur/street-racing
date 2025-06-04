// modules/upgrades.js
// Система улучшений без индикаторов загрузки

import { gameData } from './game-data.js';
import { showError, updatePlayerInfo } from './utils.js';
// ИСПРАВЛЕНО: убрал импорт queueSave, так как он доступен через window.queueSave

// Конфигурация системы улучшений
export const upgradeConfig = {
    engine: {
        name: "Двигатель",
        icon: "🔧",
        affects: { power: 5, speed: 3 },
        baseCost: 500,
        costMultiplier: 2.5,
        description: "Увеличивает мощность и скорость"
    },
    turbo: {
        name: "Турбо",
        icon: "💨",
        affects: { acceleration: 4, power: 2 },
        baseCost: 300,
        costMultiplier: 2.3,
        description: "Улучшает ускорение и мощность"
    },
    tires: {
        name: "Шины",
        icon: "🏁",
        affects: { handling: 3, acceleration: 2 },
        baseCost: 200,
        costMultiplier: 2.2,
        description: "Повышает управление и ускорение"
    },
    suspension: {
        name: "Подвеска",
        icon: "🔩",
        affects: { handling: 5 },
        baseCost: 400,
        costMultiplier: 2.4,
        description: "Значительно улучшает управление"
    },
    transmission: {
        name: "Коробка передач",
        icon: "⚙️",
        affects: { speed: 3, acceleration: 3 },
        baseCost: 600,
        costMultiplier: 2.5,
        description: "Увеличивает скорость и ускорение"
    }
};

// Инициализация улучшений для машины
export function initializeCarUpgrades(car) {
    if (!car.upgrades) {
        car.upgrades = {
            engine: 0,
            turbo: 0,
            tires: 0,
            suspension: 0,
            transmission: 0
        };
    }
    
    if (!car.specialParts) {
        car.specialParts = {
            nitro: false,
            bodyKit: false,
            ecuTune: false,
            fuelTank: false
        };
    }
    
    if (car.fuel === undefined) {
        car.fuel = 30;
    }
    if (car.maxFuel === undefined) {
        car.maxFuel = car.specialParts.fuelTank ? 40 : 30;
    }
    if (!car.lastFuelUpdate) {
        car.lastFuelUpdate = new Date().toISOString();
    }
    
    return car;
}

// Расчет стоимости улучшения
export function getUpgradeCost(type, currentLevel) {
    const config = upgradeConfig[type];
    return Math.floor(config.baseCost * Math.pow(config.costMultiplier, currentLevel));
}

// Расчет общих характеристик машины с учетом улучшений
export function calculateTotalStats(car) {
    let totalStats = {
        power: car.power,
        speed: car.speed,
        handling: car.handling,
        acceleration: car.acceleration
    };
    
    // Применяем улучшения
    if (car.upgrades) {
        Object.keys(car.upgrades).forEach(upgradeType => {
            const level = car.upgrades[upgradeType];
            const config = upgradeConfig[upgradeType];
            
            if (config && config.affects) {
                Object.keys(config.affects).forEach(stat => {
                    totalStats[stat] += config.affects[stat] * level;
                });
            }
        });
    }
    
    // Применяем специальные детали
    if (car.specialParts) {
        if (car.specialParts.bodyKit) {
            Object.keys(totalStats).forEach(stat => {
                totalStats[stat] += 10;
            });
        }
        
        if (car.specialParts.ecuTune) {
            Object.keys(totalStats).forEach(stat => {
                totalStats[stat] = Math.floor(totalStats[stat] * 1.15);
            });
        }
    }
    
    return totalStats;
}

// Функция улучшения компонента
export async function upgradeComponent(type) {
    const currentCar = gameData.cars[gameData.currentCar];
    const currentLevel = currentCar.upgrades[type];
    const cost = getUpgradeCost(type, currentLevel);
    
    // Валидация
    if (currentLevel >= 10) {
        showError('Достигнут максимальный уровень улучшения!');
        return;
    }
    
    if (gameData.money < cost) {
        showError('Недостаточно денег!');
        return;
    }
    
    // Сохраняем старые значения для отката
    const oldMoney = gameData.money;
    const oldSpent = gameData.stats.moneySpent;
    const oldLevel = currentCar.upgrades[type];
    
    // Применяем изменения локально (для UI)
    gameData.money -= cost;
    gameData.stats.moneySpent += cost;
    currentCar.upgrades[type]++;
    
    // Обновляем интерфейс сразу
    updatePlayerInfo();
    if (window.updateGarageDisplay) {
        window.updateGarageDisplay();
    }
    
    console.log('💰 Покупка улучшения...');
    
    try {
        // Сохраняем на сервер
        if (window.saveGameData) {
            await window.saveGameData(gameData);
        } else {
            throw new Error('saveGameData недоступна');
        }
        
        console.log('✅ Улучшение успешно сохранено на сервер');
        showError(`${upgradeConfig[type].name} улучшен до уровня ${currentCar.upgrades[type]}!`);
        
        // Обновляем прогресс заданий
        if (window.updateTaskProgress) {
            window.updateTaskProgress('upgradesBought');
        }
        
        checkUpgradeAchievements();
        if (window.checkAllAchievements) {
            window.checkAllAchievements();
        }
    } catch (error) {
        console.error('❌ Ошибка сохранения улучшения:', error);
        
        // ОТКАТЫВАЕМ изменения при ошибке
        gameData.money = oldMoney;
        gameData.stats.moneySpent = oldSpent;
        currentCar.upgrades[type] = oldLevel;
        
        // Обновляем интерфейс
        updatePlayerInfo();
        if (window.updateGarageDisplay) {
            window.updateGarageDisplay();
        }
        
        showError('❌ Ошибка сохранения! Улучшение отменено. Проверьте соединение.');
    }
}

// Покупка специальных деталей
export async function buySpecialPart(type, cost) {
    const currentCar = gameData.cars[gameData.currentCar];
    
    if (gameData.money < cost) {
        showError('Недостаточно денег!');
        return;
    }
    
    if (currentCar.specialParts[type]) {
        showError('Эта деталь уже установлена!');
        return;
    }
    
    // Сохраняем старые значения для отката
    const oldMoney = gameData.money;
    const oldSpent = gameData.stats.moneySpent;
    const oldPart = currentCar.specialParts[type];
    
    // Применяем изменения локально (для UI)
    gameData.money -= cost;
    gameData.stats.moneySpent += cost;
    currentCar.specialParts[type] = true;
    
    // Обновляем интерфейс сразу
    updatePlayerInfo();
    if (window.updateGarageDisplay) {
        window.updateGarageDisplay();
    }
    
    console.log('🔧 Покупка специальной детали...');
    
    try {
        // Сохраняем на сервер
        if (window.saveGameData) {
            await window.saveGameData(gameData);
        } else {
            throw new Error('saveGameData недоступна');
        }
        
        const partNames = {
            nitro: "Нитро",
            bodyKit: "Спортивный обвес",
            ecuTune: "Чип-тюнинг"
        };
        
        console.log('✅ Специальная деталь успешно сохранена на сервер');
        showError(`${partNames[type]} установлен!`);
        
         // Обновляем прогресс заданий (специальные детали тоже считаются как улучшения)
        if (window.updateTaskProgress) {
            window.updateTaskProgress('upgradesBought');
        }
        
    } catch (error) {
        console.error('❌ Ошибка сохранения детали:', error);
        
        // ОТКАТЫВАЕМ изменения при ошибке
        gameData.money = oldMoney;
        gameData.stats.moneySpent = oldSpent;
        currentCar.specialParts[type] = oldPart;
        
        // Обновляем интерфейс
        updatePlayerInfo();
        if (window.updateGarageDisplay) {
            window.updateGarageDisplay();
        }
        
        showError('❌ Ошибка сохранения! Покупка отменена. Проверьте соединение.');
    }
}

// Получение названия характеристики
export function getStatName(stat) {
    const statNames = {
        power: "Мощность",
        speed: "Скорость",
        handling: "Управление",
        acceleration: "Разгон"
    };
    return statNames[stat] || stat;
}

// Проверка достижений за улучшения
export function checkUpgradeAchievements() {
    const currentCar = gameData.cars[gameData.currentCar];
    const totalUpgradeLevel = Object.values(currentCar.upgrades).reduce((sum, level) => sum + level, 0);
    
    if (totalUpgradeLevel === 10) {
        showError("🏆 Достижение: Первые улучшения!");
    } else if (totalUpgradeLevel === 25) {
        showError("🏆 Достижение: Серьезный тюнинг!");
    } else if (totalUpgradeLevel === 50) {
        showError("🏆 Достижение: Максимальная прокачка!");
    }
}

// Делаем функции доступными глобально
window.upgradeComponent = upgradeComponent;
window.buySpecialPart = buySpecialPart;