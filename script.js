// Игровые данные
let gameData = {
    money: 4800,
    level: 1,
    currentCar: 0,
    fuel: 20,
    races: 5,
    racesMax: 5,
    repair: 100,
    skills: {
        driving: 1,
        speed: 0,
        reaction: 0,
        technique: 0
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
            name: "ВАЗ 2102",
            power: 58,
            speed: 137,
            handling: 25,
            acceleration: 1010,
            price: 0,
            owned: true
        }
    ]
};

// Текущий пользователь
let currentUser = null;

// Список всех доступных машин в игре
const allCars = [
    { id: 0, name: "ВАЗ 2102", power: 58, speed: 137, handling: 25, acceleration: 1010, price: 0 },
    { id: 1, name: "ВАЗ 2106", power: 75, speed: 145, handling: 30, acceleration: 950, price: 5000 },
    { id: 2, name: "ВАЗ 2107", power: 77, speed: 150, handling: 35, acceleration: 920, price: 8000 },
    { id: 3, name: "BMW 325i", power: 170, speed: 220, handling: 80, acceleration: 700, price: 25000 },
    { id: 4, name: "Nissan Skyline", power: 280, speed: 250, handling: 85, acceleration: 550, price: 50000 },
    { id: 5, name: "Toyota Supra", power: 320, speed: 270, handling: 90, acceleration: 450, price: 75000 }
];

// Список возможных соперников
const opponents = [
    { name: "Новичок Вася", car: "ВАЗ 2106", difficulty: 0.8, reward: 200 },
    { name: "Местный Игорь", car: "ВАЗ 2107", difficulty: 1.0, reward: 500 },
    { name: "Профи Макс", car: "BMW E30", difficulty: 1.3, reward: 1000 },
    { name: "Легенда Федя", car: "Nissan 200SX", difficulty: 1.6, reward: 2000 }
];

// Функции авторизации
async function register(username, password) {
    try {
        const data = await registerAPI(username, password);
        currentUser = { username: data.user.username };
        gameData = data.user.gameData || gameData;
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
        gameData = data.user.gameData || gameData;
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
        gameData = data.gameData || gameData;
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

// Функция переключения сайдбара (для мобильных)
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('active');
}

// Функция скрытия всех экранов
function hideAllScreens() {
    document.querySelectorAll('.game-screen').forEach(screen => {
        screen.classList.remove('active');
    });
}

// Функции навигации
function showMainMenu() {
    hideAllScreens();
    document.getElementById('main-menu').classList.add('active');
    updateMainMenuDisplay();
}

function showRaceMenu() {
    hideAllScreens();
    document.getElementById('race-menu-screen').classList.add('active');
    displayOpponents();
    updateMenuActive('race-menu');
}

function showGarageScreen() {
    hideAllScreens();
    document.getElementById('garage-screen').classList.add('active');
    updateGarageDisplay();
    updateMenuActive('garage');
}

function showShopScreen() {
    hideAllScreens();
    document.getElementById('shop-screen').classList.add('active');
    updateShopDisplay();
    updateMenuActive('shop');
}

function showRaceResultScreen() {
    hideAllScreens();
    document.getElementById('race-result-screen').classList.add('active');
}

// Обновление активного пункта меню
function updateMenuActive(menuId) {
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    // Здесь можно добавить логику для выделения активного пункта
}

// Обновление главного меню
function updateMainMenuDisplay() {
    const currentCar = gameData.cars[gameData.currentCar];
    if (currentCar) {
        document.getElementById('current-car-name').textContent = currentCar.name;
    }
}

// Обновление отображения гаража
function updateGarageDisplay() {
    const garageContent = document.getElementById('garage-content');
    const currentCar = gameData.cars[gameData.currentCar];
    
    if (garageContent && currentCar) {
        garageContent.innerHTML = `
            <div class="car-display-main">
                <div class="car-emoji-large">🚗</div>
                <h3>${currentCar.name}</h3>
                <div class="car-stats-main">
                    <div class="car-stat-main">
                        <div class="car-stat-value">${currentCar.power}</div>
                        <div class="car-stat-label">л.с.</div>
                    </div>
                    <div class="car-stat-main">
                        <div class="car-stat-value">${currentCar.speed}</div>
                        <div class="car-stat-label">км/ч</div>
                    </div>
                    <div class="car-stat-main">
                        <div class="car-stat-value">${currentCar.handling}</div>
                        <div class="car-stat-label">управление</div>
                    </div>
                    <div class="car-stat-main">
                        <div class="car-stat-value">${currentCar.acceleration}</div>
                        <div class="car-stat-label">разгон</div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Обновление магазина
function updateShopDisplay() {
    const shopContent = document.getElementById('shop-content');
    if (shopContent) {
        shopContent.innerHTML = '<p>Магазин временно закрыт</p>';
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
        
        const opponentDiv = document.createElement('div');
        opponentDiv.className = 'opponent-item';
        opponentDiv.style.padding = '1rem';
        opponentDiv.style.background = 'var(--bg-tertiary)';
        opponentDiv.style.marginBottom = '1rem';
        opponentDiv.style.cursor = canAfford ? 'pointer' : 'not-allowed';
        opponentDiv.style.opacity = canAfford ? '1' : '0.5';
        
        opponentDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${opponent.name}</strong><br>
                    <small>Машина: ${opponent.car}</small><br>
                    <small>Ставка: $${betAmount} / Выигрыш: $${opponent.reward}</small>
                </div>
                <button onclick="showRacePreview(${index})" ${!canAfford ? 'disabled' : ''} 
                        style="padding: 0.5rem 1rem; background: var(--accent-blue); color: white; border: none; cursor: pointer;">
                    Вызвать
                </button>
            </div>
        `;
        
        opponentsList.appendChild(opponentDiv);
    });
}

// Показать превью гонки
function showRacePreview(opponentIndex) {
    const opponent = opponents[opponentIndex];
    const currentCar = gameData.cars[gameData.currentCar];
    const betAmount = opponent.reward / 2;
    
    // Генерируем характеристики соперника
    const opponentStats = {
        power: Math.floor(50 + opponent.difficulty * 30),
        speed: Math.floor(140 + opponent.difficulty * 50),
        handling: Math.floor(25 + opponent.difficulty * 20),
        acceleration: Math.floor(1000 - opponent.difficulty * 200)
    };
    
    const opponentSkills = {
        driving: Math.floor(opponent.difficulty * 5),
        speed: Math.floor(opponent.difficulty * 3),
        reaction: Math.floor(opponent.difficulty * 2),
        technique: Math.floor(opponent.difficulty * 2)
    };
    
    const modal = document.createElement('div');
    modal.className = 'race-preview-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.right = '0';
    modal.style.bottom = '0';
    modal.style.background = 'rgba(0,0,0,0.9)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '1000';
    
    modal.innerHTML = `
        <div class="race-preview-simple" style="background: var(--bg-secondary); padding: 2rem; max-width: 800px; width: 90%;">
            <div class="race-title">Трасса</div>
            <div class="race-vs-title">${currentUser.username} vs ${opponent.name}</div>
            
            <div class="racers-comparison">
                <div class="racer-info">
                    <div class="racer-photo">
                        <img src="https://ui-avatars.com/api/?name=${currentUser.username}&background=4169E1&color=fff&size=150" 
                             alt="Player" style="width: 100%; height: 100%;">
                    </div>
                    <div class="racer-stats">
                        <div class="stat-line">
                            <span class="stat-number">${gameData.skills.driving}</span>
                            <span class="stat-icon-small">💪</span>
                        </div>
                        <div class="stat-line">
                            <span class="stat-number">${gameData.skills.speed}</span>
                            <span class="stat-icon-small">⚡</span>
                        </div>
                        <div class="stat-line">
                            <span class="stat-number">${gameData.skills.reaction}</span>
                            <span class="stat-icon-small">🚌</span>
                        </div>
                        <div class="stat-line">
                            <span class="stat-number">${gameData.skills.technique}</span>
                            <span class="stat-icon-small">👤</span>
                        </div>
                    </div>
                </div>
                
                <div class="racer-info">
                    <div class="racer-photo">
                        <img src="https://ui-avatars.com/api/?name=${opponent.name}&background=FF4444&color=fff&size=150" 
                             alt="Opponent" style="width: 100%; height: 100%;">
                    </div>
                    <div class="racer-stats">
                        <div class="stat-line">
                            <span class="stat-icon-small">💪</span>
                            <span class="stat-number">${opponentSkills.driving}</span>
                        </div>
                        <div class="stat-line">
                            <span class="stat-icon-small">⚡</span>
                            <span class="stat-number">${opponentSkills.speed}</span>
                        </div>
                        <div class="stat-line">
                            <span class="stat-icon-small">🚌</span>
                            <span class="stat-number">${opponentSkills.reaction}</span>
                        </div>
                        <div class="stat-line">
                            <span class="stat-icon-small">👤</span>
                            <span class="stat-number">${opponentSkills.technique}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="cars-comparison">
                <div class="car-info">
                    <div class="car-image">🚗</div>
                    <div class="car-name">${currentCar.name}</div>
                    <div class="car-params">
                        <div class="car-param">
                            <span>${currentCar.power}</span>
                            <span>⚙️</span>
                        </div>
                        <div class="car-param">
                            <span>${currentCar.speed}</span>
                            <span>💨</span>
                        </div>
                        <div class="car-param">
                            <span>${currentCar.handling}</span>
                            <span>🎮</span>
                        </div>
                        <div class="car-param">
                            <span>${currentCar.acceleration}</span>
                            <span>🚀</span>
                        </div>
                    </div>
                </div>
                
                <div class="car-info">
                    <div class="car-image">🏎️</div>
                    <div class="car-name">${opponent.car}</div>
                    <div class="car-params">
                        <div class="car-param">
                            <span>${opponentStats.power}</span>
                            <span>⚙️</span>
                        </div>
                        <div class="car-param">
                            <span>${opponentStats.speed}</span>
                            <span>💨</span>
                        </div>
                        <div class="car-param">
                            <span>${opponentStats.handling}</span>
                            <span>🎮</span>
                        </div>
                        <div class="car-param">
                            <span>${opponentStats.acceleration}</span>
                            <span>🚀</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <button class="race-bet-button" onclick="confirmRace(${opponentIndex})">
                Гоняться на $${betAmount}
            </button>
            
            <a href="#" class="find-another" onclick="closeRacePreview()">Искать другого</a>
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
    startRace(opponentIndex);
}

// Старт гонки
async function startRace(opponentIndex) {
    const opponent = opponents[opponentIndex];
    const currentCar = gameData.cars[gameData.currentCar];
    const betAmount = opponent.reward / 2;
    
    if (gameData.money < betAmount) {
        alert(`Недостаточно денег! Нужно $${betAmount}`);
        return;
    }
    
    // Простой расчет результата
    const playerPower = currentCar.power + currentCar.speed + (100 - currentCar.acceleration/10) + currentCar.handling;
    const playerSkillBonus = (gameData.skills.driving + gameData.skills.speed + gameData.skills.reaction + gameData.skills.technique) * 5;
    const playerTotal = playerPower + playerSkillBonus + Math.random() * 50;
    
    const opponentPower = 200 * opponent.difficulty;
    const opponentTotal = opponentPower + Math.random() * 50;
    
    const won = playerTotal > opponentTotal;
    
    // Расчет времени
    const playerTime = 26 + Math.random() * 2 - (playerTotal / 100);
    const opponentTime = 26 + Math.random() * 2 - (opponentTotal / 100);
    
    // Обновляем статистику
    gameData.stats.totalRaces++;
    gameData.races--;
    
    if (won) {
        gameData.stats.wins++;
        gameData.stats.moneyEarned += opponent.reward;
        gameData.money += opponent.reward;
    } else {
        gameData.stats.losses++;
        gameData.stats.moneySpent += betAmount;
        gameData.money -= betAmount;
    }
    
    showRaceResultScreen();
    
    const resultDiv = document.getElementById('race-result');
    resultDiv.innerHTML = `
        <div class="result-image">
            <img src="https://via.placeholder.com/300x200/333/fff?text=${won ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ'}" 
                 alt="Result" style="width: 100%; height: 100%;">
        </div>
        
        <div class="result-message ${won ? 'result-win' : 'result-lose'}">
            ${won ? `Ты пришел к финишу первым! Твой выигрыш - $${opponent.reward}!` : `${opponent.name} оказался быстрее!`}
        </div>
        
        <div class="result-times">
            <div class="time-info">Время ${currentUser.username}: ${playerTime.toFixed(2)}сек.</div>
            <div class="time-info">Время ${opponent.name}: ${opponentTime.toFixed(2)}сек.</div>
        </div>
        
        <div class="result-buttons">
            <a href="#" onclick="showRaceMenu()">Искать другого</a>
            <a href="#" onclick="showMainMenu()">Характеристики соперников</a>
            <a href="#" onclick="showRaceMenu()">Трасса</a>
        </div>
    `;
    
    updatePlayerInfo();
    await autoSave();
}

// Обновление информации игрока
function updatePlayerInfo() {
    // Обновляем деньги
    const moneyElements = document.querySelectorAll('#money');
    moneyElements.forEach(el => el.textContent = gameData.money);
    
    // Обновляем статистику
    document.getElementById('wins').textContent = gameData.stats.wins;
    document.getElementById('losses').textContent = gameData.stats.losses;
    document.getElementById('fuel').textContent = gameData.fuel;
    document.getElementById('races').textContent = `${gameData.races}/${gameData.racesMax}`;
    document.getElementById('repair').textContent = gameData.repair;
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
    document.querySelector('.game-container').style.display = 'flex';
    
    // Обновляем имя пользователя
    const usernameElement = document.getElementById('username');
    if (usernameElement && currentUser) {
        usernameElement.textContent = currentUser.username;
    }
    
    updatePlayerInfo();
    showMainMenu();
}

// Инициализация игры
window.onload = async function() {
    // Скрываем экран загрузки
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }, 1000);
    
    // Проверяем авторизацию
    if (await checkAuth()) {
        showGame();
    } else {
        showAuthScreen();
    }
};