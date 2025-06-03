// modules/garage.js
// Функционал гаража с новым UI

import { gameData, fuelSystem } from './game-data.js';
import { updatePlayerInfo } from './utils.js';
import { upgradeConfig, getUpgradeCost, calculateTotalStats, initializeCarUpgrades } from './upgrades.js';
import { createUpgradeItem } from './ui-components.js';

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
    
    // Обновляем информацию о машине
    updateCarInfo(currentCar);
    
    // Обновляем активную вкладку
    const activeTab = document.querySelector('.tab-button.active');
    if (activeTab) {
        const tabText = activeTab.textContent.trim();
        switch(tabText) {
            case 'Улучшения':
                updateUpgradesTab();
                break;
            case 'Статистика':
                updateStatsTab();
                break;
            case 'Детали':
                updatePartsTab();
                break;
        }
    } else {
        updateUpgradesTab();
    }
}

// Обновление информации о машине
function updateCarInfo(car) {
    const totalStats = calculateTotalStats(car);
    const totalPower = Math.floor((totalStats.power + totalStats.speed + 
                                   totalStats.handling + totalStats.acceleration) / 4);
    const currentFuel = fuelSystem.getCurrentFuel(car);
    
    let rating = 'D';
    if (totalPower >= 90) rating = 'S';
    else if (totalPower >= 80) rating = 'A';
    else if (totalPower >= 70) rating = 'B';
    else if (totalPower >= 60) rating = 'C';
    
    // Обновляем элементы
    document.getElementById('current-car-name').textContent = car.name;
    document.getElementById('car-power').textContent = totalPower;
    document.getElementById('car-fuel-display').textContent = `${currentFuel}/${car.maxFuel || 30}`;
    document.getElementById('car-rating').textContent = rating;
    document.getElementById('car-counter').textContent = `${gameData.currentCar + 1}/${gameData.cars.length}`;
    
    // Обновляем состояние кнопок навигации
    const prevBtn = document.querySelector('.car-navigation .nav-button:first-child');
    const nextBtn = document.querySelector('.car-navigation .nav-button:last-child');
    
    if (prevBtn) prevBtn.disabled = gameData.currentCar === 0;
    if (nextBtn) nextBtn.disabled = gameData.currentCar === gameData.cars.length - 1;
}

// Вкладка улучшений
function updateUpgradesTab() {
    const container = document.getElementById('upgrades-list');
    if (!container) return;
    
    const currentCar = gameData.cars[gameData.currentCar];
    
    let maxUpgradeLevel = 10;
    if (currentCar.price === 0 || currentCar.price <= 8000) {
        maxUpgradeLevel = 5;
    } else if (currentCar.price <= 35000) {
        maxUpgradeLevel = 7;
    }
    
    const upgradesHTML = Object.keys(upgradeConfig).map(upgradeType => {
        const config = upgradeConfig[upgradeType];
        const currentLevel = currentCar.upgrades[upgradeType] || 0;
        const cost = getUpgradeCost(upgradeType, currentLevel);
        const canUpgrade = currentLevel < maxUpgradeLevel && gameData.money >= cost;
        
        return createUpgradeItem(upgradeType, config, currentLevel, maxUpgradeLevel, cost, canUpgrade);
    }).join('');
    
    container.innerHTML = upgradesHTML;
}

// Вкладка статистики
function updateStatsTab() {
    const container = document.getElementById('stats-list');
    if (!container) return;
    
    const currentCar = gameData.cars[gameData.currentCar];
    const totalStats = calculateTotalStats(currentCar);
    
    container.innerHTML = `
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-label">Мощность</div>
                <div class="stat-value">${totalStats.power}</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(totalStats.power, 100)}%"></div>
                </div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Скорость</div>
                <div class="stat-value">${totalStats.speed}</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(totalStats.speed, 100)}%"></div>
                </div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Управление</div>
                <div class="stat-value">${totalStats.handling}</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(totalStats.handling, 100)}%"></div>
                </div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Разгон</div>
                <div class="stat-value">${totalStats.acceleration}</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(totalStats.acceleration, 100)}%"></div>
                </div>
            </div>
        </div>
    `;
}

// Вкладка специальных деталей
function updatePartsTab() {
    const container = document.getElementById('special-parts-list');
    if (!container) return;
    
    const currentCar = gameData.cars[gameData.currentCar];
    
    const parts = [
        { type: 'nitro', name: 'Нитро', effect: '+20% скорость (30% шанс)', price: 15000 },
        { type: 'bodyKit', name: 'Обвес', effect: '+10 ко всем характеристикам', price: 25000 },
        { type: 'ecuTune', name: 'Чип-тюнинг', effect: '+15% эффективность', price: 20000 }
    ];
    
    const partsHTML = parts.map(part => {
        const isOwned = currentCar.specialParts[part.type];
        const canBuy = !isOwned && gameData.money >= part.price;
        
        return `
            <div class="list-item part-item ${isOwned ? 'owned' : ''}">
                <div class="list-item-content">
                    <div class="list-item-title">${part.name}</div>
                    <div class="list-item-subtitle">${part.effect}</div>
                    ${!isOwned ? `<div class="part-price">$${part.price.toLocaleString()}</div>` : ''}
                </div>
                ${isOwned ? 
                    '<span class="part-owned">✓ Установлено</span>' :
                    `<button class="action-button small" 
                            onclick="buySpecialPart('${part.type}', ${part.price})"
                            ${!canBuy ? 'disabled' : ''}>
                        Купить
                    </button>`
                }
            </div>
        `;
    }).join('');
    
    container.innerHTML = partsHTML;
}

// Переключение вкладок
export function showGarageTab(tab) {
    // Удаляем активные классы
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Активируем нужную вкладку
    let tabIndex = 0;
    switch(tab) {
        case 'upgrades': tabIndex = 0; break;
        case 'stats': tabIndex = 1; break;
        case 'parts': tabIndex = 2; break;
    }
    
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (tabButtons[tabIndex]) tabButtons[tabIndex].classList.add('active');
    if (tabContents[tabIndex]) tabContents[tabIndex].classList.add('active');
    
    // Обновляем содержимое
    switch(tab) {
        case 'upgrades':
            updateUpgradesTab();
            break;
        case 'stats':
            updateStatsTab();
            break;
        case 'parts':
            updatePartsTab();
            break;
    }
}
window.previousCar = previousCar;
window.nextCar = nextCar;
window.showGarageTab = showGarageTab;
window.updateGarageDisplay = updateGarageDisplay;
// Делаем функции доступными глобально
window.updateGarageDisplay = updateGarageDisplay;