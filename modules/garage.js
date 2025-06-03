// modules/garage.js
// Функционал гаража

import { gameData, allCars, fuelSystem } from './game-data.js';
import { updatePlayerInfo } from './utils.js';
import { upgradeConfig, getUpgradeCost, calculateTotalStats, getStatName, initializeCarUpgrades } from './upgrades.js';

// Переключение между машинами
export function previousCar() {
    if (gameData.currentCar > 0) {
        gameData.currentCar--;
        updateGarageDisplay();
    }
}

export function nextCar() {
    if (gameData.currentCar < gameData.cars.length - 1) {
        gameData.currentCar++;
        updateGarageDisplay();
    }
}

// Обновление отображения гаража
export function updateGarageDisplay() {
    if (!gameData || !gameData.cars || gameData.cars.length === 0) return;
    
    const currentCar = gameData.cars[gameData.currentCar];
    initializeCarUpgrades(currentCar);
    
    // Обновляем превью машины
    updateCarShowcase(currentCar);
    
    // Обновляем активную вкладку
    const activeTab = document.querySelector('.tab-minimal.active');
    if (activeTab) {
        const tabText = activeTab.textContent.trim();
        if (tabText.includes('Улучшения')) {
            updateUpgradesMinimal();
        } else if (tabText.includes('Статистика')) {
            updateStatsDisplay();
        } else if (tabText.includes('Детали')) {
            updatePartsMinimal();
        }
    }
}

// Новая функция для обновления витрины машины
function updateCarShowcase(car) {
    // Emoji машины
    const emojiEl = document.getElementById('current-car-emoji');
    if (emojiEl) emojiEl.textContent = '🏎️';
    
    // Название машины
    const nameEl = document.getElementById('current-car-name');
    if (nameEl) nameEl.textContent = car.name;
    
    // Общая мощность
    const totalStats = calculateTotalStats(car);
    const totalPower = Math.floor((totalStats.power + totalStats.speed + 
                                   totalStats.handling + totalStats.acceleration) / 4);
    
    const powerEl = document.getElementById('car-total-power');
    if (powerEl) powerEl.textContent = totalPower;
    
    // Топливо
    const currentFuel = fuelSystem.getCurrentFuel(car);
    const fuelEl = document.getElementById('car-fuel-display');
    if (fuelEl) fuelEl.textContent = `${currentFuel}/${car.maxFuel || 30}`;
    
    // Рейтинг
    let rating = 'D';
    if (totalPower >= 90) rating = 'S';
    else if (totalPower >= 80) rating = 'A';
    else if (totalPower >= 70) rating = 'B';
    else if (totalPower >= 60) rating = 'C';
    
    const ratingEl = document.getElementById('car-rating');
    if (ratingEl) {
        ratingEl.textContent = rating;
        ratingEl.style.color = 
            rating === 'S' ? 'var(--neon-pink)' :
            rating === 'A' ? 'var(--neon-yellow)' :
            rating === 'B' ? 'var(--neon-green)' :
            rating === 'C' ? 'var(--neon-cyan)' : 'var(--text-secondary)';
    }
    
    // Счетчик машин
    const counterEl = document.getElementById('car-counter');
    if (counterEl) {
        counterEl.textContent = `${gameData.currentCar + 1}/${gameData.cars.length}`;
    }
    
    // Обновляем кнопки навигации
    updateNavigationButtons();
}

// Обновление кнопок навигации
function updateNavigationButtons() {
    const navButtons = document.querySelectorAll('.nav-arrow');
    if (navButtons.length < 2) return;
    
    const prevBtn = navButtons[0];
    const nextBtn = navButtons[1];
    
    if (prevBtn) {
        prevBtn.disabled = gameData.currentCar === 0;
    }
    
    if (nextBtn) {
        nextBtn.disabled = gameData.currentCar === gameData.cars.length - 1;
    }
}

// Новая функция для минималистичных улучшений
function updateUpgradesMinimal() {
    const container = document.getElementById('upgrades-list');
    if (!container) return;
    
    const currentCar = gameData.cars[gameData.currentCar];
    container.innerHTML = '';
    
    let maxUpgradeLevel = 10;
    if (currentCar.price === 0 || currentCar.price <= 8000) {
        maxUpgradeLevel = 5;
    } else if (currentCar.price <= 35000) {
        maxUpgradeLevel = 7;
    }
    
    Object.keys(upgradeConfig).forEach((upgradeType, index) => {
        const config = upgradeConfig[upgradeType];
        const currentLevel = currentCar.upgrades[upgradeType] || 0;
        const cost = getUpgradeCost(upgradeType, currentLevel);
        const canUpgrade = currentLevel < maxUpgradeLevel && gameData.money >= cost;
        const isMaxed = currentLevel >= maxUpgradeLevel;
        
        const upgradeEl = document.createElement('div');
        upgradeEl.className = `upgrade-item-minimal ${isMaxed ? 'maxed' : ''}`;
        upgradeEl.style.animationDelay = `${index * 0.1}s`;
        
        upgradeEl.innerHTML = `
            <div class="upgrade-icon-wrapper">
                ${config.icon}
            </div>
            <div class="upgrade-content">
                <div class="upgrade-title">${config.name}</div>
                <div class="upgrade-level">Уровень ${currentLevel}/${maxUpgradeLevel}</div>
                <div class="upgrade-progress">
                    <div class="upgrade-progress-fill" style="width: ${(currentLevel / maxUpgradeLevel) * 100}%"></div>
                </div>
            </div>
            <button class="upgrade-button" 
                    onclick="upgradeComponent('${upgradeType}')" 
                    ${!canUpgrade ? 'disabled' : ''}>
                ${isMaxed ? 'MAX' : `$${cost}`}
            </button>
        `;
        
        container.appendChild(upgradeEl);
    });
}

// Новая функция для отображения статистики
function updateStatsDisplay() {
    const currentCar = gameData.cars[gameData.currentCar];
    const totalStats = calculateTotalStats(currentCar);
    
    // Обновляем значения
    const statTypes = ['power', 'speed', 'handling', 'acceleration'];
    statTypes.forEach(stat => {
        const valueEl = document.getElementById(`stat-${stat}`);
        const fillEl = document.getElementById(`fill-${stat}`);
        
        if (valueEl) valueEl.textContent = totalStats[stat];
        if (fillEl) fillEl.style.width = `${Math.min(totalStats[stat], 100)}%`;
    });
}

// Новая функция для минималистичных деталей
function updatePartsMinimal() {
    const container = document.getElementById('special-parts-list');
    if (!container) return;
    
    const currentCar = gameData.cars[gameData.currentCar];
    container.innerHTML = '';
    
    const parts = [
        { type: 'nitro', name: 'Нитро', icon: '🚀', effect: '+20% скорость (30% шанс)', price: 15000 },
        { type: 'bodyKit', name: 'Обвес', icon: '🎨', effect: '+10 ко всем хар-кам', price: 25000 },
        { type: 'ecuTune', name: 'Чип-тюнинг', icon: '💻', effect: '+15% эффективность', price: 20000 }
    ];
    
    parts.forEach((part, index) => {
        const isOwned = currentCar.specialParts[part.type];
        const canBuy = !isOwned && gameData.money >= part.price;
        
        const partEl = document.createElement('div');
        partEl.className = `part-item-minimal ${isOwned ? 'owned' : ''}`;
        partEl.style.animationDelay = `${index * 0.1}s`;
        
        partEl.innerHTML = `
            <div class="part-icon">${part.icon}</div>
            <div class="part-info">
                <div class="part-name">${part.name}</div>
                <div class="part-effect">${part.effect}</div>
                ${!isOwned ? `<div class="part-price">$${part.price.toLocaleString()}</div>` : ''}
            </div>
            ${isOwned ? 
                '<span style="color: var(--neon-green); font-weight: 700;">✓</span>' :
                `<button class="upgrade-button" 
                        onclick="buySpecialPart('${part.type}', ${part.price})" 
                        ${!canBuy ? 'disabled' : ''}>
                    Купить
                </button>`
            }
        `;
        
        container.appendChild(partEl);
    });
}

// Переключение вкладок гаража
export function showGarageTab(tab) {
    // Обновляем кнопки вкладок
    document.querySelectorAll('.tab-minimal').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Находим нужную вкладку по типу
    let tabButton, tabContent;
    
    switch(tab) {
        case 'upgrades':
            tabButton = document.querySelector('.tab-minimal:nth-child(1)');
            tabContent = document.getElementById('tab-upgrades');
            setTimeout(() => updateUpgradesMinimal(), 10);
            break;
        case 'stats':
            tabButton = document.querySelector('.tab-minimal:nth-child(2)');
            tabContent = document.getElementById('tab-stats');
            setTimeout(() => updateStatsDisplay(), 10);
            break;
        case 'parts':
            tabButton = document.querySelector('.tab-minimal:nth-child(3)');
            tabContent = document.getElementById('tab-parts');
            setTimeout(() => updatePartsMinimal(), 10);
            break;
    }
    
    if (tabButton) tabButton.classList.add('active');
    if (tabContent) tabContent.classList.add('active');
}

// ============================================
// СТАРЫЕ ФУНКЦИИ ДЛЯ СОВМЕСТИМОСТИ
// ============================================

// Отображение превью машин
export function updateCarsPreview() {
    const carsList = document.getElementById('cars-list');
    const carCounter = document.getElementById('car-counter');
    
    if (!carsList || !gameData.cars) return;
    
    carsList.innerHTML = '';
    
    gameData.cars.forEach((car, index) => {
        initializeCarUpgrades(car);
        const totalUpgrades = car.upgrades ? 
            Object.values(car.upgrades).reduce((sum, level) => sum + level, 0) : 0;
        
        const carCard = document.createElement('div');
        carCard.className = `car-card ${index === gameData.currentCar ? 'active' : ''}`;
        
        // Находим полную информацию о машине
        const carInfo = allCars.find(c => c.id === car.id);
        
        carCard.innerHTML = `
            ${carInfo && carInfo.image ? 
                `<img src="${carInfo.image}" alt="${car.name}" class="car-image">` :
                `<div class="car-emoji-big">🏎️</div>`
            }
            <div class="car-name">${car.name}</div>
            ${totalUpgrades > 0 ? `<div class="car-upgrade-badge">+${totalUpgrades}</div>` : ''}
        `;
        
        carsList.appendChild(carCard);
    });
    
    // Обновляем позицию карусели
    const currentIndex = gameData.currentCar;
    carsList.style.transform = `translateX(-${currentIndex * 100}%)`;
    
    // Обновляем счетчик
    if (carCounter) {
        carCounter.textContent = `${gameData.currentCar + 1} / ${gameData.cars.length}`;
    }
    
    // Обновляем кнопки навигации
    updateNavigationButtons();
}

// Обновление статистики текущей машины
export function updateCurrentCarStats() {
    if (!gameData.cars || !gameData.cars[gameData.currentCar]) return;
    
    const currentCar = gameData.cars[gameData.currentCar];
    initializeCarUpgrades(currentCar);
    
    const totalStats = calculateTotalStats(currentCar);
    const totalUpgrades = currentCar.upgrades ? 
        Object.values(currentCar.upgrades).reduce((sum, level) => sum + level, 0) : 0;
    
    // Обновляем статистики
    const powerEl = document.getElementById('garage-power');
    const speedEl = document.getElementById('garage-speed');
    const handlingEl = document.getElementById('garage-handling');
    const accelerationEl = document.getElementById('garage-acceleration');
    
    if (powerEl) powerEl.textContent = totalStats.power;
    if (speedEl) speedEl.textContent = totalStats.speed;
    if (handlingEl) handlingEl.textContent = totalStats.handling;
    if (accelerationEl) accelerationEl.textContent = totalStats.acceleration;
    
    // Обновляем счетчик улучшений
    const totalUpgradesEl = document.getElementById('total-upgrades');
    if (totalUpgradesEl) {
        totalUpgradesEl.textContent = totalUpgrades;
    }
    
    // Рассчитываем рейтинг машины
    const avgStat = Math.floor((totalStats.power + totalStats.speed + totalStats.handling + totalStats.acceleration) / 4);
    const carRatingEl = document.getElementById('car-rating');
    if (carRatingEl) {
        let rating = 'D';
        if (avgStat >= 90) rating = 'S';
        else if (avgStat >= 80) rating = 'A';
        else if (avgStat >= 70) rating = 'B';
        else if (avgStat >= 60) rating = 'C';
        
        carRatingEl.textContent = rating;
        carRatingEl.style.color = 
            rating === 'S' ? 'var(--neon-pink)' :
            rating === 'A' ? 'var(--neon-yellow)' :
            rating === 'B' ? 'var(--neon-green)' :
            rating === 'C' ? 'var(--neon-cyan)' : 'var(--text-secondary)';
    }
}

// Отображение улучшений
export function updateUpgradesDisplay() {
    const upgradesGrid = document.getElementById('upgrades-grid');
    
    if (!upgradesGrid || !gameData.cars || !gameData.cars[gameData.currentCar]) return;
    
    const currentCar = gameData.cars[gameData.currentCar];
    initializeCarUpgrades(currentCar);
    
    upgradesGrid.innerHTML = '';
    
    // Ограничения по уровню машины
    let maxUpgradeLevel = 10;
    if (currentCar.price === 0 || currentCar.price <= 8000) {
        maxUpgradeLevel = 5;
    } else if (currentCar.price <= 35000) {
        maxUpgradeLevel = 7;
    }
    
    Object.keys(upgradeConfig).forEach(upgradeType => {
        const config = upgradeConfig[upgradeType];
        const currentLevel = currentCar.upgrades[upgradeType] || 0;
        const cost = getUpgradeCost(upgradeType, currentLevel);
        const canUpgrade = currentLevel < maxUpgradeLevel && gameData.money >= cost;
        
        const upgradeCard = document.createElement('div');
        upgradeCard.className = 'upgrade-card-compact';
        
        upgradeCard.innerHTML = `
            <div class="upgrade-icon-big">${config.icon}</div>
            <div class="upgrade-info">
                <div class="upgrade-name">${config.name}</div>
                <div class="upgrade-level-bar">
                    <div class="upgrade-progress-mini">
                        <div class="upgrade-progress-fill-mini" style="width: ${(currentLevel / maxUpgradeLevel) * 100}%"></div>
                    </div>
                    <span class="upgrade-level-text">${currentLevel}/${maxUpgradeLevel}</span>
                </div>
                <div class="upgrade-effects">
                    ${Object.entries(config.affects).map(([stat, value]) => {
                        const statName = getStatName(stat);
                        return `+${value} ${statName}`;
                    }).join(', ')}
                </div>
            </div>
            <div class="upgrade-action">
                <button class="btn-upgrade-mini" 
                        onclick="upgradeComponent('${upgradeType}')" 
                        ${!canUpgrade ? 'disabled' : ''}>
                    ${currentLevel >= maxUpgradeLevel ? 'МАКС' :
                      gameData.money < cost ? `$${cost.toLocaleString()}` : 
                      `$${cost.toLocaleString()}`}
                </button>
            </div>
        `;
        
        upgradesGrid.appendChild(upgradeCard);
    });
}

// Отображение специальных деталей
export function updateSpecialPartsDisplay() {
    const currentCar = gameData.cars[gameData.currentCar];
    const partsGrid = document.getElementById('special-parts-grid');
    
    if (!partsGrid || !currentCar) return;
    
    const specialParts = [
        { type: 'nitro', name: 'Нитро', icon: '🚀', desc: '+20% к скорости (шанс 30%)', price: 15000 },
        { type: 'bodyKit', name: 'Спорт. обвес', icon: '🎨', desc: '+10 ко всем характеристикам', price: 25000 },
        { type: 'ecuTune', name: 'Чип-тюнинг', icon: '💻', desc: '+15% к эффективности', price: 20000 }
    ];
    
    partsGrid.innerHTML = '';
    
    specialParts.forEach(part => {
        const isOwned = currentCar.specialParts[part.type];
        const canBuy = !isOwned && gameData.money >= part.price;
        
        const partCard = document.createElement('div');
        partCard.className = `special-part-card ${isOwned ? 'owned' : ''}`;
        
        partCard.innerHTML = `
            <div class="special-icon-big">${part.icon}</div>
            <div class="special-part-info">
                <div class="special-part-name">${part.name}</div>
                <div class="special-part-desc">${part.desc}</div>
                ${isOwned ? 
                    '<div class="special-part-owned">✅ Установлено</div>' :
                    `<div class="special-part-price">$${part.price.toLocaleString()}</div>`
                }
            </div>
            <div class="special-part-action">
                ${isOwned ? 
                    '<span class="special-part-owned">КУПЛЕНО</span>' :
                    `<button class="btn-upgrade-mini" 
                            onclick="buySpecialPart('${part.type}', ${part.price})" 
                            ${!canBuy ? 'disabled' : ''}>
                        ${canBuy ? 'КУПИТЬ' : 'НЕТ $'}
                    </button>`
                }
            </div>
        `;
        
        partsGrid.appendChild(partCard);
    });
}

// Делаем функцию доступной глобально для обновления из других модулей
window.updateGarageDisplay = updateGarageDisplay;