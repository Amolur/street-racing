// modules/garage.js
// Функционал гаража

import { gameData, allCars, fuelSystem } from './game-data.js';
import { updatePlayerInfo } from './utils.js';
import { upgradeConfig, getUpgradeCost, calculateTotalStats, getStatName, initializeCarUpgrades } from './upgrades.js';
import { dom } from './dom-manager.js';

// Кеш для предотвращения лишних перерисовок
let lastCarIndex = -1;
let lastCarData = null;

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

// Оптимизированное обновление отображения гаража
export function updateGarageDisplay() {
    if (!gameData || !gameData.cars || gameData.cars.length === 0) return;
    
    // Проверяем, изменилась ли машина
    if (lastCarIndex === gameData.currentCar && 
        lastCarData === JSON.stringify(gameData.cars[gameData.currentCar])) {
        return;
    }
    
    const currentCar = gameData.cars[gameData.currentCar];
    initializeCarUpgrades(currentCar);
    
    // Обновляем кеш
    lastCarIndex = gameData.currentCar;
    lastCarData = JSON.stringify(currentCar);
    
    // Батчим все обновления
    dom.batchUpdate(() => {
        updateCarShowcase(currentCar);
        
        // Обновляем активную вкладку
        const activeTab = dom.get('.tab-minimal.active');
        if (activeTab) {
            const tabIcon = activeTab.querySelector('.tab-icon');
            if (tabIcon) {
                const iconText = tabIcon.textContent;
                switch(iconText) {
                    case '🔧':
                        updateUpgradesMinimal();
                        break;
                    case '📊':
                        updateStatsDisplay();
                        break;
                    case '⚡':
                        updatePartsMinimal();
                        break;
                }
            }
        } else {
            updateUpgradesMinimal();
        }
    });
}

// Оптимизированное обновление витрины машины
function updateCarShowcase(car) {
    // Расчеты делаем один раз
    const totalStats = calculateTotalStats(car);
    const totalPower = Math.floor((totalStats.power + totalStats.speed + 
                                   totalStats.handling + totalStats.acceleration) / 4);
    const currentFuel = fuelSystem.getCurrentFuel(car);
    
    let rating = 'D';
    if (totalPower >= 90) rating = 'S';
    else if (totalPower >= 80) rating = 'A';
    else if (totalPower >= 70) rating = 'B';
    else if (totalPower >= 60) rating = 'C';
    
    const ratingColor = {
        'S': 'var(--neon-pink)',
        'A': 'var(--neon-yellow)',
        'B': 'var(--neon-green)',
        'C': 'var(--neon-cyan)',
        'D': 'var(--text-secondary)'
    }[rating];
    
    // Батчим все DOM обновления
    dom.batchUpdate(() => {
        dom.setText('#current-car-emoji', '🏎️');
        dom.setText('#current-car-name', car.name);
        dom.setText('#car-total-power', totalPower);
        dom.setText('#car-fuel-display', `${currentFuel}/${car.maxFuel || 30}`);
        dom.setText('#car-rating', rating);
        dom.setStyle('#car-rating', 'color', ratingColor);
        dom.setText('#car-counter', `${gameData.currentCar + 1}/${gameData.cars.length}`);
    });
    
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

// Оптимизированные улучшения с использованием DocumentFragment
function updateUpgradesMinimal() {
    const container = dom.get('#upgrades-list');
    if (!container) return;
    
    const currentCar = gameData.cars[gameData.currentCar];
    const fragment = document.createDocumentFragment();
    
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
        
        const upgradeEl = dom.createElement('div', {
            className: `upgrade-item-minimal ${isMaxed ? 'maxed' : ''}`,
            styles: { animationDelay: `${index * 0.1}s` },
            html: `
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
                        data-upgrade-type="${upgradeType}"
                        ${!canUpgrade ? 'disabled' : ''}>
                    ${isMaxed ? 'MAX' : `$${cost}`}
                </button>
            `
        });
        
        fragment.appendChild(upgradeEl);
    });
    
    // Очищаем и добавляем все за один раз
    dom.empty('#upgrades-list');
    container.appendChild(fragment);
}

// Оптимизированное отображение статистики
function updateStatsDisplay() {
    const currentCar = gameData.cars[gameData.currentCar];
    const totalStats = calculateTotalStats(currentCar);
    
    dom.batchUpdate(() => {
        ['power', 'speed', 'handling', 'acceleration'].forEach(stat => {
            dom.setText(`#stat-${stat}`, totalStats[stat]);
            dom.setStyle(`#fill-${stat}`, 'width', `${Math.min(totalStats[stat], 100)}%`);
        });
    });
}

// Кеш для деталей
let lastPartsState = null;

function updatePartsMinimal() {
    const container = dom.get('#special-parts-list');
    if (!container) return;
    
    const currentCar = gameData.cars[gameData.currentCar];
    const currentState = JSON.stringify(currentCar.specialParts);
    
    // Проверяем, изменились ли детали
    if (lastPartsState === currentState) return;
    lastPartsState = currentState;
    
    const fragment = document.createDocumentFragment();
    
    const parts = [
        { type: 'nitro', name: 'Нитро', icon: '🚀', effect: '+20% скорость (30% шанс)', price: 15000 },
        { type: 'bodyKit', name: 'Обвес', icon: '🎨', effect: '+10 ко всем хар-кам', price: 25000 },
        { type: 'ecuTune', name: 'Чип-тюнинг', icon: '💻', effect: '+15% эффективность', price: 20000 }
    ];
    
    parts.forEach((part, index) => {
        const isOwned = currentCar.specialParts[part.type];
        const canBuy = !isOwned && gameData.money >= part.price;
        
        const partEl = dom.createElement('div', {
            className: `part-item-minimal ${isOwned ? 'owned' : ''}`,
            styles: { animationDelay: `${index * 0.1}s` },
            html: `
                <div class="part-icon">${part.icon}</div>
                <div class="part-info">
                    <div class="part-name">${part.name}</div>
                    <div class="part-effect">${part.effect}</div>
                    ${!isOwned ? `<div class="part-price">$${part.price.toLocaleString()}</div>` : ''}
                </div>
                ${isOwned ? 
                    '<span style="color: var(--neon-green); font-weight: 700;">✓</span>' :
                    `<button class="upgrade-button" 
                            data-part-type="${part.type}"
                            data-part-price="${part.price}"
                            ${!canBuy ? 'disabled' : ''}>
                        Купить
                    </button>`
                }
            `
        });
        
        fragment.appendChild(partEl);
    });
    
    dom.empty('#special-parts-list');
    container.appendChild(fragment);
}

// Переключение вкладок с дебаунсом
export const showGarageTab = dom.debounce((tab) => {
    dom.batchUpdate(() => {
        // Удаляем активные классы
        dom.getAll('.tab-minimal').forEach(btn => btn.classList.remove('active'));
        dom.getAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Активируем нужную вкладку
        switch(tab) {
            case 'upgrades':
                dom.addClass('.tab-minimal:nth-child(1)', 'active');
                dom.addClass('#tab-upgrades', 'active');
                setTimeout(() => updateUpgradesMinimal(), 10);
                break;
            case 'stats':
                dom.addClass('.tab-minimal:nth-child(2)', 'active');
                dom.addClass('#tab-stats', 'active');
                setTimeout(() => updateStatsDisplay(), 10);
                break;
            case 'parts':
                dom.addClass('.tab-minimal:nth-child(3)', 'active');
                dom.addClass('#tab-parts', 'active');
                setTimeout(() => updatePartsMinimal(), 10);
                break;
        }
    });
}, 50);

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

// Делегирование событий для улучшений
dom.delegate('#upgrades-list', 'click', '.upgrade-button', function(e) {
    const upgradeType = this.dataset.upgradeType;
    if (upgradeType) {
        window.upgradeComponent(upgradeType);
    }
});

// Делегирование для покупки деталей
dom.delegate('#special-parts-list', 'click', '.upgrade-button', function(e) {
    const partType = this.dataset.partType;
    const partPrice = parseInt(this.dataset.partPrice);
    if (partType && partPrice) {
        window.buySpecialPart(partType, partPrice);
    }
});
function initGarageEventDelegation() {
    // Для улучшений
    const upgradesList = document.getElementById('upgrades-list');
    if (upgradesList) {
        upgradesList.addEventListener('click', function(e) {
            const button = e.target.closest('.upgrade-button');
            if (button && button.dataset.upgradeType) {
                window.upgradeComponent(button.dataset.upgradeType);
            }
        });
    }
    
    // Для специальных деталей
    const partsList = document.getElementById('special-parts-list');
    if (partsList) {
        partsList.addEventListener('click', function(e) {
            const button = e.target.closest('.upgrade-button');
            if (button && button.dataset.partType) {
                const partType = button.dataset.partType;
                const partPrice = parseInt(button.dataset.partPrice);
                if (partType && partPrice) {
                    window.buySpecialPart(partType, partPrice);
                }
            }
        });
    }
}

// Вызываем инициализацию при переходе в гараж
const originalUpdateGarageDisplay = updateGarageDisplay;
export function updateGarageDisplay() {
    originalUpdateGarageDisplay();
    // Инициализируем делегирование после обновления DOM
    setTimeout(() => {
        initGarageEventDelegation();
    }, 100);
}

// Переопределяем showGarageTab для правильной работы
export function showGarageTab(tab) {
    // Удаляем активные классы
    document.querySelectorAll('.tab-minimal').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Активируем нужную вкладку
    let tabButton, tabContent;
    
    switch(tab) {
        case 'upgrades':
            tabButton = document.querySelector('.tab-minimal:nth-child(1)');
            tabContent = document.getElementById('tab-upgrades');
            break;
        case 'stats':
            tabButton = document.querySelector('.tab-minimal:nth-child(2)');
            tabContent = document.getElementById('tab-stats');
            break;
        case 'parts':
            tabButton = document.querySelector('.tab-minimal:nth-child(3)');
            tabContent = document.getElementById('tab-parts');
            break;
    }
    
    if (tabButton) tabButton.classList.add('active');
    if (tabContent) tabContent.classList.add('active');
    
    // Обновляем содержимое вкладки
    setTimeout(() => {
        switch(tab) {
            case 'upgrades':
                updateUpgradesMinimal();
                break;
            case 'stats':
                updateStatsDisplay();
                break;
            case 'parts':
                updatePartsMinimal();
                break;
        }
        // Реинициализируем делегирование
        initGarageEventDelegation();
    }, 10);
}
// Делаем функции доступными глобально
window.updateGarageDisplay = updateGarageDisplay;
window.updateUpgradesMinimal = updateUpgradesMinimal;
window.updateStatsDisplay = updateStatsDisplay;
window.updatePartsMinimal = updatePartsMinimal;