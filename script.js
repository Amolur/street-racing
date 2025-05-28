// Добавьте эти функции в начало вашего script.js

// Мобильное меню
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('active');
    
    // Закрываем меню при клике вне его
    if (menu.classList.contains('active')) {
        setTimeout(() => {
            document.addEventListener('click', closeMobileMenuOutside);
        }, 100);
    } else {
        document.removeEventListener('click', closeMobileMenuOutside);
    }
}

function closeMobileMenuOutside(e) {
    const menu = document.getElementById('mobile-menu');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (!menu.contains(e.target) && !menuToggle.contains(e.target)) {
        menu.classList.remove('active');
        document.removeEventListener('click', closeMobileMenuOutside);
    }
}

// Улучшенная навигация
function navigateTo(screenId) {
    // Закрываем мобильное меню
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
        mobileMenu.classList.remove('active');
    }
    
    // Скрываем все экраны
    hideAllScreens();
    
    // Показываем нужный экран
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
        navigateToScreen(screenId);
    }
    
    // Обновляем активную кнопку в нижней навигации
    updateBottomNav(screenId);
    
    // Обновляем данные экрана если нужно
    switch(screenId) {
        case 'garage-screen':
            updateGarageDisplay();
            break;
        case 'race-menu-screen':
            displayOpponents();
            break;
        case 'profile-screen':
            updateProfileDisplay();
            break;
        case 'shop-screen':
            updateShopDisplay();
            break;
        case 'leaderboard-screen':
            updateLeaderboard();
            break;
    }
}

// Обновление активной кнопки в нижней навигации
function updateBottomNav(screenId) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Находим соответствующую кнопку
    const screenMap = {
        'main-menu': 0,
        'race-menu-screen': 1,
        'garage-screen': 2,
        'shop-screen': 3,
        'profile-screen': 4
    };
    
    const index = screenMap[screenId];
    if (index !== undefined && navItems[index]) {
        navItems[index].classList.add('active');
    }
}

// Переключение между машинами в гараже
function previousCar() {
    if (gameData.currentCar > 0) {
        gameData.currentCar--;
        updateGarageDisplay();
        updateCarSelector();
    }
}

function nextCar() {
    if (gameData.currentCar < gameData.cars.length - 1) {
        gameData.currentCar++;
        updateGarageDisplay();
        updateCarSelector();
    }
}

function updateCarSelector() {
    const selector = document.querySelector('.car-selector');
    if (selector) {
        selector.textContent = `${gameData.currentCar + 1} / ${gameData.cars.length}`;
    }
}

// Обновите функцию updateGarageDisplay
const originalUpdateGarageDisplay = updateGarageDisplay;
updateGarageDisplay = function() {
    // Вызываем оригинальную функцию если она есть
    if (typeof originalUpdateGarageDisplay === 'function') {
        originalUpdateGarageDisplay();
    }
    
    // Дополнительные обновления для нового дизайна
    const currentCar = gameData.cars[gameData.currentCar];
    const carDisplay = document.getElementById('current-car-display');
    
    if (carDisplay && currentCar) {
        carDisplay.innerHTML = `
            <div class="car-emoji">🏎️</div>
            <h3>${currentCar.name}</h3>
            <div class="car-power">Мощность: ${currentCar.power}</div>
        `;
    }
    
    // Обновляем селектор
    updateCarSelector();
    
    // Обновляем статистику машины
    const statsDisplay = document.getElementById('car-stats-display');
    if (statsDisplay && currentCar) {
        statsDisplay.innerHTML = `
            <div class="stat-bar">
                <label>Мощность</label>
                <div class="progress-bar">
                    <div class="stat-value" style="width: ${currentCar.power}%"></div>
                </div>
                <span>${currentCar.power}</span>
            </div>
            <div class="stat-bar">
                <label>Скорость</label>
                <div class="progress-bar">
                    <div class="stat-value" style="width: ${currentCar.speed}%"></div>
                </div>
                <span>${currentCar.speed}</span>
            </div>
            <div class="stat-bar">
                <label>Управление</label>
                <div class="progress-bar">
                    <div class="stat-value" style="width: ${currentCar.handling}%"></div>
                </div>
                <span>${currentCar.handling}</span>
            </div>
            <div class="stat-bar">
                <label>Разгон</label>
                <div class="progress-bar">
                    <div class="stat-value" style="width: ${currentCar.acceleration}%"></div>
                </div>
                <span>${currentCar.acceleration}</span>
            </div>
        `;
    }
};

// Обновите функцию showGame для мобильной версии
const originalShowGame = showGame;
showGame = function() {
    originalShowGame();
    
    // Обновляем информацию пользователя в мобильном меню
    const mobileUsername = document.getElementById('mobile-username');
    const welcomeUsername = document.getElementById('welcome-username');
    
    if (mobileUsername && currentUser) {
        mobileUsername.textContent = currentUser.username;
    }
    
    if (welcomeUsername && currentUser) {
        welcomeUsername.textContent = currentUser.username;
    }
    
    // Обновляем аватары
    const avatars = document.querySelectorAll('.user-avatar, .profile-avatar');
    avatars.forEach(avatar => {
        if (currentUser) {
            avatar.src = `https://ui-avatars.com/api/?name=${currentUser.username}&background=4ecdc4&color=1a1a1a&size=100`;
        }
    });
    
    // Обновляем быструю статистику
    updateQuickStats();
};

// Функция обновления быстрой статистики на главной
function updateQuickStats() {
    const quickWins = document.getElementById('quick-wins');
    const quickCars = document.getElementById('quick-cars');
    const quickRating = document.getElementById('quick-rating');
    
    if (quickWins) quickWins.textContent = gameData.stats.wins;
    if (quickCars) quickCars.textContent = gameData.cars.length;
    if (quickRating) quickRating.textContent = '#—'; // Позже можно добавить реальный рейтинг
}

// Обновляем отображение денег и уровня в разных местах
const originalUpdatePlayerInfo = updatePlayerInfo;
updatePlayerInfo = function() {
    originalUpdatePlayerInfo();
    
    // Обновляем в мобильном меню
    const mobileLevel = document.getElementById('mobile-level');
    if (mobileLevel) {
        mobileLevel.textContent = gameData.level;
    }
    
    // Обновляем баланс в гонках
    const raceBalance = document.getElementById('race-balance');
    if (raceBalance) {
        raceBalance.textContent = gameData.money;
    }
    
    // Обновляем текущую машину в гонках
    const raceCurrentCar = document.getElementById('race-current-car');
    if (raceCurrentCar && gameData.cars[gameData.currentCar]) {
        raceCurrentCar.textContent = gameData.cars[gameData.currentCar].name;
    }
};

// Адаптивное закрытие модальных окон
document.addEventListener('DOMContentLoaded', function() {
    // Закрытие модальных окон по клику на фон
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('race-preview-modal')) {
            closeRacePreview();
        }
    });
    
    // Обработка свайпов для мобильного меню
    let touchStartX = 0;
    let touchEndX = 0;
    
    document.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    document.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const menu = document.getElementById('mobile-menu');
        
        if (touchEndX < touchStartX - swipeThreshold && menu.classList.contains('active')) {
            // Свайп влево - закрываем меню
            menu.classList.remove('active');
        } else if (touchEndX > touchStartX + swipeThreshold && touchStartX < 50) {
            // Свайп вправо от края - открываем меню
            menu.classList.add('active');
        }
    }
});
// Игровые данные
let gameData = {
    money: 1000,
    level: 1,
    currentCar: 0,
    skills: {
        driving: 1,
        speed: 1,
        reaction: 1,
        technique: 1
    },
    stats: {
        totalRaces: 0,
        wins: 0,
        losses: 0,
        moneyEarned: 0,
        moneySpent: 0
    },
    cars: [
        {
            id: 0,
            name: "Honda Civic",
            power: 50,
            speed: 60,
            handling: 70,
            acceleration: 55,
            price: 0,
            owned: true
        }
    ]
};

// Текущий пользователь
let currentUser = null;

// История навигации для кнопки "Назад"
let navigationHistory = [];
let currentScreen = 'main-menu';

// Список всех доступных машин в игре
const allCars = [
    { id: 0, name: "Honda Civic", power: 50, speed: 60, handling: 70, acceleration: 55, price: 0 },
    { id: 1, name: "Volkswagen Golf", power: 55, speed: 65, handling: 75, acceleration: 60, price: 5000 },
    { id: 2, name: "Mazda MX-5", power: 60, speed: 70, handling: 85, acceleration: 65, price: 8000 },
    { id: 3, name: "BMW 325i", power: 70, speed: 75, handling: 80, acceleration: 70, price: 15000 },
    { id: 4, name: "Subaru WRX", power: 80, speed: 85, handling: 75, acceleration: 85, price: 25000 },
    { id: 5, name: "Nissan 370Z", power: 85, speed: 90, handling: 70, acceleration: 80, price: 35000 },
    { id: 6, name: "Porsche Cayman", power: 90, speed: 95, handling: 95, acceleration: 90, price: 50000 },
    { id: 7, name: "Chevrolet Corvette", power: 95, speed: 98, handling: 85, acceleration: 95, price: 75000 }
];

// Список возможных соперников
const opponents = [
    { name: "Новичок Вася", car: "Lada 2107", difficulty: 0.8, reward: 200 },
    { name: "Уличный гонщик Макс", car: "BMW E36", difficulty: 1.0, reward: 500 },
    { name: "Профи Алекс", car: "Nissan Skyline", difficulty: 1.3, reward: 1000 },
    { name: "Легенда Дима", car: "Toyota Supra", difficulty: 1.6, reward: 2000 }
];

// Функции авторизации
async function register(username, password) {
    try {
        const data = await registerAPI(username, password);
        currentUser = { username: data.user.username };
        gameData = data.user.gameData;
        return true;
    } catch (error) {
        alert(error.message);
        return false;
    }
}

async function login(username, password) {
    try {
        const data = await loginAPI(username, password);
        currentUser = { username: data.user.username };
        gameData = data.user.gameData;
        return true;
    } catch (error) {
        alert(error.message);
        return false;
    }
}

function logout() {
    logoutAPI();
    currentUser = null;
    showAuthScreen();
}

async function checkAuth() {
    if (!localStorage.getItem('authToken')) return false;
    
    try {
        const data = await loadGameData();
        currentUser = { username: data.username };
        gameData = data.gameData;
        return true;
    } catch (error) {
        localStorage.removeItem('authToken');
        return false;
    }
}

// Автосохранение
async function autoSave() {
    if (currentUser) {
        try {
            await saveGameData(gameData);
            console.log('Игра сохранена на сервере');
        } catch (error) {
            console.error('Ошибка сохранения:', error);
        }
    }
}

// Функция для отслеживания навигации
function navigateToScreen(screenId) {
    if (currentScreen !== screenId) {
        navigationHistory.push(currentScreen);
        currentScreen = screenId;
    }
}

// Функция возврата на предыдущий экран
function goBack() {
    if (navigationHistory.length > 0) {
        const previousScreen = navigationHistory.pop();
        currentScreen = previousScreen;
        
        switch(previousScreen) {
            case 'main-menu':
                showMainMenu(false);
                break;
            case 'garage-screen':
                showGarageScreen(false);
                break;
            case 'race-menu-screen':
                showRaceMenu(false);
                break;
            case 'profile-screen':
                showProfileScreen(false);
                break;
            case 'shop-screen':
                showShopScreen(false);
                break;
            case 'leaderboard-screen':
                showLeaderboardScreen(false);
                break;
        }
    } else {
        showMainMenu(false);
    }
}

// Функция возврата в главное меню
function goToMainMenu() {
    navigationHistory = [];
    currentScreen = 'main-menu';
    showMainMenu(false);
}

// Функция скрытия всех экранов
function hideAllScreens() {
    document.querySelectorAll('.game-screen').forEach(screen => {
        screen.classList.remove('active');
    });
}

// Функции навигации
function showMainMenu(addToHistory = true) {
    hideAllScreens();
    document.getElementById('main-menu').classList.add('active');
    if (addToHistory) navigateToScreen('main-menu');
}

function showGarageScreen(addToHistory = true) {
    hideAllScreens();
    document.getElementById('garage-screen').classList.add('active');
    updateGarageDisplay();
    if (addToHistory) navigateToScreen('garage-screen');
}

function showRaceMenu(addToHistory = true) {
    hideAllScreens();
    document.getElementById('race-menu-screen').classList.add('active');
    displayOpponents();
    if (addToHistory) navigateToScreen('race-menu-screen');
}

function showProfileScreen(addToHistory = true) {
    hideAllScreens();
    document.getElementById('profile-screen').classList.add('active');
    updateProfileDisplay();
    if (addToHistory) navigateToScreen('profile-screen');
}

function showShopScreen(addToHistory = true) {
    hideAllScreens();
    document.getElementById('shop-screen').classList.add('active');
    updateShopDisplay();
    if (addToHistory) navigateToScreen('shop-screen');
}

async function showLeaderboardScreen(addToHistory = true) {
    hideAllScreens();
    document.getElementById('leaderboard-screen').classList.add('active');
    if (addToHistory) navigateToScreen('leaderboard-screen');
    await updateLeaderboard();
}

function showRaceResultScreen() {
    hideAllScreens();
    document.getElementById('race-result-screen').classList.add('active');
}

// Обновление таблицы лидеров
async function updateLeaderboard() {
    try {
        const leaderboardList = document.getElementById('leaderboard-list');
        leaderboardList.innerHTML = '<div class="loading">Загрузка...</div>';
        
        const leaders = await getLeaderboard();
        
        leaderboardList.innerHTML = '';
        
        leaders.forEach((player, index) => {
            const isCurrentUser = player.username === currentUser.username;
            const row = document.createElement('div');
            row.className = `leaderboard-row ${isCurrentUser ? 'current-user' : ''}`;
            
            let positionClass = '';
            if (player.position === 1) positionClass = 'gold';
            else if (player.position === 2) positionClass = 'silver';
            else if (player.position === 3) positionClass = 'bronze';
            
            row.innerHTML = `
                <span class="lb-position ${positionClass}">${player.position}</span>
                <span class="lb-name">${player.username}</span>
                <span class="lb-level">${player.level}</span>
                <span class="lb-money">$${player.money.toLocaleString()}</span>
                <span class="lb-wins">${player.wins}</span>
                <span class="lb-races">${player.totalRaces}</span>
                <span class="lb-winrate">${player.winRate}%</span>
            `;
            
            leaderboardList.appendChild(row);
        });
        
        if (leaders.length === 0) {
            leaderboardList.innerHTML = '<div class="no-data">Пока нет данных</div>';
        }
    } catch (error) {
        console.error('Ошибка загрузки таблицы лидеров:', error);
        document.getElementById('leaderboard-list').innerHTML = 
            '<div class="error">Ошибка загрузки данных</div>';
    }
}

// Обновление отображения гаража
function updateGarageDisplay() {
    const ownedCarsList = document.getElementById('owned-cars-list');
    if (ownedCarsList) {
        ownedCarsList.innerHTML = '';
        
        gameData.cars.forEach((car, index) => {
            const carDiv = document.createElement('div');
            carDiv.className = `car-item ${index === gameData.currentCar ? 'selected' : ''}`;
            carDiv.innerHTML = `
                <h4>${car.name}</h4>
                <p>Мощность: ${car.power} | Скорость: ${car.speed}</p>
            `;
            carDiv.onclick = () => selectCar(index);
            ownedCarsList.appendChild(carDiv);
        });
    }
    
    const selectedCarDisplay = document.getElementById('selected-car-display');
    if (selectedCarDisplay && gameData.cars[gameData.currentCar]) {
        const currentCar = gameData.cars[gameData.currentCar];
        selectedCarDisplay.innerHTML = `
            <h4>${currentCar.name}</h4>
            <div class="car-stats">
                <div class="stat-bar">
                    <label>Мощность:</label>
                    <div class="progress-bar">
                        <div class="stat-value" style="width: ${currentCar.power}%"></div>
                    </div>
                    <span>${currentCar.power}/100</span>
                </div>
                <div class="stat-bar">
                    <label>Скорость:</label>
                    <div class="progress-bar">
                        <div class="stat-value" style="width: ${currentCar.speed}%"></div>
                    </div>
                    <span>${currentCar.speed}/100</span>
                </div>
                <div class="stat-bar">
                    <label>Управление:</label>
                    <div class="progress-bar">
                        <div class="stat-value" style="width: ${currentCar.handling}%"></div>
                    </div>
                    <span>${currentCar.handling}/100</span>
                </div>
                <div class="stat-bar">
                    <label>Разгон:</label>
                    <div class="progress-bar">
                        <div class="stat-value" style="width: ${currentCar.acceleration}%"></div>
                    </div>
                    <span>${currentCar.acceleration}/100</span>
                </div>
            </div>
        `;
    }
}

// Функция выбора машины
async function selectCar(index) {
    gameData.currentCar = index;
    updateGarageDisplay();
    await autoSave();
}

// Функция обновления профиля
function updateProfileDisplay() {
    const profileInfo = document.getElementById('profile-info');
    if (profileInfo && currentUser) {
        profileInfo.innerHTML = `
            <p><strong>Имя:</strong> ${currentUser.username}</p>
            <p><strong>Уровень:</strong> ${gameData.level}</p>
            <p><strong>Деньги:</strong> $${gameData.money}</p>
            <p><strong>Машин в гараже:</strong> ${gameData.cars.length}</p>
        `;
    }
    
    const profileSkillsDisplay = document.getElementById('profile-skills-display');
    if (profileSkillsDisplay) {
        profileSkillsDisplay.innerHTML = `
            <div class="stat-bar">
                <label>Вождение:</label>
                <div class="skill-level">${gameData.skills.driving}</div>
            </div>
            <div class="stat-bar">
                <label>Скорость:</label>
                <div class="skill-level">${gameData.skills.speed}</div>
            </div>
            <div class="stat-bar">
                <label>Реакция:</label>
                <div class="skill-level">${gameData.skills.reaction}</div>
            </div>
            <div class="stat-bar">
                <label>Навык:</label>
                <div class="skill-level">${gameData.skills.technique}</div>
            </div>
        `;
    }
    
    const profileStats = document.getElementById('profile-stats');
    if (profileStats) {
        const winRate = gameData.stats.totalRaces > 0 
            ? ((gameData.stats.wins / gameData.stats.totalRaces) * 100).toFixed(1) 
            : 0;
            
        profileStats.innerHTML = `
            <p><strong>Всего гонок:</strong> ${gameData.stats.totalRaces}</p>
            <p><strong>Побед:</strong> ${gameData.stats.wins}</p>
            <p><strong>Поражений:</strong> ${gameData.stats.losses}</p>
            <p><strong>Процент побед:</strong> ${winRate}%</p>
            <p><strong>Заработано:</strong> $${gameData.stats.moneyEarned}</p>
            <p><strong>Потрачено:</strong> $${gameData.stats.moneySpent}</p>
        `;
    }
}

// Функция обновления магазина
function updateShopDisplay() {
    const carsForSale = document.getElementById('cars-for-sale');
    if (carsForSale) {
        carsForSale.innerHTML = '';
        
        allCars.forEach(car => {
            const owned = gameData.cars.some(c => c.id === car.id);
            if (!owned && car.price > 0) {
                const carDiv = document.createElement('div');
                carDiv.className = 'car-shop-item';
                carDiv.innerHTML = `
                    <div class="car-shop-info">
                        <h4>${car.name}</h4>
                        <div class="car-shop-stats">
                            <span>Мощность: ${car.power}</span>
                            <span>Скорость: ${car.speed}</span>
                            <span>Управление: ${car.handling}</span>
                            <span>Разгон: ${car.acceleration}</span>
                        </div>
                        <p class="price">$${car.price}</p>
                    </div>
                    <button onclick="buyCar(${car.id})" ${gameData.money < car.price ? 'disabled' : ''}>
                        ${gameData.money < car.price ? 'Недостаточно денег' : 'Купить'}
                    </button>
                `;
                carsForSale.appendChild(carDiv);
            }
        });
    }
    
    const carsToSell = document.getElementById('cars-to-sell');
    if (carsToSell) {
        carsToSell.innerHTML = '';
        
        gameData.cars.forEach((car, index) => {
            if (car.price > 0) {
                const sellPrice = Math.floor(car.price * 0.7);
                const carDiv = document.createElement('div');
                carDiv.className = 'car-shop-item';
                carDiv.innerHTML = `
                    <div class="car-shop-info">
                        <h4>${car.name}</h4>
                        <div class="car-shop-stats">
                            <span>Мощность: ${car.power}</span>
                            <span>Скорость: ${car.speed}</span>
                        </div>
                        <p class="price">Продать за: $${sellPrice}</p>
                    </div>
                    <button onclick="sellCar(${index})">Продать</button>
                `;
                carsToSell.appendChild(carDiv);
            }
        });
    }
}

// Функция покупки машины
async function buyCar(carId) {
    const car = allCars.find(c => c.id === carId);
    if (!car || gameData.money < car.price) return;
    
    gameData.money -= car.price;
    gameData.stats.moneySpent += car.price;
    gameData.cars.push({...car, owned: true});
    
    updatePlayerInfo();
    updateShopDisplay();
    await autoSave();
    
    alert(`Вы купили ${car.name}!`);
}

// Функция продажи машины
async function sellCar(index) {
    if (gameData.cars.length <= 1) {
        alert('Нельзя продать последнюю машину!');
        return;
    }
    
    const car = gameData.cars[index];
    const sellPrice = Math.floor(car.price * 0.7);
    
    if (confirm(`Продать ${car.name} за $${sellPrice}?`)) {
        gameData.money += sellPrice;
        gameData.stats.moneyEarned += sellPrice;
        gameData.cars.splice(index, 1);
        
        if (gameData.currentCar >= gameData.cars.length) {
            gameData.currentCar = 0;
        }
        
        updatePlayerInfo();
        updateShopDisplay();
        await autoSave();
    }
}

// Функция переключения вкладок магазина
function showShopTab(tab) {
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

// Функция расчета получения навыков после гонки
function calculateSkillGain(isWin) {
    const skillNames = ['driving', 'speed', 'reaction', 'technique'];
    const skillNamesRu = {
        driving: 'Вождение',
        speed: 'Скорость',
        reaction: 'Реакция',
        technique: 'Навык'
    };
    
    let gainedSkills = [];
    
    const attempts = Math.random() < 0.7 ? 1 : 2;
    const baseChance = isWin ? 0.9 : 0.45;
    
    for (let i = 0; i < attempts; i++) {
        const randomSkill = skillNames[Math.floor(Math.random() * skillNames.length)];
        
        if (gainedSkills.find(s => s.skill === randomSkill)) {
            continue;
        }
        
        const currentSkillLevel = gameData.skills[randomSkill];
        const chance = baseChance / (1 + currentSkillLevel * 0.01);
        
        if (Math.random() < chance) {
            gameData.skills[randomSkill]++;
            gainedSkills.push({
                skill: randomSkill,
                name: skillNamesRu[randomSkill],
                newLevel: gameData.skills[randomSkill],
                chance: (chance * 100).toFixed(1)
            });
        }
    }
    
    return gainedSkills;
}

// Отображение списка соперников
function displayOpponents() {
    const opponentsList = document.getElementById('opponents-list');
    if (!opponentsList) return;
    
    opponentsList.innerHTML = '';
    
    opponents.forEach((opponent, index) => {
        const betAmount = opponent.reward / 2;
        const canAfford = gameData.money >= betAmount;
        
        const opponentCard = document.createElement('div');
        opponentCard.className = 'opponent-card';
        opponentCard.style.opacity = canAfford ? '1' : '0.5';
        
        opponentCard.innerHTML = `
            <div>
                <strong>${opponent.name}</strong><br>
                <small>Машина: ${opponent.car}</small><br>
                <small>Выигрыш: $${opponent.reward} / Ставка: $${betAmount}</small>
            </div>
            <button onclick="showRacePreview(${index})" ${!canAfford ? 'disabled' : ''}>
                ${canAfford ? 'Вызвать на гонку' : `Нужно $${betAmount}`}
            </button>
        `;
        opponentsList.appendChild(opponentCard);
    });
}

// Показать превью гонки с сравнением
function showRacePreview(opponentIndex) {
    const opponent = opponents[opponentIndex];
    const currentCar = gameData.cars[gameData.currentCar];
    const betAmount = opponent.reward / 2;
    
    const modal = document.createElement('div');
    modal.className = 'race-preview-modal';
    modal.innerHTML = `
        <div class="race-preview-content">
            <h2>Вызов на гонку</h2>
            
            <div class="race-comparison">
                <div class="racer-info player">
                    <h3>${currentUser.username}</h3>
                    <div class="car-info">
                        <h4>${currentCar.name}</h4>
                        <div class="car-image">🚗</div>
                    </div>
                    
                    <div class="stats-section">
                        <h5>Характеристики машины</h5>
                        <div class="stat-comparison">
                            <span>Мощность</span>
                            <div class="stat-bar-comparison">
                                <div class="stat-fill" style="width: ${currentCar.power}%"></div>
                            </div>
                            <span class="stat-number">${currentCar.power}</span>
                        </div>
                        <div class="stat-comparison">
                            <span>Скорость</span>
                            <div class="stat-bar-comparison">
                                <div class="stat-fill" style="width: ${currentCar.speed}%"></div>
                            </div>
                            <span class="stat-number">${currentCar.speed}</span>
                        </div>
                        <div class="stat-comparison">
                            <span>Управление</span>
                            <div class="stat-bar-comparison">
                                <div class="stat-fill" style="width: ${currentCar.handling}%"></div>
                            </div>
                            <span class="stat-number">${currentCar.handling}</span>
                        </div>
                        <div class="stat-comparison">
                            <span>Разгон</span>
                            <div class="stat-bar-comparison">
                                <div class="stat-fill" style="width: ${currentCar.acceleration}%"></div>
                            </div>
                            <span class="stat-number">${currentCar.acceleration}</span>
                        </div>
                    </div>
                    
                    <div class="stats-section">
                        <h5>Навыки пилота</h5>
                        <div class="skill-comparison">
                            <span>Вождение: ${gameData.skills.driving}</span>
                            <span>Скорость: ${gameData.skills.speed}</span>
                            <span>Реакция: ${gameData.skills.reaction}</span>
                            <span>Навык: ${gameData.skills.technique}</span>
                        </div>
                    </div>
                </div>
                
                <div class="vs-divider">
                    <div class="vs-circle">VS</div>
                    <div class="race-info">
                        <p>Ставка: <strong>$${betAmount}</strong></p>
                        <p>Выигрыш: <strong>$${opponent.reward}</strong></p>
                    </div>
                </div>
                
                <div class="racer-info opponent">
                    <h3>${opponent.name}</h3>
                    <div class="car-info">
                        <h4>${opponent.car}</h4>
                        <div class="car-image">🏎️</div>
                    </div>
                    
                    <div class="stats-section">
                        <h5>Характеристики машины</h5>
                        ${generateOpponentStats(opponent.difficulty)}
                    </div>
                    
                    <div class="stats-section">
                        <h5>Навыки пилота</h5>
                        <div class="skill-comparison">
                            ${generateOpponentSkills(opponent.difficulty)}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="modal-buttons">
                <button class="race-btn" onclick="confirmRace(${opponentIndex})">Начать гонку!</button>
                <button class="cancel-btn" onclick="closeRacePreview()">Отмена</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Генерация характеристик машины соперника
function generateOpponentStats(difficulty) {
    const baseStats = {
        power: Math.floor(50 * difficulty + Math.random() * 20),
        speed: Math.floor(55 * difficulty + Math.random() * 20),
        handling: Math.floor(60 * difficulty + Math.random() * 20),
        acceleration: Math.floor(50 * difficulty + Math.random() * 20)
    };
    
    return `
        <div class="stat-comparison">
            <span class="stat-number">${baseStats.power}</span>
            <div class="stat-bar-comparison opponent-bar">
                <div class="stat-fill" style="width: ${baseStats.power}%"></div>
            </div>
            <span>Мощность</span>
        </div>
        <div class="stat-comparison">
            <span class="stat-number">${baseStats.speed}</span>
            <div class="stat-bar-comparison opponent-bar">
                <div class="stat-fill" style="width: ${baseStats.speed}%"></div>
            </div>
            <span>Скорость</span>
        </div>
        <div class="stat-comparison">
            <span class="stat-number">${baseStats.handling}</span>
            <div class="stat-bar-comparison opponent-bar">
                <div class="stat-fill" style="width: ${baseStats.handling}%"></div>
            </div>
            <span>Управление</span>
        </div>
        <div class="stat-comparison">
            <span class="stat-number">${baseStats.acceleration}</span>
            <div class="stat-bar-comparison opponent-bar">
                <div class="stat-fill" style="width: ${baseStats.acceleration}%"></div>
            </div>
            <span>Разгон</span>
        </div>
    `;
}

// Генерация навыков соперника
function generateOpponentSkills(difficulty) {
    const skills = {
        driving: Math.floor(5 * difficulty + Math.random() * 10),
        speed: Math.floor(5 * difficulty + Math.random() * 10),
        reaction: Math.floor(5 * difficulty + Math.random() * 10),
        technique: Math.floor(5 * difficulty + Math.random() * 10)
    };
    
    return `
        <span>Вождение: ${skills.driving}</span>
        <span>Скорость: ${skills.speed}</span>
        <span>Реакция: ${skills.reaction}</span>
        <span>Навык: ${skills.technique}</span>
    `;
}

// Закрыть превью гонки
function closeRacePreview() {
    const modal = document.querySelector('.race-preview-modal');
    if (modal) {
        modal.remove();
    }
}

// Подтвердить и начать гонку
function confirmRace(opponentIndex) {
    closeRacePreview();
    startRace(opponentIndex);
}

// Старт гонки
async function startRace(opponentIndex) {
    const opponent = opponents[opponentIndex];
    const currentCar = gameData.cars[gameData.currentCar];
    
    const betAmount = opponent.reward / 2;
    if (gameData.money < betAmount) {
        alert(`Недостаточно денег для участия! Нужно минимум $${betAmount}`);
        return;
    }
    
    const carPower = (currentCar.power + currentCar.speed + currentCar.handling + currentCar.acceleration) / 4;
    
    const skillBonus = (
        gameData.skills.driving * 0.5 +
        gameData.skills.speed * 0.5 +
        gameData.skills.reaction * 0.3 +
        gameData.skills.technique * 0.3
    );
    
    const totalPower = carPower + skillBonus;
    
    // Расчет времени прохождения (чем больше сила, тем меньше время)
    const baseTime = 100; // базовое время в секундах
    const playerTime = baseTime / (totalPower * (0.8 + Math.random() * 0.4));
    const opponentTime = baseTime / (60 * opponent.difficulty * (0.8 + Math.random() * 0.4));

    // В гонках побеждает тот, у кого МЕНЬШЕ время!
    const won = playerTime < opponentTime;
    
    gameData.stats.totalRaces++;
    if (won) {
        gameData.stats.wins++;
        gameData.stats.moneyEarned += opponent.reward;
        gameData.money += opponent.reward;
    } else {
        gameData.stats.losses++;
        gameData.stats.moneySpent += betAmount;
        gameData.money -= betAmount;
    }
    
    const gainedSkills = calculateSkillGain(won);
    
    showRaceResultScreen();
    
    const resultDiv = document.getElementById('race-result');
    let skillsHTML = '';
    
    if (gainedSkills.length > 0) {
        skillsHTML = '<div class="skill-gain"><h4>Получены навыки:</h4>';
        gainedSkills.forEach(skill => {
            skillsHTML += `<p>${skill.name} +1 (уровень ${skill.newLevel})</p>`;
        });
        skillsHTML += '</div>';
    }
    
    if (won) {
        resultDiv.innerHTML = `
            <h3 style="color: #4ecdc4;">ПОБЕДА!</h3>
            <p>Вы обогнали ${opponent.name}!</p>
            <p>Выигрыш: +$${opponent.reward}</p>
            <p>Ваше время: ${playerTime.toFixed(2)} сек</p>
            <p>Время соперника: ${opponentTime.toFixed(2)} сек</p>
            <p>Баланс: $${gameData.money}</p>
            ${skillsHTML}
        `;
    } else {
        resultDiv.innerHTML = `
            <h3 style="color: #ff6b6b;">ПОРАЖЕНИЕ</h3>
            <p>${opponent.name} оказался быстрее!</p>
            <p>Проигрыш: -$${betAmount}</p>
            <p>Ваше время: ${playerTime.toFixed(2)} сек</p>
            <p>Время соперника: ${opponentTime.toFixed(2)} сек</p>
            <p>Баланс: $${gameData.money}</p>
            ${skillsHTML}
        `;
    }
    
    updatePlayerInfo();
    await autoSave();
}

// Обновление информации игрока
function updatePlayerInfo() {
    const moneyElement = document.getElementById('money');
    const levelElement = document.getElementById('level');
    
    if (moneyElement) moneyElement.textContent = gameData.money;
    if (levelElement) levelElement.textContent = gameData.level;
}

// Функции для экрана авторизации
function showLoginForm() {
    document.getElementById('login-form').classList.add('active');
    document.getElementById('register-form').classList.remove('active');
}

function showRegisterForm() {
    document.getElementById('register-form').classList.add('active');
    document.getElementById('login-form').classList.remove('active');
}

function handleLogin() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    login(username, password).then(success => {
        if (success) showGame();
    });
}

function handleRegister() {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;
    
    if (password !== passwordConfirm) {
        alert('Пароли не совпадают!');
        return;
    }
    
    register(username, password).then(success => {
        if (success) showGame();
    });
}

function showAuthScreen() {
    document.getElementById('auth-container').style.display = 'flex';
    document.querySelector('.game-container').style.display = 'none';
}

function showGame() {
    document.getElementById('auth-container').style.display = 'none';
    document.querySelector('.game-container').style.display = 'block';
    
    const usernameElement = document.getElementById('username');
    if (usernameElement && currentUser) {
        usernameElement.textContent = currentUser.username;
    }
    
    updatePlayerInfo();
    
    navigationHistory = [];
    currentScreen = 'main-menu';
    showMainMenu(false);
}

// Инициализация игры
window.onload = async function() {
    if (await checkAuth()) {
        showGame();
    } else {
        showAuthScreen();
    }
};