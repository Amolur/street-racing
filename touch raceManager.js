// raceManager.js - Улучшенная система гонок

(function() {
    'use strict';
    
    class RaceManager {
        constructor(gameCore, security) {
            this.core = gameCore;
            this.security = security;
            this.cache = gameCore.CacheManager;
            this.eventBus = gameCore.EventBus;
            
            this.currentRace = null;
            
            this.sessionStats = {
                races: 0,
                wins: 0,
                totalTime: 0,
                bestTime: Infinity
            };
        }
        
        generateOpponents(playerLevel) {
            // Проверяем кеш
            const cached = this.cache.get('opponents');
            if (cached) {
                return cached;
            }
            
            const opponents = [];
            const difficulties = ['easy', 'medium', 'hard', 'extreme'];
            
            difficulties.forEach(difficulty => {
                const opponent = this.core.GameObjectFactory.createOpponent(playerLevel, difficulty);
                
                // Выбираем подходящую машину для соперника
                const maxCarPrice = 5000 + (playerLevel * 5000);
                const availableCars = this.getAvailableCarsForOpponent(maxCarPrice);
                opponent.car = this.selectCarForOpponent(availableCars, difficulty);
                
                opponents.push(opponent);
            });
            
            // Сохраняем в кеш на 5 минут
            this.cache.set('opponents', opponents, 5 * 60 * 1000);
            
            return opponents;
        }
        
        getAvailableCarsForOpponent(maxPrice) {
            // Используем глобальный список машин
            if (!window.allCars) return [];
            return window.allCars.filter(car => car.price <= maxPrice && car.price > 0);
        }
        
        selectCarForOpponent(availableCars, difficulty) {
            if (availableCars.length === 0) {
                return window.allCars[0] || { name: "Стандартная машина", power: 50, speed: 60 };
            }
            
            const sortedCars = [...availableCars].sort((a, b) => {
                const powerA = (a.power + a.speed + a.handling + a.acceleration) / 4;
                const powerB = (b.power + b.speed + b.handling + b.acceleration) / 4;
                return powerB - powerA;
            });
            
            let index = 0;
            switch (difficulty) {
                case 'easy':
                    index = Math.floor(sortedCars.length * 0.7);
                    break;
                case 'medium':
                    index = Math.floor(sortedCars.length * 0.5);
                    break;
                case 'hard':
                    index = Math.floor(sortedCars.length * 0.3);
                    break;
                case 'extreme':
                    index = 0;
                    break;
            }
            
            return sortedCars[Math.min(index, sortedCars.length - 1)];
        }
        
        startRace(opponentIndex, playerCar, gameState) {
            const opponents = this.generateOpponents(gameState.level);
            const opponent = opponents[opponentIndex];
            
            if (!opponent) {
                throw new Error('Invalid opponent index');
            }
            
            // Проверка топлива
            const fuelCost = this.calculateFuelCost(opponent.difficulty);
            const currentFuel = this.calculateCurrentFuel(playerCar);
            
            if (currentFuel < fuelCost) {
                this.eventBus.emit('race:error', { 
                    message: `Недостаточно топлива! Нужно ${fuelCost}, у вас ${currentFuel}` 
                });
                return false;
            }
            
            // Проверка денег
            const betAmount = Math.floor(opponent.reward / 2);
            if (gameState.money < betAmount) {
                this.eventBus.emit('race:error', { 
                    message: `Недостаточно денег! Нужно $${betAmount}` 
                });
                return false;
            }
            
            // Создаем объект гонки
            this.currentRace = {
                startTime: Date.now(),
                opponent,
                playerCar,
                betAmount,
                fuelCost,
                playerLevel: gameState.level,
                playerSkills: gameState.skills
            };
            
            // Запускаем симуляцию гонки
            this.simulateRace();
            
            return true;
        }
        
        simulateRace() {
            if (!this.currentRace) return;
            
            const { playerCar, opponent, playerSkills } = this.currentRace;
            
            // Расчет характеристик с учетом всех факторов
            const playerStats = this.calculateTotalCarStats(playerCar);
            const playerEfficiency = this.calculatePlayerEfficiency(playerStats, playerSkills);
            
            // Эффективность соперника
            const opponentEfficiency = 60 * opponent.difficulty;
            
            // Факторы случайности и специальные детали
            const raceFactors = this.calculateRaceFactors(playerCar);
            
            // Расчет времени прохождения трассы
            const trackLength = 1000;
            const baseTime = 60;
            
            const playerTime = this.calculateRaceTime(
                trackLength, 
                baseTime, 
                playerEfficiency * raceFactors.playerMultiplier
            );
            
            const opponentTime = this.calculateRaceTime(
                trackLength, 
                baseTime, 
                opponentEfficiency * raceFactors.opponentMultiplier
            );
            
            // Проверка на читерство
            const isValidRace = this.security.validateRaceResult(
                playerCar, 
                opponent.difficulty, 
                playerTime, 
                playerTime < opponentTime
            );
            
            if (!isValidRace) {
                this.eventBus.emit('race:suspicious', { 
                    message: 'Обнаружена подозрительная активность' 
                });
                return;
            }
            
            // Результат гонки
            const result = {
                won: playerTime < opponentTime,
                playerTime,
                opponentTime,
                timeDifference: Math.abs(playerTime - opponentTime),
                rewards: this.calculateRewards(playerTime < opponentTime, opponent, this.currentRace.betAmount),
                factors: raceFactors,
                opponent: opponent,
                betAmount: this.currentRace.betAmount,
                fuelCost: this.currentRace.fuelCost
            };
            
            // Обновляем статистику сессии
            this.updateSessionStats(result);
            
            // Отправляем событие о завершении гонки
            this.eventBus.emit('race:finished', result);
            
            // Очищаем текущую гонку
            this.currentRace = null;
        }
        
        calculateTotalCarStats(car) {
            const baseStats = {
                power: car.power,
                speed: car.speed,
                handling: car.handling,
                acceleration: car.acceleration
            };
            
            // Добавляем бонусы от улучшений
            if (car.upgrades) {
                const upgradeConfig = {
                    engine: { power: 5, speed: 3 },
                    turbo: { acceleration: 4, power: 2 },
                    tires: { handling: 3, acceleration: 2 },
                    suspension: { handling: 5 },
                    transmission: { speed: 3, acceleration: 3 }
                };
                
                Object.keys(car.upgrades).forEach(upgradeType => {
                    const level = car.upgrades[upgradeType];
                    const config = upgradeConfig[upgradeType];
                    
                    if (config) {
                        Object.keys(config).forEach(stat => {
                            if (baseStats[stat] !== undefined) {
                                baseStats[stat] += config[stat] * level;
                            }
                        });
                    }
                });
            }
            
            // Бонусы от специальных деталей
            if (car.specialParts) {
                if (car.specialParts.bodyKit) {
                    Object.keys(baseStats).forEach(stat => {
                        baseStats[stat] += 10;
                    });
                }
                
                if (car.specialParts.ecuTune) {
                    Object.keys(baseStats).forEach(stat => {
                        baseStats[stat] = Math.floor(baseStats[stat] * 1.15);
                    });
                }
            }
            
            return baseStats;
        }
        
        calculatePlayerEfficiency(carStats, skills) {
            const avgCarPower = Object.values(carStats).reduce((sum, val) => sum + val, 0) / 4;
            
            const skillBonus = 1 + (
                skills.driving * 0.002 +
                skills.speed * 0.002 +
                skills.reaction * 0.0015 +
                skills.technique * 0.0015
            );
            
            return avgCarPower * skillBonus;
        }
        
        calculateRaceFactors(car) {
            const factors = {
                playerMultiplier: 1,
                opponentMultiplier: 1,
                specialEvents: []
            };
            
            // Случайность (±5%)
            factors.playerMultiplier *= (0.95 + Math.random() * 0.1);
            factors.opponentMultiplier *= (0.95 + Math.random() * 0.1);
            
            // Нитро
            if (car.specialParts && car.specialParts.nitro && Math.random() < 0.3) {
                factors.playerMultiplier *= 1.2;
                factors.specialEvents.push('nitro');
                this.eventBus.emit('race:nitro', { message: '🚀 Нитро активировано!' });
            }
            
            // Погодные условия
            if (Math.random() < 0.1) {
                if (car.handling > 80) {
                    factors.playerMultiplier *= 1.1;
                    factors.specialEvents.push('rain_advantage');
                } else {
                    factors.playerMultiplier *= 0.95;
                    factors.specialEvents.push('rain_disadvantage');
                }
                this.eventBus.emit('race:weather', { type: 'rain' });
            }
            
            return factors;
        }
        
        calculateRaceTime(distance, baseTime, efficiency) {
            const time = baseTime * (100 / Math.max(efficiency, 1));
            return Math.max(time, this.security.limits.minRaceTime);
        }
        
        calculateRewards(won, opponent, betAmount) {
            const rewards = {
                money: 0,
                experience: 0,
                skills: []
            };
            
            if (won) {
                rewards.money = opponent.reward;
            } else {
                rewards.money = -betAmount;
            }
            
            // Опыт
            const baseXP = won ? 50 : 20;
            const difficultyBonus = Math.floor(opponent.difficulty * 30);
            const betBonus = Math.floor(betAmount / 100);
            rewards.experience = baseXP + difficultyBonus + betBonus;
            
            // Навыки
            rewards.skills = this.calculateSkillGains(won);
            
            return rewards;
        }
        
        calculateSkillGains(won) {
            const gains = [];
            const skills = ['driving', 'speed', 'reaction', 'technique'];
            const skillNamesRu = {
                driving: 'Вождение',
                speed: 'Скорость',
                reaction: 'Реакция',
                technique: 'Техника'
            };
            const baseChance = won ? 0.9 : 0.45;
            
            const attempts = Math.random() < 0.7 ? 1 : 2;
            
            for (let i = 0; i < attempts; i++) {
                const skill = skills[Math.floor(Math.random() * skills.length)];
                
                if (Math.random() < baseChance && !gains.find(g => g.skill === skill)) {
                    gains.push({
                        skill,
                        name: skillNamesRu[skill],
                        amount: 1
                    });
                }
            }
            
            return gains;
        }
        
        calculateFuelCost(difficulty) {
            const baseConsumption = 5;
            let multiplier = 1;
            
            if (difficulty >= 1.0 && difficulty < 1.4) multiplier = 1.5;
            else if (difficulty >= 1.4 && difficulty < 1.8) multiplier = 2;
            else if (difficulty >= 1.8) multiplier = 2.5;
            
            return Math.ceil(baseConsumption * multiplier);
        }
        
        calculateCurrentFuel(car) {
            if (!car.lastFuelUpdate) return car.fuel || 30;
            
            const now = Date.now();
            const lastUpdate = new Date(car.lastFuelUpdate).getTime();
            const minutesPassed = (now - lastUpdate) / 60000;
            const fuelRegenerated = Math.floor(minutesPassed / 10);
            
            return Math.min((car.fuel || 0) + fuelRegenerated, car.maxFuel || 30);
        }
        
        updateSessionStats(result) {
            this.sessionStats.races++;
            if (result.won) this.sessionStats.wins++;
            this.sessionStats.totalTime += result.playerTime;
            this.sessionStats.bestTime = Math.min(this.sessionStats.bestTime, result.playerTime);
        }
        
        getSessionStats() {
            return {
                ...this.sessionStats,
                winRate: this.sessionStats.races > 0 
                    ? (this.sessionStats.wins / this.sessionStats.races * 100).toFixed(1) 
                    : 0,
                avgTime: this.sessionStats.races > 0 
                    ? (this.sessionStats.totalTime / this.sessionStats.races).toFixed(2) 
                    : 0
            };
        }
    }
    
    // Экспортируем
    window.RaceManager = RaceManager;
    
})();