// modules/shop.js
// Функционал магазина с новым UI

import { gameData, allCars, levelSystem } from './game-data.js';
import { showError, showLoading, updatePlayerInfo } from './utils.js';
import { initializeCarUpgrades } from './upgrades.js';
import { createShopCarCard } from './ui-components.js';

// Обновление отображения магазина
export function updateShopDisplay() {
    const buyTab = document.getElementById('shop-buy');
    const sellTab = document.getElementById('shop-sell');
    
    if (buyTab && buyTab.classList.contains('active')) {
        updateBuyTab();
    }
    
    if (sellTab && sellTab.classList.contains('active')) {
        updateSellTab();
    }
}

// Обновление вкладки покупки
function updateBuyTab() {
    const container = document.getElementById('cars-for-sale');
    if (!container) return;
    
    const carsHTML = allCars
        .filter(car => car.price > 0)
        .map(car => {
            const owned = gameData.cars.some(c => c.id === car.id);
            const requiredLevel = levelSystem.getCarRequiredLevel(car.price);
            const canBuy = gameData.level >= requiredLevel && gameData.money >= car.price;
            
            if (owned) return '';
            
            return createShopCarCard(car, owned, canBuy, requiredLevel, gameData.level);
        })
        .filter(html => html !== '')
        .join('');
    
    container.innerHTML = carsHTML || '<p class="no-data">Все доступные машины уже куплены!</p>';
}

// Обновление вкладки продажи
function updateSellTab() {
    const container = document.getElementById('cars-to-sell');
    if (!container) return;
    
    const carsHTML = gameData.cars
        .filter(car => car.price > 0)
        .map((car, index) => {
            const sellPrice = Math.floor(car.price * 0.7);
            
            return `
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">${car.name}</h3>
                    </div>
                    <div class="card-body">
                        <div class="car-image-placeholder">🚗</div>
                        <p class="car-price">Цена продажи: $${sellPrice.toLocaleString()}</p>
                        <button class="action-button warning" onclick="sellCar(${index})">
                            Продать
                        </button>
                    </div>
                </div>
            `;
        })
        .join('');
    
    container.innerHTML = carsHTML || '<p class="no-data">У вас нет машин для продажи</p>';
}

// Функция покупки машины
export async function buyCar(carId) {
    const car = allCars.find(c => c.id === carId);
    const requiredLevel = levelSystem.getCarRequiredLevel(car.price);
    
    if (!car || gameData.money < car.price || gameData.level < requiredLevel) {
        showError('Невозможно купить эту машину!');
        return;
    }
    
    if (!confirm(`Купить ${car.name} за $${car.price.toLocaleString()}?`)) {
        return;
    }
    if (window.checkAllAchievements) {
    window.checkAllAchievements();
}
    // Сохраняем старые значения для отката
    const oldMoney = gameData.money;
    const oldSpent = gameData.stats.moneySpent;
    const oldCars = [...gameData.cars];
    
    // Применяем изменения
    gameData.money -= car.price;
    gameData.stats.moneySpent += car.price;
    
    const newCar = {...car, owned: true};
    initializeCarUpgrades(newCar);
    gameData.cars.push(newCar);
    
    updatePlayerInfo();
    updateShopDisplay();
    
    showLoading(true);
    
    try {
        await saveGameData(gameData);
        showLoading(false);
        showError(`✅ Вы купили ${car.name}!`);
        
        if (window.updateTaskProgress) {
            window.updateTaskProgress('moneySpent', car.price);
        }
    } catch (error) {
        showLoading(false);
        
        // Откатываем изменения
        gameData.money = oldMoney;
        gameData.stats.moneySpent = oldSpent;
        gameData.cars = oldCars;
        
        updatePlayerInfo();
        updateShopDisplay();
        
        showError('❌ Ошибка сохранения! Покупка отменена.');
    }
}

// Функция продажи машины
export async function sellCar(index) {
    if (gameData.cars.length <= 1) {
        showError('Нельзя продать последнюю машину!');
        return;
    }
    
    const car = gameData.cars[index];
    const sellPrice = Math.floor(car.price * 0.7);
    
    if (confirm(`Продать ${car.name} за $${sellPrice.toLocaleString()}?`)) {
        const oldMoney = gameData.money;
        const oldEarned = gameData.stats.moneyEarned;
        const oldCars = [...gameData.cars];
        const oldCurrentCar = gameData.currentCar;
        
        gameData.money += sellPrice;
        gameData.stats.moneyEarned += sellPrice;
        gameData.cars.splice(index, 1);
        
        if (gameData.currentCar >= gameData.cars.length) {
            gameData.currentCar = 0;
        }
        
        updatePlayerInfo();
        updateShopDisplay();
        
        showLoading(true);
        
        try {
            await saveGameData(gameData);
            showLoading(false);
            showError(`${car.name} продана за $${sellPrice.toLocaleString()}`);
        } catch (error) {
            showLoading(false);
            
            // Откат изменений
            gameData.money = oldMoney;
            gameData.stats.moneyEarned = oldEarned;
            gameData.cars = oldCars;
            gameData.currentCar = oldCurrentCar;
            
            updatePlayerInfo();
            updateShopDisplay();
            
            showError('❌ Ошибка сохранения! Продажа отменена.');
        }
    }
}

// Переключение вкладок магазина
export function showShopTab(tab) {
    // Удаляем активные классы
    document.querySelectorAll('.tabs-header .tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('#shop-screen .tab-content').forEach(content => content.classList.remove('active'));
    
    // Активируем нужную вкладку
    if (tab === 'buy') {
        document.querySelector('.tabs-header .tab-button:first-child').classList.add('active');
        document.getElementById('shop-buy').classList.add('active');
        updateBuyTab();
    } else {
        document.querySelector('.tabs-header .tab-button:last-child').classList.add('active');
        document.getElementById('shop-sell').classList.add('active');
        updateSellTab();
    }
}

// Делаем функции доступными глобально
window.updateShopDisplay = updateShopDisplay;
window.buyCar = buyCar;
window.sellCar = sellCar;
window.showShopTab = showShopTab;