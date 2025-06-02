// modules/shop.js
// Функционал магазина

import { gameData, allCars, levelSystem } from './game-data.js';
import { showError, showLoading, updatePlayerInfo } from './utils.js';
import { initializeCarUpgrades } from './upgrades.js';

// Обновление отображения магазина
export function updateShopDisplay() {
    // Машины для покупки
    const carsForSale = document.getElementById('cars-for-sale');
    if (carsForSale) {
        carsForSale.innerHTML = '';
        
        allCars.forEach(car => {
            const owned = gameData.cars.some(c => c.id === car.id);
            const requiredLevel = levelSystem.getCarRequiredLevel(car.price);
            const canBuy = gameData.level >= requiredLevel && gameData.money >= car.price;
            
            if (!owned && car.price > 0) {
                const carDiv = document.createElement('div');
                carDiv.className = 'car-shop-item';
                
                // Добавляем класс для заблокированных машин
                if (gameData.level < requiredLevel) {
                    carDiv.classList.add('locked');
                }
                
                carDiv.innerHTML = `
                    ${car.image ? 
                        `<img src="${car.image}" alt="${car.name}" class="car-shop-image">` :
                        `<div class="car-shop-emoji">🚗</div>`
                    }
                    <div class="car-shop-info">
                        <h4>${car.name}</h4>
                        ${gameData.level < requiredLevel ? 
                            `<p class="level-requirement">🔒 Требуется ${requiredLevel} уровень</p>` : ''}
                        <div class="car-shop-stats">
                            <div class="shop-stat">
                                <span class="shop-stat-label">Мощность:</span>
                                <span class="shop-stat-value">${car.power}</span>
                            </div>
                            <div class="shop-stat">
                                <span class="shop-stat-label">Скорость:</span>
                                <span class="shop-stat-value">${car.speed}</span>
                            </div>
                            <div class="shop-stat">
                                <span class="shop-stat-label">Управление:</span>
                                <span class="shop-stat-value">${car.handling}</span>
                            </div>
                            <div class="shop-stat">
                                <span class="shop-stat-label">Разгон:</span>
                                <span class="shop-stat-value">${car.acceleration}</span>
                            </div>
                        </div>
                        <p class="price">$${car.price.toLocaleString()}</p>
                    </div>
                    <button class="btn-primary" onclick="buyCar(${car.id})" ${!canBuy ? 'disabled' : ''}>
                        ${gameData.level < requiredLevel ? `Нужен ${requiredLevel} уровень` : 
                          gameData.money < car.price ? 'Недостаточно денег' : 'Купить'}
                    </button>
                `;
                carsForSale.appendChild(carDiv);
            }
        });
        
        if (carsForSale.children.length === 0) {
            carsForSale.innerHTML = '<p class="no-data">Все доступные машины уже куплены!</p>';
        }
    }
    
    // Машины для продажи
    const carsToSell = document.getElementById('cars-to-sell');
    if (carsToSell) {
        carsToSell.innerHTML = '';
        
        gameData.cars.forEach((car, index) => {
            if (car.price > 0) {
                const sellPrice = Math.floor(car.price * 0.7);
                const carDiv = document.createElement('div');
                carDiv.className = 'car-shop-item';
                
                // Находим полную информацию о машине
                const carInfo = allCars.find(c => c.id === car.id);
                
                carDiv.innerHTML = `
                    ${carInfo && carInfo.image ? 
                        `<img src="${carInfo.image}" alt="${car.name}" class="car-shop-image">` :
                        `<div class="car-shop-emoji">🚗</div>`
                    }
                    <div class="car-shop-info">
                        <h4>${car.name}</h4>
                        <div class="car-shop-stats">
                            <div class="shop-stat">
                                <span class="shop-stat-label">Мощность:</span>
                                <span class="shop-stat-value">${car.power}</span>
                            </div>
                            <div class="shop-stat">
                                <span class="shop-stat-label">Скорость:</span>
                                <span class="shop-stat-value">${car.speed}</span>
                            </div>
                        </div>
                        <p class="price">Продать за: $${sellPrice.toLocaleString()}</p>
                    </div>
                    <button class="btn-primary" onclick="sellCar(${index})">Продать</button>
                `;
                carsToSell.appendChild(carDiv);
            }
        });
        
        if (carsToSell.children.length === 0) {
            carsToSell.innerHTML = '<p class="no-data">У вас нет машин для продажи</p>';
        }
    }
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
    
    // Сохраняем старые значения для отката
    const oldMoney = gameData.money;
    const oldSpent = gameData.stats.moneySpent;
    const oldCars = [...gameData.cars];
    
    // Применяем изменения локально
    gameData.money -= car.price;
    gameData.stats.moneySpent += car.price;
    
    const newCar = {...car, owned: true};
    initializeCarUpgrades(newCar);
    gameData.cars.push(newCar);
    
    // Обновляем интерфейс
    updatePlayerInfo();
    updateShopDisplay();
    
    // Показываем индикатор загрузки
    showLoading(true);
    
    try {
        // Сохраняем на сервер
        await saveGameData(gameData);
        showLoading(false);
        
        console.log('Покупка машины успешно сохранена на сервер');
        showError(`✅ Вы купили ${car.name}!`);
        // Обновляем прогресс заданий
        if (window.updateTaskProgress) {
            window.updateTaskProgress('moneySpent', car.price);
        }
    } catch (error) {
        showLoading(false);
        console.error('Ошибка сохранения покупки машины:', error);
        
        // ОТКАТЫВАЕМ изменения при ошибке
        gameData.money = oldMoney;
        gameData.stats.moneySpent = oldSpent;
        gameData.cars = oldCars;
        
        // Обновляем интерфейс
        updatePlayerInfo();
        updateShopDisplay();
        
        showError('❌ Ошибка сохранения! Покупка отменена. Проверьте соединение.');
    }
}

// Функция продажи машины
export async function sellCar(index) {
    if (gameData.cars.length <= 1) {
        alert('Нельзя продать последнюю машину!');
        return;
    }
    
    const car = gameData.cars[index];
    const sellPrice = Math.floor(car.price * 0.7);
    
    if (confirm(`Продать ${car.name} за $${sellPrice.toLocaleString()}?`)) {
        // Сохраняем старые значения для отката
        const oldMoney = gameData.money;
        const oldEarned = gameData.stats.moneyEarned;
        const oldCars = [...gameData.cars];
        const oldCurrentCar = gameData.currentCar;
        
        // Применяем изменения
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
            console.error('Ошибка сохранения продажи:', error);
            
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

// Функция переключения вкладок магазина
export function showShopTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.shop-content').forEach(content => content.classList.remove('active'));
    
    if (tab === 'buy') {
        document.querySelector('.tab-btn:first-child').classList.add('active');
        document.getElementById('shop-buy').classList.add('active');
    } else {
        document.querySelector('.tab-btn:last-child').classList.add('active');
        document.getElementById('shop-sell').classList.add('active');
    }
}

// Делаем функцию доступной глобально
window.updateShopDisplay = updateShopDisplay;