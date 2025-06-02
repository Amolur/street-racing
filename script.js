// Игровые данные
let gameData = {
    money: 1000,
    level: 1,
    experience: 0,
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
            name: "Handa Civic",
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

// Система уровней
const levelSystem = {
    // Опыт необходимый для каждого уровня (прогрессивная шкала)
    getRequiredXP: function(level) {
        return Math.floor(100 * Math.pow(1.5, level - 1));
    },
    
    // Награды за уровень
    getLevelReward: function(level) {
        const baseReward = 500;
        return baseReward * level;
    },
    
    // Проверка доступности машины по уровню
    getCarRequiredLevel: function(carPrice) {
        if (carPrice === 0) return 1;
        if (carPrice <= 5000) return 1;
        if (carPrice <= 15000) return 5;
        if (carPrice <= 30000) return 10;
        if (carPrice <= 50000) return 15;
        if (carPrice <= 80000) return 20;
        if (carPrice <= 150000) return 25;
        return 30;
    },
    
    // Расчет получаемого опыта
    calculateXPGain: function(won, opponentDifficulty, betAmount) {
        const baseXP = won ? 50 : 20;
        const difficultyBonus = Math.floor(opponentDifficulty * 30);
        const betBonus = Math.floor(betAmount / 100);
        return baseXP + difficultyBonus + betBonus;
    }
};

// Список всех доступных машин в игре (30 штук)
const allCars = [
    // Начальные машины (0-5000$)
    { id: 0, name: "Handa Civic", power: 50, speed: 60, handling: 70, acceleration: 55, price: 0 },
    { id: 1, name: "Volks Golf", power: 55, speed: 65, handling: 75, acceleration: 60, price: 3000 },
    { id: 2, name: "Toyata Corolla", power: 52, speed: 62, handling: 72, acceleration: 58, price: 3500 },
    { id: 3, name: "Mazta MX-3", power: 60, speed: 70, handling: 85, acceleration: 65, price: 5000 },
    
    // Городские машины (5000-15000$) - требуют 5 уровень
    { id: 4, name: "Nisan Altma", power: 65, speed: 72, handling: 78, acceleration: 68, price: 8000 },
    { id: 5, name: "Handa Acord", power: 68, speed: 74, handling: 76, acceleration: 70, price: 9500 },
    { id: 6, name: "Subare Impeza", power: 75, speed: 80, handling: 82, acceleration: 78, price: 12000 },
    { id: 7, name: "Mitsu Lanser", power: 73, speed: 78, handling: 80, acceleration: 75, price: 13000 },
    { id: 8, name: "Mazta 6", power: 70, speed: 76, handling: 83, acceleration: 72, price: 14000 },
    
    // Спортивные седаны (15000-30000$) - требуют 10 уровень
    { id: 9, name: "BMV 330i", power: 78, speed: 82, handling: 85, acceleration: 80, price: 18000 },
    { id: 10, name: "Audi S3", power: 80, speed: 84, handling: 83, acceleration: 82, price: 22000 },
    { id: 11, name: "Merco C300", power: 82, speed: 86, handling: 81, acceleration: 79, price: 25000 },
    { id: 12, name: "Lexas IS350", power: 85, speed: 88, handling: 79, acceleration: 83, price: 28000 },
    
    // Маслкары (30000-50000$) - требуют 15 уровень
    { id: 13, name: "Dodger Chalenger", power: 88, speed: 85, handling: 75, acceleration: 86, price: 32000 },
    { id: 14, name: "Fordo Mustag", power: 90, speed: 87, handling: 77, acceleration: 88, price: 35000 },
    { id: 15, name: "Camaро SS", power: 92, speed: 89, handling: 74, acceleration: 90, price: 38000 },
    { id: 16, name: "Pontik Firebird", power: 87, speed: 83, handling: 76, acceleration: 85, price: 40000 },
    
    // Спорткары (50000-80000$) - требуют 20 уровень
    { id: 17, name: "Nisan 370X", power: 85, speed: 90, handling: 88, acceleration: 87, price: 45000 },
    { id: 18, name: "Toyata Supera", power: 88, speed: 92, handling: 86, acceleration: 89, price: 52000 },
    { id: 19, name: "Mazta RX-8", power: 83, speed: 88, handling: 92, acceleration: 85, price: 55000 },
    { id: 20, name: "Subaro BRX", power: 80, speed: 85, handling: 94, acceleration: 82, price: 58000 },
    { id: 21, name: "Porshe Kayman", power: 90, speed: 94, handling: 95, acceleration: 91, price: 65000 },
    { id: 22, name: "Corveta C7", power: 95, speed: 96, handling: 87, acceleration: 93, price: 75000 },
    
    // Суперкары (80000-150000$) - требуют 25 уровень
    { id: 23, name: "Audi R7", power: 93, speed: 95, handling: 90, acceleration: 92, price: 85000 },
    { id: 24, name: "BMV M8", power: 94, speed: 97, handling: 89, acceleration: 94, price: 95000 },
    { id: 25, name: "Merco AMG GT", power: 96, speed: 98, handling: 88, acceleration: 95, price: 110000 },
    { id: 26, name: "Nisan GT-X", power: 97, speed: 99, handling: 86, acceleration: 98, price: 125000 },
    
    // Гиперкары (150000+$) - требуют 30 уровень
    { id: 27, name: "Lambo Hurican", power: 98, speed: 100, handling: 91, acceleration: 97, price: 180000 },
    { id: 28, name: "Ferari 458", power: 99, speed: 100, handling: 93, acceleration: 96, price: 220000 },
    { id: 29, name: "McLaran 720X", power: 100, speed: 100, handling: 95, acceleration: 99, price: 300000 }
];

// Функция для генерации динамических соперников
function generateDynamicOpponents() {
    const playerLevel = gameData.level;
    const baseOpponents = [];
    
    // Генерируем 4 соперника разной сложности
    const difficulties = ['easy', 'medium', 'hard', 'extreme'];
    const difficultySettings = {
        easy: { 
            diffMult: 0.8, 
            rewardMult: 0.8,
            names: ["Новичок", "Студент", "Таксист", "Курьер"]
        },
        medium: { 
            diffMult: 1.0, 
            rewardMult: 1.0,
            names: ["Гонщик", "Дрифтер", "Стритрейсер", "Спидстер"]
        },
        hard: { 
            diffMult: 1.3, 
            rewardMult: 1.5,
            names: ["Профи", "Мастер", "Чемпион", "Ветеран"]
        },
        extreme: { 
            diffMult: 1.6, 
            rewardMult: 2.0,
            names: ["Легенда", "Призрак", "Босс", "Король"]
        }
    };
    
    const surnames = ["Иван", "Петр", "Алексей", "Максим", "Артем", "Денис", "Виктор", "Сергей"];
    
    difficulties.forEach(diff => {
        const settings = difficultySettings[diff];
        const randomName = settings.names[Math.floor(Math.random() * settings.names.length)];
        const randomSurname = surnames[Math.floor(Math.random() * surnames.length)];
        
        // Выбираем подходящую машину для соперника
        const maxCarPrice = 5000 + (playerLevel * 5000);
        const availableCars = allCars.filter(car => car.price <= maxCarPrice && car.price > 0);
        const randomCar = availableCars[Math.floor(Math.random() * availableCars.length)] || allCars[1];
        
        // Расчет сложности и награды
        const baseDifficulty = 0.7 + (playerLevel * 0.02);
        const difficulty = Number((baseDifficulty * settings.diffMult).toFixed(2));
        const baseReward = 200 + (playerLevel * 100);
        const reward = Math.floor(baseReward * settings.rewardMult / 50) * 50;
        
        baseOpponents.push({
            name: `${randomName} ${randomSurname}`,
            car: randomCar.name,
            difficulty: difficulty,
            reward: reward
        });
    });
    
    return baseOpponents;
}

// Упрощенное автосохранение (ТОЛЬКО сервер)
function startAutoSave() {
    // Останавливаем предыдущий интервал если есть
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }
    
    // Сохраняем каждые 60 секунд (увеличили интервал)
    autoSaveInterval = setInterval(async () => {
        if (currentUser) {
            try {
                await saveGameData(gameData);
                console.log('Автосохранение выполнено');
            } catch (error) {
                console.error('Ошибка автосохранения:', error);
                // Не показываем ошибку пользователю при автосохранении
            }
        }
    }, 60000); // 60 секунд
}

// Функция для остановки автосохранения
function stopAutoSave() {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
        autoSaveInterval = null;
    }
}

// Улучшенная навигация (без мобильного меню)
function navigateTo(screenId) {
    // Скрываем все экраны
    hideAllScreens();
    
    // Показываем нужный экран
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
        navigateToScreen(screenId);
    }
    
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

// Функции авторизации
async function register(username, password) {
    try {
        showLoading(true);
        const data = await registerAPI(username, password);
        currentUser = { username: data.user.username };
        gameData = data.user.gameData;
        
        // Добавляем поля опыта если их нет
        if (!gameData.experience) gameData.experience = 0;
        
        // Инициализируем улучшения для всех загруженных машин
        if (gameData.cars) {
            gameData.cars.forEach(car => initializeCarUpgrades(car));
        }
        
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
        
        // Добавляем поля опыта если их нет
        if (!gameData.experience) gameData.experience = 0;
        
        console.log('Загруженные данные с сервера:', gameData);
        
        // Инициализируем улучшения для всех загруженных машин
        if (gameData.cars) {
            gameData.cars.forEach(car => {
                console.log('Машина до инициализации:', car);
                initializeCarUpgrades(car);
                console.log('Машина после инициализации:', car);
            });
        }
        
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
        stopFuelUpdates();
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
        
        // Добавляем поля опыта если их нет
        if (!gameData.experience) gameData.experience = 0;
        
        // Инициализируем улучшения для всех машин
        if (gameData.cars) {
            gameData.cars.forEach(car => initializeCarUpgrades(car));
        }
        
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
            // Убеждаемся, что все машины имеют структуру улучшений перед сохранением
            if (gameData.cars) {
                gameData.cars.forEach(car => initializeCarUpgrades(car));
            }
            
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
    
    // Показываем панель если вернулись на главный экран
    if (currentScreen === 'main-menu') {
        showPlayerInfoBar();
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
    
    // Всегда показываем информационную панель на главном экране
    setTimeout(() => {
        showPlayerInfoBar();
    }, 100);
}

function showGarageScreen(addToHistory = true) {
    hidePlayerInfoBar();
    hideAllScreens();
    document.getElementById('garage-screen').classList.add('active');
    updateGarageDisplay();
    if (addToHistory) navigateToScreen('garage-screen');
}

function showRaceMenu(addToHistory = true) {
    hidePlayerInfoBar();
    hideAllScreens();
    document.getElementById('race-menu-screen').classList.add('active');
    displayOpponents();
    if (addToHistory) navigateToScreen('race-menu-screen');
}

function showProfileScreen(addToHistory = true) {
    hidePlayerInfoBar();
    hideAllScreens();
    document.getElementById('profile-screen').classList.add('active');
    updateProfileDisplay();
    if (addToHistory) navigateToScreen('profile-screen');
}

function showShopScreen(addToHistory = true) {
    hidePlayerInfoBar();
    hideAllScreens();
    document.getElementById('shop-screen').classList.add('active');
    updateShopDisplay();
    if (addToHistory) navigateToScreen('shop-screen');
}

async function showLeaderboardScreen(addToHistory = true) {
    hidePlayerInfoBar();
    hideAllScreens();
    document.getElementById('leaderboard-screen').classList.add('active');
    if (addToHistory) navigateToScreen('leaderboard-screen');
    await updateLeaderboard();
}

function showRaceResultScreen() {
    hidePlayerInfoBar();
    hideAllScreens();
    document.getElementById('race-result-screen').classList.add('active');
}

// Обновление информации игрока (обновлено для новых элементов)
function updatePlayerInfo() {
    // Обновляем деньги (ТОЛЬКО в других экранах, не в info bar)
    const moneyElements = [
        document.getElementById('race-balance'),
        document.getElementById('upgrade-balance')
    ];
    
    moneyElements.forEach(element => {
        if (element) element.textContent = gameData.money;
    });
    
    // Обновляем уровень (ТОЛЬКО в других экранах)
    const levelElements = [
        document.getElementById('profile-level')
    ];
    
    levelElements.forEach(element => {
        if (element) element.textContent = gameData.level;
    });
    
    // Обновляем текущую машину в гонках
    const raceCurrentCar = document.getElementById('race-current-car');
    if (raceCurrentCar && gameData.cars[gameData.currentCar]) {
        raceCurrentCar.textContent = gameData.cars[gameData.currentCar].name;
    }
    
    // Обновляем быструю статистику
    updateQuickStats();
    
    // Обновляем информационную панель ТОЛЬКО если мы на главном экране
    if (currentScreen === 'main-menu') {
        updatePlayerInfoBar();
    }
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
    }
}

function nextCar() {
    if (gameData.currentCar < gameData.cars.length - 1) {
        gameData.currentCar++;
        updateGarageDisplay();
    }
}

function updateCarSelector() {
    const selector = document.querySelector('.car-selector');
    if (selector) {
        selector.textContent = `${gameData.currentCar + 1} / ${gameData.cars.length}`;
    }
}

// Обновленное отображение гаража
function updateGarageDisplay() {
    // Проверяем, что данные загружены
    if (!gameData || !gameData.cars || gameData.cars.length === 0) return;
    
    updateCarsPreview();
    updateCurrentCarStats();
    
    // Проверяем, какая вкладка активна, и обновляем соответствующий контент
    const activeTab = document.querySelector('.garage-tab-modern.active');
    if (activeTab) {
        const isUpgradesTab = activeTab.textContent.includes('Улучшения');
        if (isUpgradesTab) {
            updateUpgradesDisplay();
        } else {
            updateSpecialPartsDisplay();
        }
    } else {
        // По умолчанию показываем улучшения
        updateUpgradesDisplay();
    }
}

// Отображение превью машин
function updateCarsPreview() {
    const carsList = document.getElementById('cars-list');
    const carCounter = document.getElementById('car-counter');
    
    if (!carsList || !gameData.cars) return;
    
    carsList.innerHTML = '';
    
    gameData.cars.forEach((car, index) => {
        // Инициализируем улучшения для каждой машины
        initializeCarUpgrades(car);
        const totalUpgrades = car.upgrades ? 
            Object.values(car.upgrades).reduce((sum, level) => sum + level, 0) : 0;
        
        const carCard = document.createElement('div');
        carCard.className = `car-card ${index === gameData.currentCar ? 'active' : ''}`;
        
        carCard.innerHTML = `
            <div class="car-emoji-big">🏎️</div>
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
function updateCurrentCarStats() {
    if (!gameData.cars || !gameData.cars[gameData.currentCar]) return;
    
    const currentCar = gameData.cars[gameData.currentCar];
    initializeCarUpgrades(currentCar);
    
    // Проверяем, что функция calculateTotalStats существует
    let totalStats;
    if (typeof calculateTotalStats === 'function') {
        totalStats = calculateTotalStats(currentCar);
    } else {
        // Фаллбэк на базовые характеристики
        totalStats = {
            power: currentCar.power,
            speed: currentCar.speed,
            handling: currentCar.handling,
            acceleration: currentCar.acceleration
        };
    }
    
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

// Обновленное отображение улучшений
function updateUpgradesDisplay() {
    const upgradesGrid = document.getElementById('upgrades-grid');
    
    if (!upgradesGrid || !gameData.cars || !gameData.cars[gameData.currentCar]) return;
    
    const currentCar = gameData.cars[gameData.currentCar];
    initializeCarUpgrades(currentCar);
    
    upgradesGrid.innerHTML = '';
    
    // Проверяем, что upgradeConfig существует
    if (typeof upgradeConfig === 'undefined') {
        upgradesGrid.innerHTML = '<p>Система улучшений загружается...</p>';
        return;
    }
    
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
        
        // Проверяем, что функция getUpgradeCost существует
        let cost = 1000;
        if (typeof getUpgradeCost === 'function') {
            cost = getUpgradeCost(upgradeType, currentLevel);
        }
        
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
                        const statName = typeof getStatName === 'function' ? getStatName(stat) : stat;
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
function updateSpecialPartsDisplay() {
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

// Переключение вкладок гаража (БЕЗ рекурсии)
function showGarageTab(tab) {
    // Обновляем кнопки вкладок
    document.querySelectorAll('.garage-tab-modern').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.garage-tab-content').forEach(content => content.classList.remove('active'));
    
    if (tab === 'upgrades') {
        const upgradesTab = document.querySelector('.garage-tab-modern:first-child');
        const upgradesContent = document.getElementById('garage-upgrades-modern');
        
        if (upgradesTab) upgradesTab.classList.add('active');
        if (upgradesContent) upgradesContent.classList.add('active');
        
        // Задержка для избежания конфликтов
        setTimeout(() => {
            updateUpgradesDisplay();
        }, 10);
        
    } else if (tab === 'parts') {
        const partsTab = document.querySelector('.garage-tab-modern:last-child');
        const partsContent = document.getElementById('garage-parts-modern');
        
        if (partsTab) partsTab.classList.add('active');
        if (partsContent) partsContent.classList.add('active');
        
        // Задержка для избежания конфликтов
        setTimeout(() => {
            updateSpecialPartsDisplay();
        }, 10);
    }
}

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
    
    // Добавляем отображение опыта
    const profileInfo = document.querySelector('.profile-info');
    if (profileInfo && !document.getElementById('profile-xp-bar')) {
        const currentXP = gameData.experience || 0;
        const requiredXP = levelSystem.getRequiredXP(gameData.level);
        const nextLevelXP = levelSystem.getRequiredXP(gameData.level + 1);
        const progressXP = currentXP - requiredXP;
        const neededXP = nextLevelXP - requiredXP;
        const xpPercent = Math.floor((progressXP / neededXP) * 100);
        
        const xpDisplay = document.createElement('div');
        xpDisplay.innerHTML = `
            <p>Опыт: ${currentXP} / ${nextLevelXP}</p>
            <div class="xp-progress-bar" id="profile-xp-bar">
                <div class="xp-progress-fill" style="width: ${xpPercent}%"></div>
            </div>
        `;
        profileInfo.appendChild(xpDisplay);
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
                    <div class="car-shop-emoji">🚗</div>
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

// Функция покупки машины (ТОЛЬКО сервер)
async function buyCar(carId) {
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
    
    // Применяем изменения локально (для UI)
    gameData.money -= car.price;
    gameData.stats.moneySpent += car.price;
    
    const newCar = {...car, owned: true};
    initializeCarUpgrades(newCar);
    gameData.cars.push(newCar);
    
    // Обновляем интерфейс сразу
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
        
        try {
            await saveGameData(gameData);
            showError(`${car.name} продана за $${sellPrice.toLocaleString()}`);
        } catch (error) {
            console.error('Ошибка сохранения продажи:', error);
            showError('⚠️ Продажа может не сохраниться. Проверьте соединение.');
        }
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
    
    // Добавляем информацию о топливе текущей машины
    const currentCar = gameData.cars[gameData.currentCar];
    const currentFuel = fuelSystem.getCurrentFuel(currentCar);
    
    // Обновляем баннер с топливом
    const raceInfoBanner = document.querySelector('.race-info-banner');
    if (raceInfoBanner) {
        raceInfoBanner.innerHTML = `
            <p>Ваша машина: <strong id="race-current-car">${currentCar.name}</strong></p>
            <p>Топливо: <strong id="race-car-fuel">⛽ ${currentFuel}/${currentCar.maxFuel || 30}</strong></p>
            <p>Баланс: <strong>$<span id="race-balance">${gameData.money}</span></strong></p>
        `;
    }
    
    opponentsList.innerHTML = '';
    
    // Генерируем динамических соперников
    const opponents = generateDynamicOpponents();
    
    opponents.forEach((opponent, index) => {
        const betAmount = Math.floor(opponent.reward / 2);
        const fuelCost = fuelSystem.calculateFuelCost(opponent.difficulty);
        const canAfford = gameData.money >= betAmount && currentFuel >= fuelCost;
        
        const opponentCard = document.createElement('div');
        opponentCard.className = 'opponent-card';
        opponentCard.style.opacity = canAfford ? '1' : '0.5';
        
        // Добавляем цветовую индикацию сложности
        let difficultyColor = '';
        if (opponent.difficulty < 1.0) difficultyColor = 'easy';
        else if (opponent.difficulty < 1.4) difficultyColor = 'medium';
        else if (opponent.difficulty < 1.8) difficultyColor = 'hard';
        else difficultyColor = 'extreme';
        
        opponentCard.innerHTML = `
            <div class="opponent-info">
                <h3>${opponent.name}</h3>
                <p class="opponent-car">Машина: ${opponent.car}</p>
                <p class="opponent-difficulty ${difficultyColor}">
                    Сложность: ${opponent.difficulty < 1.0 ? '⭐' : 
                                opponent.difficulty < 1.4 ? '⭐⭐' :
                                opponent.difficulty < 1.8 ? '⭐⭐⭐' : '⭐⭐⭐⭐'}
                </p>
                <div class="opponent-stakes">
                    <span class="stake-item">
                        <span class="stake-label">Ставка:</span>
                        <span class="stake-value">${betAmount}</span>
                    </span>
                    <span class="stake-item">
                        <span class="stake-label">Выигрыш:</span>
                        <span class="stake-value">${opponent.reward}</span>
                    </span>
                    <span class="stake-item">
                        <span class="stake-label">Топливо:</span>
                        <span class="stake-value fuel-cost">⛽ ${fuelCost}</span>
                    </span>
                </div>
            </div>
            <button class="btn-primary race-btn" onclick="showRacePreview(${index}); return false;" 
                    ${!canAfford ? 'disabled' : ''}>
                ${gameData.money < betAmount ? `Нужно ${betAmount}` : 
                  currentFuel < fuelCost ? `Нужно ⛽${fuelCost}` : 'Вызвать на гонку'}
            </button>
        `;
        opponentsList.appendChild(opponentCard);
    });
}

// Показать превью гонки
function showRacePreview(opponentIndex) {
    const opponents = generateDynamicOpponents();
    const opponent = opponents[opponentIndex];
    const currentCar = gameData.cars[gameData.currentCar];
    const betAmount = Math.floor(opponent.reward / 2);
    const fuelCost = fuelSystem.calculateFuelCost(opponent.difficulty);
    const currentFuel = fuelSystem.getCurrentFuel(currentCar);
    
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
                        <p class="fuel-status">⛽ ${currentFuel}/${currentCar.maxFuel || 30}</p>
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
                        <p>Ставка: <strong>${betAmount}</strong></p>
                        <p>Выигрыш: <strong>${opponent.reward}</strong></p>
                        <p>Расход топлива: <strong>⛽ ${fuelCost}</strong></p>
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
                <button class="btn-primary race-start-btn" onclick="confirmRace(${opponentIndex}); return false;"
                        ${currentFuel < fuelCost ? 'disabled' : ''}>
                    ${currentFuel < fuelCost ? `Недостаточно топлива (нужно ${fuelCost})` : 'Начать гонку!'}
                </button>
                <button class="btn-secondary" onclick="closeRacePreview(); return false;">Отмена</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
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
    setTimeout(() => {
        startRace(opponentIndex);
    }, 100);
}

// Обновленная функция проверки повышения уровня
function checkLevelUp() {
    const currentXP = gameData.experience || 0;
    const currentLevelXP = levelSystem.getRequiredXP(gameData.level);
    const nextLevelXP = levelSystem.getRequiredXP(gameData.level + 1);
    
    if (currentXP >= nextLevelXP) {
        gameData.level++;
        const reward = levelSystem.getLevelReward(gameData.level);
        gameData.money += reward;
        
        showError(`🎉 Поздравляем! Вы достигли ${gameData.level} уровня!\nНаграда: $${reward}`);
        
        // Проверяем еще раз, вдруг сразу несколько уровней
        checkLevelUp();
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

// Старт гонки (БЕЗ ЗАГРУЗКИ - МГНОВЕННЫЙ РЕЗУЛЬТАТ)
async function startRace(opponentIndex) {
    const opponents = generateDynamicOpponents();
    const opponent = opponents[opponentIndex];
    const currentCar = gameData.cars[gameData.currentCar];
    
    // Инициализируем улучшения если их нет
    initializeCarUpgrades(currentCar);
    
    const betAmount = Math.floor(opponent.reward / 2);
    const fuelCost = fuelSystem.calculateFuelCost(opponent.difficulty);
    const currentFuel = fuelSystem.getCurrentFuel(currentCar);
    
    if (gameData.money < betAmount) {
        alert(`Недостаточно денег для участия! Нужно минимум ${betAmount}`);
        return;
    }
    
    if (currentFuel < fuelCost) {
        alert(`Недостаточно топлива! Нужно ${fuelCost}, а у вас ${currentFuel}`);
        return;
    }
    
    // Тратим топливо
    currentCar.fuel = currentFuel - fuelCost;
    currentCar.lastFuelUpdate = new Date().toISOString();
    
    // Получаем характеристики с учетом улучшений
    const totalStats = calculateTotalStats(currentCar);
    
    // Расчет параметров машины игрока (0-100)
    const carPower = (totalStats.power + totalStats.speed + totalStats.handling + totalStats.acceleration) / 4;
    
    // Расчет бонуса от навыков (каждый уровень дает небольшой процент)
    const skillMultiplier = 1 + (
        gameData.skills.driving * 0.002 +
        gameData.skills.speed * 0.002 +
        gameData.skills.reaction * 0.0015 +
        gameData.skills.technique * 0.0015
    );
    
    // Общая эффективность игрока (с учетом навыков)
    let playerEfficiency = carPower * skillMultiplier;
    
    // Проверяем нитро
    if (currentCar.specialParts && currentCar.specialParts.nitro && Math.random() < 0.3) {
        playerEfficiency *= 1.2;
        showError("🚀 Нитро активировано!");
    }
    
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
    
    // Расчет опыта
    const xpGained = levelSystem.calculateXPGain(won, opponent.difficulty, betAmount);
    gameData.experience = (gameData.experience || 0) + xpGained;
    
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
    
    // Сразу показываем результат
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
    
    // Отображение полоски опыта
    const currentXP = gameData.experience || 0;
    const currentLevelXP = levelSystem.getRequiredXP(gameData.level);
    const nextLevelXP = levelSystem.getRequiredXP(gameData.level + 1);
    const progressXP = currentXP - currentLevelXP;
    const neededXP = nextLevelXP - currentLevelXP;
    const xpPercent = Math.floor((progressXP / neededXP) * 100);
    
    // Информация о топливе
    const fuelInfo = `
        <div class="fuel-spent-info">
            <p>⛽ Потрачено топлива: ${fuelCost}</p>
            <p>⛽ Осталось: ${currentCar.fuel}/${currentCar.maxFuel || 30}</p>
        </div>
    `;
    
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
                        <p class="reward-item">💰 Выигрыш: <span class="money-gain">+${opponent.reward}</span></p>
                        <p class="reward-item">⭐ Опыт: <span class="xp-gain">+${xpGained} XP</span></p>
                        <p class="balance">Баланс: ${gameData.money}</p>
                    </div>
                    
                    ${fuelInfo}
                    
                    <div class="xp-progress-section">
                        <p>Уровень ${gameData.level}: ${currentXP} / ${nextLevelXP} XP</p>
                        <div class="xp-progress-bar">
                            <div class="xp-progress-fill" style="width: ${xpPercent}%"></div>
                        </div>
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
                        <p class="reward-item">💸 Проигрыш: <span class="money-loss">-${betAmount}</span></p>
                        <p class="reward-item">⭐ Опыт: <span class="xp-gain">+${xpGained} XP</span></p>
                        <p class="balance">Баланс: ${gameData.money}</p>
                    </div>
                    
                    ${fuelInfo}
                    
                    <div class="xp-progress-section">
                        <p>Уровень ${gameData.level}: ${currentXP} / ${nextLevelXP} XP</p>
                        <div class="xp-progress-bar">
                            <div class="xp-progress-fill" style="width: ${xpPercent}%"></div>
                        </div>
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
    
    // Сохраняем результат гонки на сервер
    try {
        await saveGameData(gameData);
        console.log('Результат гонки сохранен на сервер');
    } catch (error) {
        console.error('Ошибка сохранения результата гонки:', error);
        showError('⚠️ Результат гонки может не сохраниться. Проверьте соединение.');
    }
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

// Обновленная функция showGame для главной страницы
function showGame() {
    document.getElementById('auth-container').style.display = 'none';
    document.querySelector('.game-container').style.display = 'block';
    
    // Обновляем аватары
    const avatars = document.querySelectorAll('.player-avatar, .profile-avatar');
    avatars.forEach(avatar => {
        if (currentUser) {
            avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.username)}&background=4ecdc4&color=1a1a1a&size=100`;
        }
    });
    
    updatePlayerInfo();
    updateQuickStats();
    
    // Запускаем автосохранение
    startAutoSave();
    
    // Запускаем обновление топлива
    startFuelUpdates();
    
    // Запускаем обновление информационной панели
    startInfoBarUpdates();
    
    navigationHistory = [];
    currentScreen = 'main-menu';
    showMainMenu(false);
    
    showPlayerInfoBar();
}

// Функция обновления полоски опыта
function updateXPBar() {
    const currentXP = gameData.experience || 0;
    const currentLevelXP = levelSystem.getRequiredXP(gameData.level);
    const nextLevelXP = levelSystem.getRequiredXP(gameData.level + 1);
    const progressXP = currentXP - currentLevelXP;
    const neededXP = nextLevelXP - currentLevelXP;
    const xpPercent = Math.floor((progressXP / neededXP) * 100);
    
    // Обновляем полоску в профиле
    const profileXPFill = document.getElementById('profile-xp-fill');
    if (profileXPFill) {
        profileXPFill.style.width = xpPercent + '%';
    }
    
    // Обновляем текст в профиле
    const profileXP = document.getElementById('profile-xp');
    const profileXPNext = document.getElementById('profile-xp-next');
    if (profileXP) profileXP.textContent = currentXP;
    if (profileXPNext) profileXPNext.textContent = nextLevelXP;
}

// Функция обновления быстрой статистики (теперь в профиле)
function updateQuickStats() {
    const profileWins = document.getElementById('profile-wins');
    const profileCars = document.getElementById('profile-cars');
    const profileRating = document.getElementById('profile-rating');
    
    if (profileWins) profileWins.textContent = gameData.stats.wins;
    if (profileCars) profileCars.textContent = gameData.cars.length;
    if (profileRating) profileRating.textContent = '#—'; // Позже можно добавить реальный рейтинг
}

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

// Конфигурация системы улучшений
const upgradeConfig = {
    engine: {
        name: "Двигатель",
        icon: "🔧",
        affects: { power: 5, speed: 3 },
        baseCost: 500,
        costMultiplier: 2.5,
        description: "Увеличивает мощность и скорость"
    },
    turbo: {
        name: "Турбо",
        icon: "💨",
        affects: { acceleration: 4, power: 2 },
        baseCost: 300,
        costMultiplier: 2.3,
        description: "Улучшает ускорение и мощность"
    },
    tires: {
        name: "Шины",
        icon: "🏁",
        affects: { handling: 3, acceleration: 2 },
        baseCost: 200,
        costMultiplier: 2.2,
        description: "Повышает управление и ускорение"
    },
    suspension: {
        name: "Подвеска",
        icon: "🔩",
        affects: { handling: 5 },
        baseCost: 400,
        costMultiplier: 2.4,
        description: "Значительно улучшает управление"
    },
    transmission: {
        name: "Коробка передач",
        icon: "⚙️",
        affects: { speed: 3, acceleration: 3 },
        baseCost: 600,
        costMultiplier: 2.5,
        description: "Увеличивает скорость и ускорение"
    }
};

// Система топлива
const fuelSystem = {
    baseConsumption: 5, // базовый расход топлива
    difficultyMultiplier: {
        easy: 1,
        medium: 1.5,
        hard: 2,
        extreme: 2.5
    },
    regenRate: 10, // минут на единицу топлива
    
    calculateFuelCost: function(difficulty) {
        let category = 'easy';
        if (difficulty >= 1.0 && difficulty < 1.4) category = 'medium';
        else if (difficulty >= 1.4 && difficulty < 1.8) category = 'hard';
        else if (difficulty >= 1.8) category = 'extreme';
        
        return Math.ceil(this.baseConsumption * this.difficultyMultiplier[category]);
    },
    
    getTimeUntilFull: function(currentFuel, maxFuel, lastUpdate) {
        if (currentFuel >= maxFuel) return 0;
        
        const now = new Date();
        const lastUpdateTime = new Date(lastUpdate);
        const minutesPassed = (now - lastUpdateTime) / 60000;
        const fuelRegenerated = Math.floor(minutesPassed / this.regenRate);
        const currentActualFuel = Math.min(currentFuel + fuelRegenerated, maxFuel);
        const fuelNeeded = maxFuel - currentActualFuel;
        
        return fuelNeeded * this.regenRate;
    },
    
    getCurrentFuel: function(car) {
        if (!car.lastFuelUpdate) return car.fuel || 30;
        
        const now = new Date();
        const lastUpdate = new Date(car.lastFuelUpdate);
        const minutesPassed = (now - lastUpdate) / 60000;
        const fuelRegenerated = Math.floor(minutesPassed / this.regenRate);
        
        return Math.min((car.fuel || 0) + fuelRegenerated, car.maxFuel || 30);
    }
};

// Интервал обновления топлива
let fuelUpdateInterval = null;

// Функция запуска обновления топлива
function startFuelUpdates() {
    if (fuelUpdateInterval) clearInterval(fuelUpdateInterval);
    
    fuelUpdateInterval = setInterval(() => {
        updateFuelDisplay();
    }, 10000); // каждые 10 секунд
}

// Функция остановки обновления топлива
function stopFuelUpdates() {
    if (fuelUpdateInterval) {
        clearInterval(fuelUpdateInterval);
        fuelUpdateInterval = null;
    }
}

function updateFuelDisplay() {
    // Обновляем топливо текущей машины в гараже
    const fuelDisplay = document.getElementById('current-car-fuel');
    if (fuelDisplay && gameData.cars[gameData.currentCar]) {
        const car = gameData.cars[gameData.currentCar];
        const currentFuel = fuelSystem.getCurrentFuel(car);
        const maxFuel = car.maxFuel || 30;
        
        fuelDisplay.innerHTML = `
            <div class="fuel-info">
                <span class="fuel-icon">⛽</span>
                <span class="fuel-text">${currentFuel}/${maxFuel}</span>
                ${currentFuel < maxFuel ? `<span class="fuel-timer" id="fuel-timer"></span>` : ''}
            </div>
            <div class="fuel-bar">
                <div class="fuel-bar-fill" style="width: ${(currentFuel / maxFuel) * 100}%"></div>
            </div>
        `;
        
        // Обновляем таймер
        if (currentFuel < maxFuel) {
            updateFuelTimer(car);
        }
    }
    
    // Обновляем топливо в списке соперников
    const raceCarFuel = document.getElementById('race-car-fuel');
    if (raceCarFuel && gameData.cars[gameData.currentCar]) {
        const car = gameData.cars[gameData.currentCar];
        const currentFuel = fuelSystem.getCurrentFuel(car);
        raceCarFuel.innerHTML = `⛽ ${currentFuel}/${car.maxFuel || 30}`;
    }
    
    // Обновляем информационную панель ТОЛЬКО если мы на главном экране
    if (currentScreen === 'main-menu') {
        updateFuelInfoBarDirect();
    }
}

// Обновление таймера топлива
function updateFuelTimer(car) {
    const timerElement = document.getElementById('fuel-timer');
    if (!timerElement) return;
    
    const update = () => {
        const now = new Date();
        const lastUpdate = new Date(car.lastFuelUpdate || now);
        const minutesPassed = (now - lastUpdate) / 60000;
        const minutesUntilNextFuel = fuelSystem.regenRate - (minutesPassed % fuelSystem.regenRate);
        
        if (minutesUntilNextFuel > 0) {
            const minutes = Math.floor(minutesUntilNextFuel);
            const seconds = Math.floor((minutesUntilNextFuel - minutes) * 60);
            timerElement.textContent = `(${minutes}:${seconds.toString().padStart(2, '0')})`;
        }
    };
    
    update();
    const interval = setInterval(update, 1000);
    
    // Сохраняем интервал для очистки
    if (window.fuelTimerInterval) clearInterval(window.fuelTimerInterval);
    window.fuelTimerInterval = interval;
}

// Обновляем структуру данных машин (добавляем в gameData.cars)
function initializeCarUpgrades(car) {
    // Инициализируем улучшения только если их нет
    if (!car.upgrades) {
        car.upgrades = {
            engine: 0,
            turbo: 0,
            tires: 0,
            suspension: 0,
            transmission: 0
        };
    }
    
    // Инициализируем специальные детали только если их нет
    if (!car.specialParts) {
        car.specialParts = {
            nitro: false,
            bodyKit: false,
            ecuTune: false,
            fuelTank: false
        };
    }
    
    // Инициализируем топливо
    if (car.fuel === undefined) {
        car.fuel = 30;
    }
    if (car.maxFuel === undefined) {
        car.maxFuel = car.specialParts.fuelTank ? 40 : 30;
    }
    if (!car.lastFuelUpdate) {
        car.lastFuelUpdate = new Date().toISOString();
    }
    
    // Возвращаем машину для удобства
    return car;
}

// Инициализируем улучшения для всех существующих машин при загрузке скрипта
// Эта строка выполнится только если gameData уже загружен
if (gameData && gameData.cars) {
    gameData.cars.forEach(car => initializeCarUpgrades(car));
}

// Расчет стоимости улучшения
function getUpgradeCost(type, currentLevel) {
    const config = upgradeConfig[type];
    return Math.floor(config.baseCost * Math.pow(config.costMultiplier, currentLevel));
}

// Расчет общих характеристик машины с учетом улучшений
function calculateTotalStats(car) {
    let totalStats = {
        power: car.power,
        speed: car.speed,
        handling: car.handling,
        acceleration: car.acceleration
    };
    
    // Применяем улучшения
    if (car.upgrades) {
        Object.keys(car.upgrades).forEach(upgradeType => {
            const level = car.upgrades[upgradeType];
            const config = upgradeConfig[upgradeType];
            
            if (config && config.affects) {
                Object.keys(config.affects).forEach(stat => {
                    totalStats[stat] += config.affects[stat] * level;
                });
            }
        });
    }
    
    // Применяем специальные детали
    if (car.specialParts) {
        if (car.specialParts.bodyKit) {
            Object.keys(totalStats).forEach(stat => {
                totalStats[stat] += 10;
            });
        }
        
        if (car.specialParts.ecuTune) {
            Object.keys(totalStats).forEach(stat => {
                totalStats[stat] = Math.floor(totalStats[stat] * 1.15);
            });
        }
    }
    
    return totalStats;
}

// Функция улучшения компонента (ТОЛЬКО сервер)
async function upgradeComponent(type) {
    const currentCar = gameData.cars[gameData.currentCar];
    const currentLevel = currentCar.upgrades[type];
    const cost = getUpgradeCost(type, currentLevel);
    
    // Валидация
    if (currentLevel >= 10) {
        showError('Достигнут максимальный уровень улучшения!');
        return;
    }
    
    if (gameData.money < cost) {
        showError('Недостаточно денег!');
        return;
    }
    
    // Сохраняем старые значения для отката
    const oldMoney = gameData.money;
    const oldSpent = gameData.stats.moneySpent;
    const oldLevel = currentCar.upgrades[type];
    
    // Применяем изменения локально (для UI)
    gameData.money -= cost;
    gameData.stats.moneySpent += cost;
    currentCar.upgrades[type]++;
    
    // Обновляем интерфейс сразу
    updatePlayerInfo();
    updateGarageDisplay();
    
    // Показываем индикатор загрузки
    showLoading(true);
    
    try {
        // Сохраняем на сервер
        await saveGameData(gameData);
        showLoading(false);
        
        console.log('Улучшение успешно сохранено на сервер');
        showError(`${upgradeConfig[type].name} улучшен до уровня ${currentCar.upgrades[type]}!`);
        
        checkUpgradeAchievements();
        
    } catch (error) {
        showLoading(false);
        console.error('Ошибка сохранения улучшения:', error);
        
        // ОТКАТЫВАЕМ изменения при ошибке
        gameData.money = oldMoney;
        gameData.stats.moneySpent = oldSpent;
        currentCar.upgrades[type] = oldLevel;
        
        // Обновляем интерфейс
        updatePlayerInfo();
        updateGarageDisplay();
        
        showError('❌ Ошибка сохранения! Улучшение отменено. Проверьте соединение.');
    }
}

// Покупка специальных деталей (ТОЛЬКО сервер)
async function buySpecialPart(type, cost) {
    const currentCar = gameData.cars[gameData.currentCar];
    
    if (gameData.money < cost) {
        showError('Недостаточно денег!');
        return;
    }
    
    if (currentCar.specialParts[type]) {
        showError('Эта деталь уже установлена!');
        return;
    }
    
    // Сохраняем старые значения для отката
    const oldMoney = gameData.money;
    const oldSpent = gameData.stats.moneySpent;
    const oldPart = currentCar.specialParts[type];
    
    // Применяем изменения локально (для UI)
    gameData.money -= cost;
    gameData.stats.moneySpent += cost;
    currentCar.specialParts[type] = true;
    
    // Обновляем интерфейс сразу
    updatePlayerInfo();
    updateGarageDisplay();
    
    // Показываем индикатор загрузки
    showLoading(true);
    
    try {
        // Сохраняем на сервер
        await saveGameData(gameData);
        showLoading(false);
        
        const partNames = {
            nitro: "Нитро",
            bodyKit: "Спортивный обвес",
            ecuTune: "Чип-тюнинг"
        };
        
        console.log('Специальная деталь успешно сохранена на сервер');
        showError(`${partNames[type]} установлен!`);
        
    } catch (error) {
        showLoading(false);
        console.error('Ошибка сохранения детали:', error);
        
        // ОТКАТЫВАЕМ изменения при ошибке
        gameData.money = oldMoney;
        gameData.stats.moneySpent = oldSpent;
        currentCar.specialParts[type] = oldPart;
        
        // Обновляем интерфейс
        updatePlayerInfo();
        updateGarageDisplay();
        
        showError('❌ Ошибка сохранения! Покупка отменена. Проверьте соединение.');
    }
}

// Получение названия характеристики
function getStatName(stat) {
    const statNames = {
        power: "Мощность",
        speed: "Скорость",
        handling: "Управление",
        acceleration: "Разгон"
    };
    return statNames[stat] || stat;
}

// Проверка достижений за улучшения
function checkUpgradeAchievements() {
    const currentCar = gameData.cars[gameData.currentCar];
    const totalUpgradeLevel = Object.values(currentCar.upgrades).reduce((sum, level) => sum + level, 0);
    
    if (totalUpgradeLevel === 10) {
        showError("🏆 Достижение: Первые улучшения!");
    } else if (totalUpgradeLevel === 25) {
        showError("🏆 Достижение: Серьезный тюнинг!");
    } else if (totalUpgradeLevel === 50) {
        showError("🏆 Достижение: Максимальная прокачка!");
    }
}

// Функции информационной панели игрока
function showPlayerInfoBar() {
    const infoBar = document.getElementById('player-info-bar');
    if (infoBar) {
        infoBar.style.display = 'flex';
        updatePlayerInfoBar();
    }
}

function hidePlayerInfoBar() {
    const infoBar = document.getElementById('player-info-bar');
    if (infoBar) {
        infoBar.style.display = 'none';
    }
}

// Обновление данных в информационной панели (БЕЗ рекурсии)
function updatePlayerInfoBar() {
    // Показываем панель если мы на главном экране и есть данные пользователя
    if (currentScreen === 'main-menu' && currentUser && gameData) {
        const infoBar = document.getElementById('player-info-bar');
        if (infoBar) {
            infoBar.style.display = 'flex';
        }
    }
    
    if (!currentUser || !gameData) return;
    
    // Обновляем имя пользователя
    const usernameEl = document.getElementById('info-username');
    if (usernameEl) {
        usernameEl.textContent = currentUser.username;
    }
    
    // Обновляем уровень
    const levelEl = document.getElementById('info-level');
    if (levelEl) {
        levelEl.textContent = gameData.level;
    }
    
    // Обновляем деньги с анимацией
    const moneyEl = document.getElementById('info-money');
    if (moneyEl) {
        const oldMoney = parseInt(moneyEl.textContent.replace(/,/g, '')) || 0;
        const newMoney = gameData.money;
        
        if (oldMoney !== newMoney) {
            moneyEl.parentElement.classList.add('updating');
            setTimeout(() => {
                moneyEl.parentElement.classList.remove('updating');
            }, 300);
        }
        
        moneyEl.textContent = newMoney.toLocaleString();
    }
    
    // Обновляем топливо (БЕЗ вызова updateFuelInfoBar)
    updateFuelInfoBarDirect();
}

// Прямое обновление топлива БЕЗ рекурсии
function updateFuelInfoBarDirect() {
    if (!gameData.cars || !gameData.cars[gameData.currentCar]) return;
    
    const currentCar = gameData.cars[gameData.currentCar];
    const currentFuel = fuelSystem.getCurrentFuel(currentCar);
    const maxFuel = currentCar.maxFuel || 30;
    
    const fuelEl = document.getElementById('info-fuel');
    const fuelTimerEl = document.getElementById('info-fuel-timer');
    
    if (fuelEl) {
        fuelEl.textContent = `${currentFuel}/${maxFuel}`;
        
        // Меняем цвет в зависимости от количества топлива
        const fuelPercent = currentFuel / maxFuel;
        if (fuelPercent <= 0.2) {
            fuelEl.style.color = 'var(--neon-red)';
        } else if (fuelPercent <= 0.5) {
            fuelEl.style.color = 'var(--neon-orange)';
        } else {
            fuelEl.style.color = 'var(--neon-yellow)';
        }
    }
    
    // Обновляем таймер восстановления топлива
    if (fuelTimerEl && currentFuel < maxFuel) {
        updateFuelTimerMini(currentCar, fuelTimerEl);
    } else if (fuelTimerEl) {
        fuelTimerEl.textContent = '';
    }
}

// Мини-таймер топлива для информационной панели
function updateFuelTimerMini(car, timerElement) {
    const update = () => {
        const now = new Date();
        const lastUpdate = new Date(car.lastFuelUpdate || now);
        const minutesPassed = (now - lastUpdate) / 60000;
        const minutesUntilNextFuel = fuelSystem.regenRate - (minutesPassed % fuelSystem.regenRate);
        
        if (minutesUntilNextFuel > 0) {
            const minutes = Math.floor(minutesUntilNextFuel);
            const seconds = Math.floor((minutesUntilNextFuel - minutes) * 60);
            timerElement.textContent = `(${minutes}:${seconds.toString().padStart(2, '0')})`;
        } else {
            timerElement.textContent = '';
        }
    };
    
    update();
    
    // Обновляем каждую секунду
    if (window.miniTimerInterval) clearInterval(window.miniTimerInterval);
    window.miniTimerInterval = setInterval(update, 1000);
}

// Автоматическое обновление информационной панели (с защитой от переполнения)
function startInfoBarUpdates() {
    // Останавливаем предыдущий интервал если есть
    if (window.infoBarUpdateInterval) {
        clearInterval(window.infoBarUpdateInterval);
    }
    
    window.infoBarUpdateInterval = setInterval(() => {
        if (currentScreen === 'main-menu' && currentUser && gameData) {
            // Обновляем только топливо и таймер, остальное по событиям
            updateFuelInfoBarDirect();
        }
    }, 5000); // Увеличиваем интервал до 5 секунд
}

// Предотвращение обновления страницы при клике на кнопки
document.addEventListener('click', function(e) {
    if (e.target.tagName === 'BUTTON' && !e.target.type) {
        e.preventDefault();
    }
});

function showPlayerInfoBar() {
    const infoBar = document.getElementById('player-info-bar');
    if (infoBar) {
        infoBar.style.display = 'flex';
        updatePlayerInfoBar();
    }
}

// Функция скрытия информационной панели
function hidePlayerInfoBar() {
    const infoBar = document.getElementById('player-info-bar');
    if (infoBar) {
        infoBar.style.display = 'none';
    }
}

// Обновление данных в информационной панели
function updatePlayerInfoBar() {
    // Показываем панель если мы на главном экране и есть данные пользователя
    if (currentScreen === 'main-menu' && currentUser && gameData) {
        const infoBar = document.getElementById('player-info-bar');
        if (infoBar) {
            infoBar.style.display = 'flex';
        }
    }
    
    if (!currentUser || !gameData) return;
    
    // Обновляем имя пользователя
    const usernameEl = document.getElementById('info-username');
    if (usernameEl) {
        usernameEl.textContent = currentUser.username;
    }
    
    // Обновляем уровень
    const levelEl = document.getElementById('info-level');
    if (levelEl) {
        levelEl.textContent = gameData.level;
    }
    
    // Обновляем деньги с анимацией
    const moneyEl = document.getElementById('info-money');
    if (moneyEl) {
        const oldMoney = parseInt(moneyEl.textContent.replace(/,/g, '')) || 0;
        const newMoney = gameData.money;
        
        if (oldMoney !== newMoney) {
            moneyEl.parentElement.classList.add('updating');
            setTimeout(() => {
                moneyEl.parentElement.classList.remove('updating');
            }, 300);
        }
        
        moneyEl.textContent = newMoney.toLocaleString();
    }
    
    // Обновляем топливо
    updateFuelInfoBarDirect();
}

// Обновление информации о топливе в панели
function updateFuelInfoBar() {
    const currentCar = gameData.cars[gameData.currentCar];
    if (!currentCar) return;
    
    const currentFuel = fuelSystem.getCurrentFuel(currentCar);
    const maxFuel = currentCar.maxFuel || 30;
    
    const fuelEl = document.getElementById('info-fuel');
    const fuelTimerEl = document.getElementById('info-fuel-timer');
    
    if (fuelEl) {
        fuelEl.textContent = `${currentFuel}/${maxFuel}`;
        
        // Меняем цвет в зависимости от количества топлива
        const fuelPercent = currentFuel / maxFuel;
        if (fuelPercent <= 0.2) {
            fuelEl.style.color = 'var(--neon-red)';
        } else if (fuelPercent <= 0.5) {
            fuelEl.style.color = 'var(--neon-orange)';
        } else {
            fuelEl.style.color = 'var(--neon-yellow)';
        }
    }
    
    // Обновляем таймер восстановления топлива
    if (fuelTimerEl && currentFuel < maxFuel) {
        updateFuelTimerMini(currentCar, fuelTimerEl);
    } else if (fuelTimerEl) {
        fuelTimerEl.textContent = '';
    }
}

function updateFuelInfoBarDirect() {
    if (!gameData.cars || !gameData.cars[gameData.currentCar]) return;
    
    const currentCar = gameData.cars[gameData.currentCar];
    const currentFuel = fuelSystem.getCurrentFuel(currentCar);
    const maxFuel = currentCar.maxFuel || 30;
    
    const fuelEl = document.getElementById('info-fuel');
    const fuelTimerEl = document.getElementById('info-fuel-timer');
    
    if (fuelEl) {
        fuelEl.textContent = `${currentFuel}/${maxFuel}`;
        
        // Меняем цвет в зависимости от количества топлива
        const fuelPercent = currentFuel / maxFuel;
        if (fuelPercent <= 0.2) {
            fuelEl.style.color = 'var(--neon-red)';
        } else if (fuelPercent <= 0.5) {
            fuelEl.style.color = 'var(--neon-orange)';
        } else {
            fuelEl.style.color = 'var(--neon-yellow)';
        }
    }
    
    // Обновляем таймер восстановления топлива
    if (fuelTimerEl && currentFuel < maxFuel) {
        updateFuelTimerMini(currentCar, fuelTimerEl);
    } else if (fuelTimerEl) {
        fuelTimerEl.textContent = '';
    }
}
// Мини-таймер топлива для информационной панели
function updateFuelTimerMini(car, timerElement) {
    const update = () => {
        const now = new Date();
        const lastUpdate = new Date(car.lastFuelUpdate || now);
        const minutesPassed = (now - lastUpdate) / 60000;
        const minutesUntilNextFuel = fuelSystem.regenRate - (minutesPassed % fuelSystem.regenRate);
        
        if (minutesUntilNextFuel > 0) {
            const minutes = Math.floor(minutesUntilNextFuel);
            const seconds = Math.floor((minutesUntilNextFuel - minutes) * 60);
            timerElement.textContent = `(${minutes}:${seconds.toString().padStart(2, '0')})`;
        } else {
            timerElement.textContent = '';
        }
    };
    
    update();
    
    // Обновляем каждую секунду
    if (window.miniTimerInterval) clearInterval(window.miniTimerInterval);
    window.miniTimerInterval = setInterval(update, 1000);
}
    function startInfoBarUpdates() {
    // Останавливаем предыдущий интервал если есть
    if (window.infoBarUpdateInterval) {
        clearInterval(window.infoBarUpdateInterval);
    }
    
    window.infoBarUpdateInterval = setInterval(() => {
        if (currentScreen === 'main-menu' && currentUser && gameData) {
            // Обновляем только топливо и таймер, остальное по событиям
            updateFuelInfoBarDirect();
        }
    }, 5000); // Увеличиваем интервал до 5 секунд
}async function syncGameData() {
    if (!currentUser) return;
    
    try {
        // Загружаем данные с сервера
        const serverData = await loadGameData();
        console.log('Данные с сервера:', serverData);
        
        // Загружаем локальные данные
        const localData = storage.getItem('carUpgrades');
        
        if (localData) {
            const parsedLocal = JSON.parse(localData);
            console.log('Локальные данные:', parsedLocal);
            
            // Сравниваем времена обновления
            const serverTime = new Date(serverData.gameData.lastUpdate || 0);
            const localTime = new Date(parsedLocal.timestamp || 0);
            
            if (localTime > serverTime) {
                console.log('Локальные данные новее, синхронизируем с сервером');
                
                // Сохраняем на сервер
                await saveGameData(gameData);
                console.log('Локальные изменения синхронизированы с сервером');
            }
        }
        
    } catch (error) {
        console.error('Ошибка синхронизации:', error);
    }
}