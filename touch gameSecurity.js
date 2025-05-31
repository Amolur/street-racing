// gameSecurity.js - Система безопасности и валидации

(function() {
    'use strict';
    
    class GameSecurity {
        constructor() {
            this.secretKey = this.generateKey();
            
            this.limits = {
                maxMoney: 10000000,
                maxLevel: 100,
                maxCarStats: 150,
                maxUpgradeLevel: 10,
                minRaceTime: 30,
                maxWinStreak: 20
            };
            
            this.suspiciousActivity = {
                rapidMoneyGain: 0,
                impossibleWins: 0,
                modifiedData: 0
            };
        }
        
        generateKey() {
            return btoa(Math.random().toString(36).substring(2) + Date.now());
        }
        
        signData(data) {
            const jsonStr = JSON.stringify(data);
            const hash = this.simpleHash(jsonStr + this.secretKey);
            return { data, signature: hash };
        }
        
        verifyData(signedData) {
            if (!signedData || !signedData.signature) return false;
            
            const jsonStr = JSON.stringify(signedData.data);
            const expectedHash = this.simpleHash(jsonStr + this.secretKey);
            return expectedHash === signedData.signature;
        }
        
        simpleHash(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return hash.toString(36);
        }
        
        validateGameData(gameData) {
            const errors = [];
            
            // Проверка денег
            if (gameData.money < 0 || gameData.money > this.limits.maxMoney) {
                errors.push('Invalid money amount');
            }
            
            // Проверка уровня
            if (gameData.level < 1 || gameData.level > this.limits.maxLevel) {
                errors.push('Invalid level');
            }
            
            // Проверка машин
            if (!Array.isArray(gameData.cars) || gameData.cars.length === 0) {
                errors.push('Invalid cars array');
            } else {
                gameData.cars.forEach((car, index) => {
                    const carErrors = this.validateCar(car);
                    if (carErrors.length > 0) {
                        errors.push(`Car ${index}: ${carErrors.join(', ')}`);
                    }
                });
            }
            
            // Проверка навыков
            const skills = ['driving', 'speed', 'reaction', 'technique'];
            skills.forEach(skill => {
                if (gameData.skills[skill] < 1 || gameData.skills[skill] > 10) {
                    errors.push(`Invalid skill ${skill}: ${gameData.skills[skill]}`);
                }
            });
            
            return {
                isValid: errors.length === 0,
                errors
            };
        }
        
        validateCar(car) {
            const errors = [];
            const stats = ['power', 'speed', 'handling', 'acceleration'];
            
            stats.forEach(stat => {
                const totalStat = car[stat] + (car.upgrades ? this.calculateUpgradeBonus(car, stat) : 0);
                if (totalStat > this.limits.maxCarStats) {
                    errors.push(`${stat} exceeds limit`);
                }
            });
            
            if (car.upgrades) {
                Object.values(car.upgrades).forEach(level => {
                    if (level > this.limits.maxUpgradeLevel) {
                        errors.push('Upgrade level exceeds limit');
                    }
                });
            }
            
            return errors;
        }
        
        calculateUpgradeBonus(car, stat) {
            let bonus = 0;
            const upgradeConfig = {
                engine: { power: 5, speed: 3 },
                turbo: { acceleration: 4, power: 2 },
                tires: { handling: 3, acceleration: 2 },
                suspension: { handling: 5 },
                transmission: { speed: 3, acceleration: 3 }
            };
            
            Object.keys(car.upgrades || {}).forEach(upgrade => {
                const config = upgradeConfig[upgrade];
                if (config && config[stat]) {
                    bonus += config[stat] * (car.upgrades[upgrade] || 0);
                }
            });
            
            return bonus;
        }
        
        validateRaceResult(playerCar, opponentDifficulty, raceTime, won) {
            if (raceTime < this.limits.minRaceTime) {
                this.suspiciousActivity.impossibleWins++;
                return false;
            }
            
            const playerPower = this.calculateCarPower(playerCar);
            const opponentPower = 60 * opponentDifficulty;
            
            if (won && playerPower < opponentPower * 0.5) {
                this.suspiciousActivity.impossibleWins++;
                return false;
            }
            
            return true;
        }
        
        calculateCarPower(car) {
            const baseStats = car.power + car.speed + car.handling + car.acceleration;
            const upgradeBonus = this.calculateTotalUpgradeBonus(car);
            return (baseStats + upgradeBonus) / 4;
        }
        
        calculateTotalUpgradeBonus(car) {
            let totalBonus = 0;
            const stats = ['power', 'speed', 'handling', 'acceleration'];
            
            stats.forEach(stat => {
                totalBonus += this.calculateUpgradeBonus(car, stat);
            });
            
            return totalBonus;
        }
        
        checkMoneyGain(oldAmount, newAmount, expectedGain) {
            const actualGain = newAmount - oldAmount;
            
            if (actualGain > expectedGain * 1.1) {
                this.suspiciousActivity.rapidMoneyGain++;
                return false;
            }
            
            return true;
        }
        
        getSuspiciousActivityReport() {
            const total = Object.values(this.suspiciousActivity).reduce((sum, val) => sum + val, 0);
            return {
                total,
                details: { ...this.suspiciousActivity },
                isSuspicious: total > 5
            };
        }
        
        clearSuspiciousActivity() {
            Object.keys(this.suspiciousActivity).forEach(key => {
                this.suspiciousActivity[key] = 0;
            });
        }
        
        encryptData(data) {
            const jsonStr = JSON.stringify(data);
            return btoa(encodeURIComponent(jsonStr).split('').reverse().join(''));
        }
        
        decryptData(encryptedData) {
            try {
                const decoded = decodeURIComponent(atob(encryptedData).split('').reverse().join(''));
                return JSON.parse(decoded);
            } catch (e) {
                console.error('Failed to decrypt data:', e);
                return null;
            }
        }
    }
    
    class SecureStorage {
        constructor(security) {
            this.security = security;
            this.storage = window.storage || window.localStorage; // Используем вашу обертку storage
        }
        
        setItem(key, value) {
            try {
                const encrypted = this.security.encryptData(value);
                const signed = this.security.signData(encrypted);
                this.storage.setItem(key, JSON.stringify(signed));
            } catch (e) {
                console.error('Failed to save secure data:', e);
            }
        }
        
        getItem(key) {
            try {
                const item = this.storage.getItem(key);
                if (!item) return null;
                
                const signed = JSON.parse(item);
                if (!this.security.verifyData(signed)) {
                    console.warn('Data signature verification failed');
                    this.security.suspiciousActivity.modifiedData++;
                    return null;
                }
                
                return this.security.decryptData(signed.data);
            } catch (e) {
                console.error('Failed to retrieve secure data:', e);
                return null;
            }
        }
        
        removeItem(key) {
            this.storage.removeItem(key);
        }
    }
    
    // Экспортируем
    window.GameSecurity = GameSecurity;
    window.SecureStorage = SecureStorage;
    
})();