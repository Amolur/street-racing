// modules/shop.js
// Функционал магазина с ЗАЩИЩЕННЫМИ покупками

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

// ИСПРАВЛЕННАЯ функция покупки машины - ВСЁ ЧЕРЕЗ СЕРВЕР
export async function buyCar(carId) {
    const car = allCars.find(c => c.id === carId);
    const requiredLevel = levelSystem.getCarRequiredLevel(car.price);
    
    // Простые проверки на клиенте (дублируются на сервере)
    if (!car || gameData.money < car.price || gameData.level < requiredLevel) {
        window.notify('Невозможно купить эту машину!', 'error');
        return;
    }
    
    if (!confirm(`Купить ${car.name} за $${car.price.toLocaleString()}?`)) {
        return;
    }
    
    try {
        // ЗАЩИТА: ВСЯ ЛОГИКА ПОКУПКИ НА СЕРВЕРЕ
        const response = await fetch(`${window.API_URL}/game/buy-car`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ carId })
        });
        
        if (!response.ok) {
            const error = await response.json();
            window.notify(error.error || 'Ошибка покупки', 'error');
            return;
        }
        
        const result = await response.json();
        
        // ВАЖНО: Обновляем данные ТОЛЬКО из ответа сервера
        gameData.money = result.remainingMoney;
        gameData.cars = [...gameData.cars, result.car];
        
        // Обновляем статистику тоже из сервера (если есть)
        if (result.gameData && result.gameData.stats) {
            gameData.stats = result.gameData.stats;
        }
        
        updatePlayerInfo();
        updateShopDisplay();
        
        window.notify(`✅ Вы купили ${car.name}!`, 'success');
        
        // Обновляем прогресс заданий
        if (window.updateTaskProgress) {
            window.updateTaskProgress('moneySpent', car.price);
        }
        
        // Проверяем достижения
        if (window.checkAllAchievements) {
            window.checkAllAchievements();
        }
        
    } catch (error) {
        console.error('Ошибка покупки машины:', error);
        window.notify('Ошибка соединения с сервером', 'error');
    }
}

// ИСПРАВЛЕННАЯ функция продажи машины - ВСЁ ЧЕРЕЗ СЕРВЕР
export async function sellCar(index) {
    if (gameData.cars.length <= 1) {
        window.notify('Нельзя продать последнюю машину!', 'error');
        return;
    }
    
    const car = gameData.cars[index];
    const sellPrice = Math.floor(car.price * 0.7);
    
    if (!confirm(`Продать ${car.name} за $${sellPrice.toLocaleString()}?`)) {
        return;
    }
    
    try {
        // ЗАЩИТА: ВСЯ ЛОГИКА ПРОДАЖИ НА СЕРВЕРЕ
        const response = await fetch(`${window.API_URL}/game/sell-car`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ carIndex: index })
        });
        
        if (!response.ok) {
            const error = await response.json();
            window.notify(error.error || 'Ошибка продажи', 'error');
            return;
        }
        
        const result = await response.json();
        
        // ВАЖНО: Обновляем данные ТОЛЬКО из ответа сервера
        gameData.money = result.newMoney;
        gameData.cars = result.remainingCars;
        gameData.currentCar = result.newCurrentCar;
        
        // Обновляем статистику из сервера
        if (result.gameData && result.gameData.stats) {
            gameData.stats = result.gameData.stats;
        }
        
        updatePlayerInfo();
        updateShopDisplay();
        
        window.notify(`${car.name} продана за $${sellPrice.toLocaleString()}`, 'success');
        
    } catch (error) {
        console.error('Ошибка продажи машины:', error);
        window.notify('Ошибка соединения с сервером', 'error');
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

window.updateShopDisplay = updateShopDisplay;
window.buyCar = buyCar;
window.sellCar = sellCar;
window.showShopTab = showShopTab;