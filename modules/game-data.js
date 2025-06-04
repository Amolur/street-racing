// modules/game-data.js
// Централизованное хранилище игровых данных
export const gameState = {
    currentUser: null,
    authToken: null,
    navigationHistory: [],
    currentScreen: 'main-menu',
    autoSaveInterval: null,
    fuelUpdateInterval: null,
    infoBarUpdateInterval: null
};

export let gameData = {
    money: 1000,
    level: 1,
    experience: 0,
    currentCar: 0,
    skills: {
        driving: 1,
        speed: 1,
        reaction: 1,
        technique: 1
    },
    stats: {
        totalRaces: 0,
        wins: 0,
        losses: 0,
        moneyEarned: 0,
        moneySpent: 0,
        driftWins: 0,
        sprintWins: 0,
        enduranceWins: 0
    },
    cars: [{
        id: 0,
        name: "Handa Civic",
        power: 50,
        speed: 60,
        handling: 70,
        acceleration: 55,
        price: 0,
        owned: true,
        upgrades: {
            engine: 0,
            turbo: 0,
            tires: 0,
            suspension: 0,
            transmission: 0
        },
        specialParts: {
            nitro: false,
            bodyKit: false,
            ecuTune: false,
            fuelTank: false
        },
        fuel: 30,
        maxFuel: 30,
        lastFuelUpdate: new Date().toISOString()
    }],
    achievements: [],
    dailyTasks: null,
    dailyStats: {}
};

// Функция для обновления gameData после загрузки с сервера
export function updateGameData(newData) {
    // Сохраняем структуру по умолчанию и обновляем только то, что пришло
    gameData = {
        ...gameData,
        ...newData,
        // Убеждаемся, что критические поля всегда есть
        skills: newData.skills || gameData.skills,
        stats: newData.stats || gameData.stats,
        cars: newData.cars || gameData.cars,
        achievements: newData.achievements || [],
        dailyTasks: newData.dailyTasks || null,
        dailyStats: newData.dailyStats || {}
    };
    
    // Инициализируем первую машину если нужно
    if (gameData.cars && gameData.cars.length > 0) {
        gameData.cars.forEach(car => {
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
            if (car.fuel === undefined) car.fuel = 30;
            if (car.maxFuel === undefined) car.maxFuel = 30;
            if (!car.lastFuelUpdate) car.lastFuelUpdate = new Date().toISOString();
        });
    }
}

// Система уровней
export const levelSystem = {
    getRequiredXP: function(level) {
        return Math.floor(100 * Math.pow(1.5, level - 1));
    },
    
    getLevelReward: function(level) {
        const baseReward = 500;
        return baseReward * level;
    },
    
    getCarRequiredLevel: function(carPrice) {
        if (carPrice === 0) return 1;
        if (carPrice <= 5000) return 1;
        if (carPrice <= 15000) return 5;
        if (carPrice <= 30000) return 10;
        if (carPrice <= 50000) return 15;
        if (carPrice <= 80000) return 20;
        if (carPrice <= 150000) return 25;
        return 30;
    },
    
    calculateXPGain: function(won, opponentDifficulty, betAmount) {
        const baseXP = won ? 50 : 20;
        const difficultyBonus = Math.floor(opponentDifficulty * 30);
        const betBonus = Math.floor(betAmount / 100);
        return baseXP + difficultyBonus + betBonus;
    }
};

// Список всех доступных машин в игре
export const allCars = [
    // Начальные машины (0-5000$)
    { id: 0, name: "Handa Civic", power: 50, speed: 60, handling: 70, acceleration: 55, price: 0 },
    { id: 1, name: "Volks Golf", power: 55, speed: 65, handling: 75, acceleration: 60, price: 3000 },
    { id: 2, name: "Toyata Corolla", power: 52, speed: 62, handling: 72, acceleration: 58, price: 3500 },
    { id: 3, name: "Mazta MX-3", power: 60, speed: 70, handling: 85, acceleration: 65, price: 5000 },
    
    // Городские машины (5000-15000$) - требуют 5 уровень
    { id: 4, name: "Nisan Altma", power: 65, speed: 72, handling: 78, acceleration: 68, price: 8000 },
    { id: 5, name: "Handa Acord", power: 68, speed: 74, handling: 76, acceleration: 70, price: 9500 },
    { id: 6, name: "Subare Impeza", power: 75, speed: 80, handling: 82, acceleration: 78, price: 12000 },
    { id: 7, name: "Mitsu Lanser", power: 73, speed: 78, handling: 80, acceleration: 75, price: 13000 },
    { id: 8, name: "Mazta 6", power: 70, speed: 76, handling: 83, acceleration: 72, price: 14000 },
    
    // Спортивные седаны (15000-30000$) - требуют 10 уровень
    { id: 9, name: "BMV 330i", power: 78, speed: 82, handling: 85, acceleration: 80, price: 18000 },
    { id: 10, name: "Audi S3", power: 80, speed: 84, handling: 83, acceleration: 82, price: 22000 },
    { id: 11, name: "Merco C300", power: 82, speed: 86, handling: 81, acceleration: 79, price: 25000 },
    { id: 12, name: "Lexas IS350", power: 85, speed: 88, handling: 79, acceleration: 83, price: 28000 },
    
    // Маслкары (30000-50000$) - требуют 15 уровень
    { id: 13, name: "Dodger Chalenger", power: 88, speed: 85, handling: 75, acceleration: 86, price: 32000 },
    { id: 14, name: "Fordo Mustag", power: 90, speed: 87, handling: 77, acceleration: 88, price: 35000 },
    { id: 15, name: "Camaро SS", power: 92, speed: 89, handling: 74, acceleration: 90, price: 38000 },
    { id: 16, name: "Pontik Firebird", power: 87, speed: 83, handling: 76, acceleration: 85, price: 40000 },
    
    // Спорткары (50000-80000$) - требуют 20 уровень
    { id: 17, name: "Nisan 370X", power: 85, speed: 90, handling: 88, acceleration: 87, price: 45000 },
    { id: 18, name: "Toyata Supera", power: 88, speed: 92, handling: 86, acceleration: 89, price: 52000 },
    { id: 19, name: "Mazta RX-8", power: 83, speed: 88, handling: 92, acceleration: 85, price: 55000 },
    { id: 20, name: "Subaro BRX", power: 80, speed: 85, handling: 94, acceleration: 82, price: 58000 },
    { id: 21, name: "Porshe Kayman", power: 90, speed: 94, handling: 95, acceleration: 91, price: 65000 },
    { id: 22, name: "Corveta C7", power: 95, speed: 96, handling: 87, acceleration: 93, price: 75000 },
    
    // Суперкары (80000-150000$) - требуют 25 уровень
    { id: 23, name: "Audi R7", power: 93, speed: 95, handling: 90, acceleration: 92, price: 85000 },
    { id: 24, name: "BMV M8", power: 94, speed: 97, handling: 89, acceleration: 94, price: 95000 },
    { id: 25, name: "Merco AMG GT", power: 96, speed: 98, handling: 88, acceleration: 95, price: 110000 },
    { id: 26, name: "Nisan GT-X", power: 97, speed: 99, handling: 86, acceleration: 98, price: 125000 },
    
    // Гиперкары (150000+$) - требуют 30 уровень
    { id: 27, name: "Lambo Hurican", power: 98, speed: 100, handling: 91, acceleration: 97, price: 180000 },
    { id: 28, name: "Ferari 458", power: 99, speed: 100, handling: 93, acceleration: 96, price: 220000 },
    { id: 29, name: "McLaran 720X", power: 100, speed: 100, handling: 95, acceleration: 99, price: 300000 }
];

// Система топлива
export const fuelSystem = {
    baseConsumption: 5,
    difficultyMultiplier: {
        easy: 1,
        medium: 1.5,
        hard: 2,
        extreme: 2.5
    },
    regenRate: 10, // минут на единицу топлива
    
    calculateFuelCost: function(difficulty) {
        let category = 'easy';
        if (difficulty >= 1.0 && difficulty < 1.4) category = 'medium';
        else if (difficulty >= 1.4 && difficulty < 1.8) category = 'hard';
        else if (difficulty >= 1.8) category = 'extreme';
        
        return Math.ceil(this.baseConsumption * this.difficultyMultiplier[category]);
    },
    
    getTimeUntilFull: function(currentFuel, maxFuel, lastUpdate) {
        if (currentFuel >= maxFuel) return 0;
        
        const now = new Date();
        const lastUpdateTime = new Date(lastUpdate);
        const minutesPassed = (now - lastUpdateTime) / 60000;
        const fuelRegenerated = Math.floor(minutesPassed / this.regenRate);
        const currentActualFuel = Math.min(currentFuel + fuelRegenerated, maxFuel);
        const fuelNeeded = maxFuel - currentActualFuel;
        
        return fuelNeeded * this.regenRate;
    },
    
    getCurrentFuel: function(car) {
    if (!car || car.fuel === undefined) return 30;
    if (!car.lastFuelUpdate) return car.fuel;
    
    const now = new Date();
    const lastUpdate = new Date(car.lastFuelUpdate);
    const minutesPassed = (now - lastUpdate) / 60000;
    const fuelRegenerated = Math.floor(minutesPassed / this.regenRate);
    
    const currentFuel = Math.min((car.fuel || 0) + fuelRegenerated, car.maxFuel || 30);
    if (fuelRegenerated > 0) {
        car.fuel = currentFuel;
        car.lastFuelUpdate = now.toISOString();
    }
    
    return currentFuel;
}
};

// Система получения навыков
export const skillSystem = {
    // Получить общее количество навыков
    getTotalSkillPoints: function() {
        const skills = gameData.skills;
        return (skills.driving - 1) + (skills.speed - 1) + 
               (skills.reaction - 1) + (skills.technique - 1);
    },
    
    // Рассчитать шанс получения навыка
    getSkillChance: function(won) {
        const baseChance = won ? 50 : 20; // 50% при победе, 20% при поражении
        const totalSkills = this.getTotalSkillPoints();
        const chance = baseChance / (1 + totalSkills * 0.1);
        return Math.max(chance, 1); // Минимум 1% шанс
    },
    
    // Попытка получить навык
    tryGetSkill: function(won) {
        // 1. Выбираем случайный навык
        const skills = ['driving', 'speed', 'reaction', 'technique'];
        const randomSkill = skills[Math.floor(Math.random() * skills.length)];
        
        // 2. Проверяем, получит ли игрок этот навык
        const chance = this.getSkillChance(won);
        const roll = Math.random() * 100;
        
        if (roll < chance) {
            // Успех! Добавляем навык
            gameData.skills[randomSkill]++;
            return {
                success: true,
                skill: randomSkill,
                newLevel: gameData.skills[randomSkill],
                chance: chance.toFixed(1)
            };
        }
        
        return {
            success: false,
            skill: randomSkill,
            chance: chance.toFixed(1)
        };
    }
};

// Делаем доступным глобально
window.skillSystem = skillSystem;