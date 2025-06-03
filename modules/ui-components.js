// modules/ui-components.js
// Модуль для создания UI компонентов

// Создание карточки машины для гаража
export function createCarPreviewCard(car) {
    return `
        <div class="car-preview-card">
            <h3>${car.name}</h3>
            <div class="car-image-placeholder">🚗</div>
            <div class="car-stats">
                <div class="stat-row">
                    <span>Мощность</span>
                    <span>${car.power}</span>
                </div>
                <div class="stat-row">
                    <span>Скорость</span>
                    <span>${car.speed}</span>
                </div>
                <div class="stat-row">
                    <span>Управление</span>
                    <span>${car.handling}</span>
                </div>
                <div class="stat-row">
                    <span>Разгон</span>
                    <span>${car.acceleration}</span>
                </div>
            </div>
        </div>
    `;
}

// Создание элемента списка соперников
export function createOpponentListItem(opponent, index, canAfford) {
    const betAmount = Math.floor(opponent.reward / 2);
    const fuelCost = opponent.fuelCost || 5;
    
    return `
        <div class="list-item ${!canAfford ? 'disabled' : ''}" onclick="${canAfford ? `showRacePreview(${index})` : ''}">
            <div class="list-item-content">
                <div class="list-item-title">${opponent.name}</div>
                <div class="list-item-subtitle">
                    ${opponent.car} • Сложность: ${opponent.difficulty}
                </div>
                <div class="race-stakes">
                    <span class="stake">Ставка: $${betAmount}</span>
                    <span class="stake">Выигрыш: $${opponent.reward}</span>
                    <span class="stake">Топливо: ${fuelCost}</span>
                </div>
            </div>
            <div class="list-item-action">→</div>
        </div>
    `;
}

// Создание карточки машины для магазина
export function createShopCarCard(car, owned, canBuy, requiredLevel, playerLevel) {
    const locked = playerLevel < requiredLevel;
    
    return `
        <div class="card ${owned ? 'owned' : ''} ${locked ? 'locked' : ''}">
            <div class="card-header">
                <h3 class="card-title">${car.name}</h3>
                ${owned ? '<span class="badge">Куплено</span>' : ''}
            </div>
            <div class="card-body">
                <div class="car-image-placeholder">🚗</div>
                <div class="car-stats-grid">
                    <div class="stat">
                        <span>Мощность</span>
                        <span>${car.power}</span>
                    </div>
                    <div class="stat">
                        <span>Скорость</span>
                        <span>${car.speed}</span>
                    </div>
                    <div class="stat">
                        <span>Управление</span>
                        <span>${car.handling}</span>
                    </div>
                    <div class="stat">
                        <span>Разгон</span>
                        <span>${car.acceleration}</span>
                    </div>
                </div>
                ${locked ? `<p class="level-requirement">Требуется ${requiredLevel} уровень</p>` : ''}
                <p class="car-price">$${car.price.toLocaleString()}</p>
                ${!owned ? `
                    <button class="action-button" onclick="buyCar(${car.id})" ${!canBuy ? 'disabled' : ''}>
                        ${locked ? `Нужен ${requiredLevel} уровень` : 
                          !canBuy ? 'Недостаточно денег' : 'Купить'}
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

// Создание элемента улучшения
export function createUpgradeItem(upgradeType, config, currentLevel, maxLevel, cost, canUpgrade) {
    const isMaxed = currentLevel >= maxLevel;
    
    return `
        <div class="list-item upgrade-item ${isMaxed ? 'maxed' : ''}">
            <div class="list-item-content">
                <div class="list-item-title">${config.name}</div>
                <div class="list-item-subtitle">
                    Уровень ${currentLevel}/${maxLevel}
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(currentLevel / maxLevel) * 100}%"></div>
                </div>
            </div>
            <button class="action-button small" 
                    onclick="upgradeComponent('${upgradeType}')"
                    ${!canUpgrade ? 'disabled' : ''}>
                ${isMaxed ? 'MAX' : `$${cost}`}
            </button>
        </div>
    `;
}

// Создание задания
export function createTaskCard(task) {
    const progressPercent = Math.min((task.progress / task.required) * 100, 100);
    const statusClass = task.claimed ? 'claimed' : task.completed ? 'completed' : 'active';
    
    return `
        <div class="card task-card ${statusClass}">
            <div class="card-header">
                <h3 class="card-title">${task.name}</h3>
                <span class="task-reward">$${task.reward}</span>
            </div>
            <div class="card-body">
                <p class="task-description">${task.description}</p>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercent}%"></div>
                </div>
                <p class="progress-text">${task.progress} / ${task.required}</p>
                ${task.completed && !task.claimed ? 
                    `<button class="action-button success" onclick="claimTaskReward('${task.id}')">
                        Получить награду
                    </button>` : 
                    task.claimed ? '<p class="task-status">✓ Получено</p>' : ''
                }
            </div>
        </div>
    `;
}

// Создание модального окна превью гонки
export function createRacePreviewModal(opponent, currentCar, betAmount, fuelCost, currentFuel) {
    return `
        <div class="modal-overlay" onclick="if(event.target === this) closeRacePreview()">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">Вызов на гонку</h2>
                    <button class="modal-close" onclick="closeRacePreview()">×</button>
                </div>
                <div class="modal-body">
                    <div class="race-preview-info">
                        <h3>Ваша машина</h3>
                        <p>${currentCar.name}</p>
                        <p>Топливо: ${currentFuel}/${currentCar.maxFuel || 30}</p>
                        
                        <h3>Соперник</h3>
                        <p>${opponent.name}</p>
                        <p>Машина: ${opponent.car}</p>
                        
                        <div class="race-conditions">
                            <p>Ставка: <strong>$${betAmount}</strong></p>
                            <p>Выигрыш: <strong>$${opponent.reward}</strong></p>
                            <p>Расход топлива: <strong>${fuelCost}</strong></p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="action-button secondary" onclick="closeRacePreview()">
                        Отмена
                    </button>
                    <button class="action-button success" 
                            onclick="confirmRace(${opponent.index})"
                            ${currentFuel < fuelCost ? 'disabled' : ''}>
                        ${currentFuel < fuelCost ? 'Недостаточно топлива' : 'Начать гонку'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Создание результата гонки
export function createRaceResult(won, opponent, playerTime, opponentTime, rewards) {
    return `
        <div class="race-result-container">
            <div class="card">
                <div class="card-body text-center">
                    <h2 class="${won ? 'result-win' : 'result-lose'}">
                        ${won ? '🏆 ПОБЕДА!' : '😔 ПОРАЖЕНИЕ'}
                    </h2>
                    
                    <div class="race-times">
                        <div>
                            <p>Ваше время</p>
                            <p class="time-value">${playerTime.toFixed(2)} сек</p>
                        </div>
                        <div>
                            <p>Время соперника</p>
                            <p class="time-value">${opponentTime.toFixed(2)} сек</p>
                        </div>
                    </div>
                    
                    <div class="race-rewards">
                        ${won ? 
                            `<p class="reward-money">+$${rewards.money}</p>` :
                            `<p class="reward-money">-$${rewards.bet}</p>`
                        }
                        <p class="reward-xp">+${rewards.xp} XP</p>
                    </div>
                    
                    <div class="result-actions">
                        <button class="action-button" onclick="showRaceMenu()">
                            Новая гонка
                        </button>
                        <button class="action-button secondary" onclick="showMainMenu()">
                            В главное меню
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Показ уведомления
export function showNotification(message, type = 'info') {
    const notification = dom.get('#error-notification') || dom.createElement('div', {
        id: 'error-notification',
        className: 'notification'
    });
    
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    if (!notification.parentNode) {
        document.body.appendChild(notification);
    }
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}