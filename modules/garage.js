// modules/garage.js
// Функционал гаража

import { gameData, allCars } from './game-data.js';
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
    
    updateCarsPreview();
    updateCurrentCarStats();
    
    // Проверяем, какая вкладка активна
    const activeTab = document.querySelector('.garage-tab-modern.active');
    if (activeTab) {
        const isUpgradesTab = activeTab.textContent.includes('Улучшения');
        if (isUpgradesTab) {
            updateUpgradesDisplay();
        } else {
            updateSpecialPartsDisplay();
        }
    } else {
        updateUpgradesDisplay();
    }
}

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

// Обновление кнопок навигации
function updateNavigationButtons() {
    const navButtons = document.querySelectorAll('.nav-btn');
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

// Переключение вкладок гаража
export function showGarageTab(tab) {
    // Обновляем кнопки вкладок
    document.querySelectorAll('.garage-tab-modern').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.garage-tab-content').forEach(content => content.classList.remove('active'));
    
    if (tab === 'upgrades') {
        const upgradesTab = document.querySelector('.garage-tab-modern:first-child');
        const upgradesContent = document.getElementById('garage-upgrades-modern');
        
        if (upgradesTab) upgradesTab.classList.add('active');
        if (upgradesContent) upgradesContent.classList.add('active');
        
        setTimeout(() => {
            updateUpgradesDisplay();
        }, 10);
        
    } else if (tab === 'parts') {
        const partsTab = document.querySelector('.garage-tab-modern:last-child');
        const partsContent = document.getElementById('garage-parts-modern');
        
        if (partsTab) partsTab.classList.add('active');
        if (partsContent) partsContent.classList.add('active');
        
        setTimeout(() => {
            updateSpecialPartsDisplay();
        }, 10);
    }
}

// Делаем функцию доступной глобально для обновления из других модулей
window.updateGarageDisplay = updateGarageDisplay;