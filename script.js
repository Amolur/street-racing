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

// Интервал автосохранения
let autoSaveInterval = null;

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

// Мобильное меню
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('active');
    
    // Блокируем скролл основного контента при открытом меню
    if (menu.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

// Функция для запуска автосохранения
function startAutoSave() {
    // Останавливаем предыдущий интервал если есть
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }
    
    // Сохраняем каждые 30 секунд
    autoSaveInterval = setInterval(async () => {
        if (currentUser) {
            try {
                await saveGameData(gameData);
                console.log('Автосохранение выполнено');
            } catch (error) {
                console.error('Ошибка автосохранения:', error);
            }
        }
    }, 30000); // 30 секунд
}

// Функция для остановки автосохранения
function stopAutoSave() {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
        autoSaveInterval = null;
    }
}

// Улучшенная навигация
function navigateTo(screenId) {
    // Закрываем мобильное меню
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
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

// Функции авторизации
async function register(username, password) {
    try {
        showLoading(true);
        const data = await registerAPI(username, password);
        currentUser = { username: data.user.username };
        gameData = data.user.gameData;
        showLoading(false);
        return true;
    } catch (error) {
        showLoading(false);
        alert(error.message);
        return false;
    }
}

async function login(username, password) {
    try {
        showLoading(true);
        const data = await loginAPI(username, password);
        currentUser = { username: data.user.username };
        gameData = data.user.gameData;
        showLoading(false);
        return true;
    } catch (error) {
        showLoading(false);
        alert(error.message);
        return false;
    }
}

function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        stopAutoSave();
        logoutAPI();
        currentUser = null;
        showAuthScreen();
    }
}

async function checkAuth() {
    const token = storage.getItem('authToken');
    if (!token) return false;
    
    try {
        showLoading(true);
        const data = await loadGameData();
        currentUser = { username: data.username };
        gameData = data.gameData;
        showLoading(false);
        return true;
    } catch (error) {
        showLoading(false);
        storage.removeItem('authToken');
        return false;
    }
}

// Показать/скрыть индикатор загрузки
function showLoading(show) {
    // Создаем индикатор загрузки если его нет
    let loadingIndicator = document.getElementById('loading-indicator');
    
    if (!loadingIndicator) {
        loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'loading-indicator';
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner-ring"></div>
                <p>Загрузка...</p>
            </div>
        `;
        document.body.appendChild(loadingIndicator);
    }
    
    loadingIndicator.style.display = show ? 'flex' : 'none';
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
        navigateTo(previousScreen);
    } else {
        navigateTo('main-menu');
    }
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
    updateQuickStats();
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

// Обновление информации игрока
function updatePlayerInfo() {
    // Обновляем деньги во всех местах
    const moneyElements = [
        document.getElementById('money'),
        document.getElementById('money-mobile'),
        document.getElementById('race-balance')
    ];
    
    moneyElements.forEach(element => {
        if (element) element.textContent = gameData.money;
    });
    
    // Обновляем уровень
    const levelElements = [
        document.getElementById('level'),
        document.getElementById('mobile-level'),
        document.getElementById('profile-level')
    ];
    
    levelElements.forEach(element => {
        if (element) element.textContent = gameData.level;
    });
    
    // Обновляем количество побед в header
    const winsHeader = document.getElementById('wins-header');
    if (winsHeader) winsHeader.textContent = gameData.stats.wins;
    
    // Обновляем текущую машину в гонках
    const raceCurrentCar = document.getElementById('race-current-car');
    if (raceCurrentCar && gameData.cars[gameData.currentCar]) {
        raceCurrentCar.textContent = gameData.cars[gameData.currentCar].name;
    }
    
    // Обновляем быструю статистику
    updateQuickStats();
}

// Функция обновления быстрой статистики на главной
function updateQuickStats() {
    const quickWins = document.getElementById('quick-wins');
    const quickCars = document.getElementById('quick-cars');
    const quickRating = document.getElementById('quick-rating');
    
    if (quickWins) quickWins.textContent = gameData.stats.wins;
    if (quickCars) quickCars.textContent = gameData.cars.length;
    if (quickRating) quickRating.textContent = '#—'; // Позже можно добавить реальный рейтинг
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

// Обновление отображения гаража
function updateGarageDisplay() {
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
}// Продолжение script.js...

// Функция обновления профиля
function updateProfileDisplay() {
    // Обновление имени пользователя в профиле
    const profileUsername = document.getElementById('profile-username');
    if (profileUsername && currentUser) {
        profileUsername.textContent = currentUser.username;
    }
    
    const profileLevel = document.getElementById('profile-level');
    if (profileLevel) {
        profileLevel.textContent = gameData.level;
    }
    
    // Навыки
    const profileSkillsDisplay = document.getElementById('profile-skills-display');
    if (profileSkillsDisplay) {
        profileSkillsDisplay.innerHTML = `
            <div class="skill-item">
                <span class="skill-name">Вождение</span>
                <div class="skill-bar">
                    <div class="skill-progress" style="width: ${gameData.skills.driving * 10}%"></div>
                </div>
                <span class="skill-level">${gameData.skills.driving}</span>
            </div>
            <div class="skill-item">
                <span class="skill-name">Скорость</span>
                <div class="skill-bar">
                    <div class="skill-progress" style="width: ${gameData.skills.speed * 10}%"></div>
                </div>
                <span class="skill-level">${gameData.skills.speed}</span>
            </div>
            <div class="skill-item">
                <span class="skill-name">Реакция</span>
                <div class="skill-bar">
                    <div class="skill-progress" style="width: ${gameData.skills.reaction * 10}%"></div>
                </div>
                <span class="skill-level">${gameData.skills.reaction}</span>
            </div>
            <div class="skill-item">
                <span class="skill-name">Техника</span>
                <div class="skill-bar">
                    <div class="skill-progress" style="width: ${gameData.skills.technique * 10}%"></div>
                </div>
                <span class="skill-level">${gameData.skills.technique}</span>
            </div>
        `;
    }
    
    // Статистика
    const profileStats = document.getElementById('profile-stats');
    if (profileStats) {
        const winRate = gameData.stats.totalRaces > 0 
            ? ((gameData.stats.wins / gameData.stats.totalRaces) * 100).toFixed(1) 
            : 0;
            
        profileStats.innerHTML = `
            <div class="stat-row">
                <span class="stat-label">Всего гонок:</span>
                <span class="stat-value">${gameData.stats.totalRaces}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Побед:</span>
                <span class="stat-value">${gameData.stats.wins}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Поражений:</span>
                <span class="stat-value">${gameData.stats.losses}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Процент побед:</span>
                <span class="stat-value">${winRate}%</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Заработано:</span>
                <span class="stat-value">$${gameData.stats.moneyEarned}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Потрачено:</span>
                <span class="stat-value">$${gameData.stats.moneySpent}</span>
            </div>
        `;
    }
}

// Функция обновления магазина
function updateShopDisplay() {
    // Машины для покупки
    const carsForSale = document.getElementById('cars-for-sale');
    if (carsForSale) {
        carsForSale.innerHTML = '';
        
        allCars.forEach(car => {
            const owned = gameData.cars.some(c => c.id === car.id);
            if (!owned && car.price > 0) {
                const carDiv = document.createElement('div');
                carDiv.className = 'car-shop-item';
                carDiv.innerHTML = `
                    <div class="car-shop-emoji">🚗</div>
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
                    <button class="btn-primary" onclick="buyCar(${car.id})" ${gameData.money < car.price ? 'disabled' : ''}>
                        ${gameData.money < car.price ? 'Недостаточно денег' : 'Купить'}
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
                carDiv.innerHTML = `
                    <div class="car-shop-emoji">🚗</div>
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
async function buyCar(carId) {
    const car = allCars.find(c => c.id === carId);
    if (!car || gameData.money < car.price) return;
    
    if (confirm(`Купить ${car.name} за $${car.price.toLocaleString()}?`)) {
        gameData.money -= car.price;
        gameData.stats.moneySpent += car.price;
        gameData.cars.push({...car, owned: true});
        
        // Проверяем достижение уровня
        checkLevelUp();
        
        updatePlayerInfo();
        updateShopDisplay();
        await autoSave();
        
        showError(`Вы купили ${car.name}!`);
    }
}

// Функция продажи машины
async function sellCar(index) {
    if (gameData.cars.length <= 1) {
        alert('Нельзя продать последнюю машину!');
        return;
    }
    
    const car = gameData.cars[index];
    const sellPrice = Math.floor(car.price * 0.7);
    
    if (confirm(`Продать ${car.name} за $${sellPrice.toLocaleString()}?`)) {
        gameData.money += sellPrice;
        gameData.stats.moneyEarned += sellPrice;
        gameData.cars.splice(index, 1);
        
        if (gameData.currentCar >= gameData.cars.length) {
            gameData.currentCar = 0;
        }
        
        updatePlayerInfo();
        updateShopDisplay();
        await autoSave();
        
        showError(`${car.name} продана за $${sellPrice.toLocaleString()}`);
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
                <span class="lb-level">Ур. ${player.level}</span>
                <span class="lb-money">$${player.money.toLocaleString()}</span>
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
            <div class="opponent-info">
                <h3>${opponent.name}</h3>
                <p class="opponent-car">Машина: ${opponent.car}</p>
                <div class="opponent-stakes">
                    <span class="stake-item">
                        <span class="stake-label">Ставка:</span>
                        <span class="stake-value">$${betAmount}</span>
                    </span>
                    <span class="stake-item">
                        <span class="stake-label">Выигрыш:</span>
                        <span class="stake-value">$${opponent.reward}</span>
                    </span>
                </div>
            </div>
            <button class="btn-primary race-btn" onclick="showRacePreview(${index})" ${!canAfford ? 'disabled' : ''}>
                ${canAfford ? 'Вызвать на гонку' : `Нужно $${betAmount}`}
            </button>
        `;
        opponentsList.appendChild(opponentCard);
    });
}

// Показать превью гонки
function showRacePreview(opponentIndex) {
    const opponent = opponents[opponentIndex];
    const currentCar = gameData.cars[gameData.currentCar];
    const betAmount = opponent.reward / 2;
    
    const modal = document.createElement('div');
    modal.className = 'race-preview-modal';
    modal.onclick = function(e) {
        if (e.target === modal) closeRacePreview();
    };
    
    modal.innerHTML = `
        <div class="race-preview-content">
            <button class="close-modal" onclick="closeRacePreview()">×</button>
            <h2>Вызов на гонку</h2>
            
            <div class="race-comparison">
                <div class="racer-info player">
                    <h3>${currentUser.username}</h3>
                    <div class="car-info">
                        <div class="car-image">🚗</div>
                        <h4>${currentCar.name}</h4>
                    </div>
                    
                    <div class="stats-section">
                        <h5>Характеристики</h5>
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
                        <div class="car-image">🏎️</div>
                        <h4>${opponent.car}</h4>
                    </div>
                    
                    <div class="stats-section">
                        <h5>Уровень сложности</h5>
                        <div class="difficulty-bar">
                            <div class="difficulty-fill" style="width: ${opponent.difficulty * 60}%"></div>
                        </div>
                        <p class="difficulty-text">${
                            opponent.difficulty < 1 ? 'Легко' :
                            opponent.difficulty < 1.3 ? 'Средне' :
                            opponent.difficulty < 1.5 ? 'Сложно' : 'Очень сложно'
                        }</p>
                    </div>
                </div>
            </div>
            
            <div class="modal-buttons">
                <button class="btn-primary race-start-btn" onclick="confirmRace(${opponentIndex})">Начать гонку!</button>
                <button class="btn-secondary" onclick="closeRacePreview()">Отмена</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}
// Продолжение script.js (часть 3)...

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

// Проверка повышения уровня
function checkLevelUp() {
    const totalStats = gameData.stats.wins * 100 + gameData.money + gameData.cars.length * 1000;
    const newLevel = Math.floor(totalStats / 5000) + 1;
    
    if (newLevel > gameData.level) {
        gameData.level = newLevel;
        showError(`Поздравляем! Вы достигли уровня ${newLevel}!`);
    }
}

// Функция расчета получения навыков после гонки
function calculateSkillGain(isWin) {
    const skillNames = ['driving', 'speed', 'reaction', 'technique'];
    const skillNamesRu = {
        driving: 'Вождение',
        speed: 'Скорость',
        reaction: 'Реакция',
        technique: 'Техника'
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
        
        if (Math.random() < chance && currentSkillLevel < 10) {
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

// Старт гонки
async function startRace(opponentIndex) {
    const opponent = opponents[opponentIndex];
    const currentCar = gameData.cars[gameData.currentCar];
    
    const betAmount = opponent.reward / 2;
    if (gameData.money < betAmount) {
        alert(`Недостаточно денег для участия! Нужно минимум $${betAmount}`);
        return;
    }
    
// Показываем индикатор загрузки
    showLoading(true);
    
    // Имитация гонки
    setTimeout(async () => {
        // Расчет параметров машины игрока (0-100)
        const carPower = (currentCar.power + currentCar.speed + currentCar.handling + currentCar.acceleration) / 4;
        
        // Расчет бонуса от навыков (каждый уровень дает небольшой процент)
        const skillMultiplier = 1 + (
            gameData.skills.driving * 0.002 +      // +0.2% за уровень
            gameData.skills.speed * 0.002 +        // +0.2% за уровень
            gameData.skills.reaction * 0.0015 +    // +0.15% за уровень
            gameData.skills.technique * 0.0015     // +0.15% за уровень
        );
        
        // Общая эффективность игрока (с учетом навыков)
        const playerEfficiency = carPower * skillMultiplier;
        
        // Расчет эффективности соперника (базовая 60 * сложность)
        const opponentEfficiency = 60 * opponent.difficulty;
        
        // Базовое время трассы 60 секунд
        const trackBaseTime = 60;
        
        // Добавляем элемент случайности (±5% от результата)
        const playerRandomFactor = 0.95 + Math.random() * 0.1;
        const opponentRandomFactor = 0.95 + Math.random() * 0.1;
        
        // Расчет финального времени
        const playerTime = trackBaseTime * (100 / playerEfficiency) * playerRandomFactor;
        const opponentTime = trackBaseTime * (100 / opponentEfficiency) * opponentRandomFactor;
        
        // Побеждает тот, у кого меньше время
        const won = playerTime < opponentTime;
        
        // Обновляем статистику
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
        
        // Получение навыков
        const gainedSkills = calculateSkillGain(won);
        
        // Проверка повышения уровня
        checkLevelUp();
        
        // Скрываем загрузку
        showLoading(false);
        
        // Показываем результат
        showRaceResultScreen();
        
        const resultDiv = document.getElementById('race-result');
        let skillsHTML = '';
        
        if (gainedSkills.length > 0) {
            skillsHTML = '<div class="skill-gain"><h4>Получены навыки:</h4>';
            gainedSkills.forEach(skill => {
                skillsHTML += `<p class="skill-gain-item">✨ ${skill.name} +1 (уровень ${skill.newLevel})</p>`;
            });
            skillsHTML += '</div>';
        }
        
        if (won) {
            resultDiv.innerHTML = `
                <div class="result-container">
                    <h2 class="result-title win">🏆 ПОБЕДА!</h2>
                    <div class="result-animation">🎉</div>
                    
                    <div class="result-info">
                        <p>Вы обогнали <strong>${opponent.name}</strong>!</p>
                        
                        <div class="race-times">
                            <div class="time-block player">
                                <h4>Ваше время</h4>
                                <p class="time-value">${playerTime.toFixed(2)} сек</p>
                            </div>
                            <div class="time-block opponent">
                                <h4>Время соперника</h4>
                                <p class="time-value">${opponentTime.toFixed(2)} сек</p>
                            </div>
                        </div>
                        
                        <div class="result-rewards">
                            <p class="reward-item">💰 Выигрыш: <span class="money-gain">+$${opponent.reward}</span></p>
                            <p class="balance">Баланс: $${gameData.money}</p>
                        </div>
                        
                        ${skillsHTML}
                    </div>
                    
                    <div class="result-actions">
                        <button class="btn-primary" onclick="showRaceMenu()">Новая гонка</button>
                        <button class="btn-secondary" onclick="showMainMenu()">В главное меню</button>
                    </div>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `
                <div class="result-container">
                    <h2 class="result-title lose">😔 ПОРАЖЕНИЕ</h2>
                    
                    <div class="result-info">
                        <p><strong>${opponent.name}</strong> оказался быстрее!</p>
                        
                        <div class="race-times">
                            <div class="time-block player">
                                <h4>Ваше время</h4>
                                <p class="time-value">${playerTime.toFixed(2)} сек</p>
                            </div>
                            <div class="time-block opponent">
                                <h4>Время соперника</h4>
                                <p class="time-value">${opponentTime.toFixed(2)} сек</p>
                            </div>
                        </div>
                        
                        <div class="result-rewards">
                            <p class="reward-item">💸 Проигрыш: <span class="money-loss">-$${betAmount}</span></p>
                            <p class="balance">Баланс: $${gameData.money}</p>
                        </div>
                        
                        ${skillsHTML}
                    </div>
                    
                    <div class="result-actions">
                        <button class="btn-primary" onclick="showRaceMenu()">Попробовать снова</button>
                        <button class="btn-secondary" onclick="showMainMenu()">В главное меню</button>
                    </div>
                </div>
            `;
        }
        
        updatePlayerInfo();
        await autoSave();
    }, 2000); // Задержка для эффекта
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

async function handleLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!username || !password) {
        alert('Введите логин и пароль');
        return;
    }
    
    const success = await login(username, password);
    if (success) {
        showGame();
    }
}

async function handleRegister() {
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;
    
    if (!username || !password) {
        alert('Введите логин и пароль');
        return;
    }
    
    if (username.length < 3) {
        alert('Логин должен быть не менее 3 символов');
        return;
    }
    
    if (password.length < 6) {
        alert('Пароль должен быть не менее 6 символов');
        return;
    }
    
    if (password !== passwordConfirm) {
        alert('Пароли не совпадают!');
        return;
    }
    
    const success = await register(username, password);
    if (success) {
        showGame();
    }
}

function showAuthScreen() {
    document.getElementById('auth-container').style.display = 'flex';
    document.querySelector('.game-container').style.display = 'none';
    
    // Очищаем поля
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('register-username').value = '';
    document.getElementById('register-password').value = '';
    document.getElementById('register-password-confirm').value = '';
}

function showGame() {
    document.getElementById('auth-container').style.display = 'none';
    document.querySelector('.game-container').style.display = 'block';
    
    // Обновляем информацию пользователя
    const usernameElements = [
        document.getElementById('mobile-username'),
        document.getElementById('welcome-username'),
        document.getElementById('profile-username')
    ];
    
    usernameElements.forEach(element => {
        if (element && currentUser) {
            element.textContent = currentUser.username;
        }
    });
    
    // Обновляем аватары
    const avatars = document.querySelectorAll('.user-avatar, .profile-avatar');
    avatars.forEach(avatar => {
        if (currentUser) {
            avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.username)}&background=4ecdc4&color=1a1a1a&size=100`;
        }
    });
    
    updatePlayerInfo();
    updateQuickStats();
    
    // Запускаем автосохранение
    startAutoSave();
    
    navigationHistory = [];
    currentScreen = 'main-menu';
    showMainMenu(false);
}

// Обработка событий клавиатуры для авторизации
document.addEventListener('DOMContentLoaded', function() {
    // Enter для входа
    document.getElementById('login-password')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleLogin();
    });
    
    document.getElementById('register-password-confirm')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleRegister();
    });
    
    // Закрытие модальных окон по Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeRacePreview();
        }
    });
    
    // Обработка свайпов для мобильного меню
    let touchStartX = 0;
    let touchEndX = 0;
    
    document.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    document.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const menu = document.getElementById('mobile-menu');
        
        if (touchEndX < touchStartX - swipeThreshold && menu.classList.contains('active')) {
            // Свайп влево - закрываем меню
            toggleMobileMenu();
        } else if (touchEndX > touchStartX + swipeThreshold && touchStartX < 50) {
            // Свайп вправо от края - открываем меню
            if (!menu.classList.contains('active')) {
                toggleMobileMenu();
            }
        }
    }
});

// Сохранение при закрытии/обновлении страницы
window.addEventListener('beforeunload', async (e) => {
    if (currentUser && gameData) {
        // Пытаемся сохранить данные
        try {
            await saveGameData(gameData);
        } catch (error) {
            console.error('Не удалось сохранить при закрытии:', error);
        }
    }
});

// Периодическая проверка соединения и синхронизация
setInterval(async () => {
    if (currentUser && navigator.onLine) {
        try {
            // Пробуем синхронизировать данные
            await saveGameData(gameData);
        } catch (error) {
            console.log('Фоновая синхронизация не удалась:', error);
        }
    }
}, 60000); // Каждую минуту

// Инициализация игры
window.onload = async function() {
    // Проверяем авторизацию
    const isAuthorized = await checkAuth();
    
    if (isAuthorized) {
        showGame();
    } else {
        showAuthScreen();
    }
    
    // Скрываем экран загрузки
    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
    }, 500);
};
        //Рассчет параметров машины игрока (0-100)
        const carPower = (currentCar.power + currentCar.speed + currentCar.handling + currentCar.acceleration) / 4;
        
        // Расчет бонуса от навыков (каждый уровень дает небольшой процент)
        const skillMultiplier = 1 + (
            gameData.skills.driving * 0.002 +      // +0.2% за уровень
            gameData.skills.speed * 0.002 +        // +0.2% за уровень
            gameData.skills.reaction * 0.0015 +    // +0.15% за уровень
            gameData.skills.technique * 0.0015     // +0.15% за уровень
        );
        
        // Общая эффективность игрока (с учетом навыков)
        const playerEfficiency = carPower * skillMultiplier;
        
        // Расчет эффективности соперника (базовая 60 * сложность)
        const opponentEfficiency = 60 * opponent.difficulty;
        
        // Базовое время трассы 60 секунд
        const trackBaseTime = 60;
        
        // Добавляем элемент случайности (±5% от результата)
        const playerRandomFactor = 0.95 + Math.random() * 0.1;
        const opponentRandomFactor = 0.95 + Math.random() * 0.1;
        
        // Рас