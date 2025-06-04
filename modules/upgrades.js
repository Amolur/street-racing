// modules/upgrades.js
// Система улучшений с ЗАЩИЩЕННЫМИ покупками

import { gameData } from './game-data.js';
import { updatePlayerInfo } from './utils.js';

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

// Расчет стоимости улучшения (ТОЛЬКО ДЛЯ ОТОБРАЖЕНИЯ)
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

// ИСПРАВЛЕННАЯ функция улучшения компонента - ВСЁ ЧЕРЕЗ СЕРВЕР
export async function upgradeComponent(type) {
    const currentCar = gameData.cars[gameData.currentCar];
    const currentLevel = currentCar.upgrades[type];
    const cost = getUpgradeCost(type, currentLevel);
    
    // Простые проверки на клиенте (дублируются на сервере)
    if (currentLevel >= 10) {
        window.notify('Достигнут максимальный уровень улучшения!', 'warning');
        return;
    }
    
    if (gameData.money < cost) {
        window.notify('Недостаточно денег!', 'error');
        return;
    }
    
    try {
        console.log('💰 Покупка улучшения через сервер...');
        
        // ЗАЩИТА: ВСЯ ЛОГИКА УЛУЧШЕНИЯ НА СЕРВЕРЕ
        const response = await fetch(`${window.API_URL}/game/upgrade`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ 
                carIndex: gameData.currentCar, 
                upgradeType: type 
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            window.notify(error.error || 'Ошибка улучшения', 'error');
            return;
        }
        
        const result = await response.json();
        
        console.log('✅ Улучшение успешно выполнено на сервере');
        
        // ВАЖНО: Обновляем данные ТОЛЬКО из ответа сервера
        gameData.money = result.remainingMoney;
        currentCar.upgrades[type] = result.newLevel;
        
        // Обновляем статистику из сервера (если есть)
        if (result.gameData && result.gameData.stats) {
            gameData.stats = result.gameData.stats;
        }
        
        // Обновляем интерфейс
        updatePlayerInfo();
        window.updateGarageDisplay();
        
        // Сообщение об успехе
        let upgradeMessage = `${upgradeConfig[type].name} улучшен до уровня ${result.newLevel}!`;
        if (result.eventDiscount) {
            upgradeMessage += ` (Скидка: $${result.originalCost - result.cost})`;
        }
        window.notify(upgradeMessage, 'success');
        
        // Обновляем прогресс заданий
        if (window.updateTaskProgress) {
            window.updateTaskProgress('upgradesBought');
        }
        
        checkUpgradeAchievements();
        if (window.checkAllAchievements) {
            window.checkAllAchievements();
        }
        
    } catch (error) {
        console.error('❌ Ошибка улучшения:', error);
        window.notify('❌ Ошибка соединения с сервером! Попробуйте позже.', 'error');
    }
}

// ИСПРАВЛЕННАЯ покупка специальных деталей - ВСЁ ЧЕРЕЗ СЕРВЕР
export async function buySpecialPart(type, cost) {
    const currentCar = gameData.cars[gameData.currentCar];
    
    // Простые проверки на клиенте (дублируются на сервере)
    if (gameData.money < cost) {
        window.notify('Недостаточно денег!', 'error');
        return;
    }
    
    if (currentCar.specialParts[type]) {
        window.notify('Эта деталь уже установлена!', 'warning');
        return;
    }
    
    try {
        console.log('🔧 Покупка специальной детали через сервер...');
        
        // ЗАЩИТА: ВСЯ ЛОГИКА ПОКУПКИ НА СЕРВЕРЕ
        const response = await fetch(`${window.API_URL}/game/buy-special-part`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ 
                carIndex: gameData.currentCar, 
                partType: type,
                cost: cost
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            window.notify(error.error || 'Ошибка покупки', 'error');
            return;
        }
        
        const result = await response.json();
        
        console.log('✅ Специальная деталь успешно куплена на сервере');
        
        // ВАЖНО: Обновляем данные ТОЛЬКО из ответа сервера
        gameData.money = result.remainingMoney;
        currentCar.specialParts[type] = true;
        
        // Обновляем статистику из сервера (если есть)
        if (result.gameData && result.gameData.stats) {
            gameData.stats = result.gameData.stats;
        }
        
        // Обновляем интерфейс
        updatePlayerInfo();
        window.updateGarageDisplay();
        
        const partNames = {
            nitro: "Нитро",
            bodyKit: "Спортивный обвес",
            ecuTune: "Чип-тюнинг",
            fuelTank: "Увеличенный бак"
        };
        
        window.notify(`${partNames[type]} установлен!`, 'success');
        
        // Обновляем прогресс заданий (специальные детали тоже считаются как улучшения)
        if (window.updateTaskProgress) {
            window.updateTaskProgress('upgradesBought');
        }
        
    } catch (error) {
        console.error('❌ Ошибка покупки детали:', error);
        window.notify('❌ Ошибка соединения с сервером! Попробуйте позже.', 'error');
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
        window.notify("🏆 Достижение: Первые улучшения!", 'reward');
    } else if (totalUpgradeLevel === 25) {
        window.notify("🏆 Достижение: Серьезный тюнинг!", 'reward');
    } else if (totalUpgradeLevel === 50) {
        window.notify("🏆 Достижение: Максимальная прокачка!", 'reward');
    }
}

window.upgradeComponent = upgradeComponent;
window.buySpecialPart = buySpecialPart;