// modules/events.js
// Система отображения событий

let currentEvent = null;
let eventCheckInterval = null;

// Проверка текущего события
export async function checkCurrentEvent() {
    try {
        const response = await fetch(`${window.API_URL}/game/current-event`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Ошибка получения события');
        }
        
        const data = await response.json();
        
        if (data.event) {
            currentEvent = data.event;
            updateEventButton(true);
            updateEventDisplay();
        } else {
            currentEvent = null;
            updateEventButton(false);
        }
        
    } catch (error) {
        console.error('Ошибка проверки события:', error);
    }
}

// Обновление кнопки события в главном меню
function updateEventButton(hasEvent) {
    const eventButton = document.getElementById('event-button');
    if (!eventButton) return;
    
    if (hasEvent) {
        eventButton.style.display = 'block';
        eventButton.classList.add('event-active');
        
        // Анимация пульсации для привлечения внимания
        eventButton.classList.add('pulse');
    } else {
        eventButton.style.display = 'none';
        eventButton.classList.remove('event-active', 'pulse');
    }
}

// Обновление отображения события
function updateEventDisplay() {
    const eventScreen = document.getElementById('event-screen');
    if (!eventScreen || !currentEvent) return;
    
    const eventContent = document.getElementById('event-content');
    if (!eventContent) return;
    
    eventContent.innerHTML = `
        <div class="event-card active">
            <div class="event-icon">${currentEvent.icon}</div>
            <h2 class="event-title">${currentEvent.title}</h2>
            <p class="event-description">${currentEvent.description}</p>
            
            <div class="event-timer">
                <span class="timer-label">Осталось времени:</span>
                <span class="timer-value" id="event-timer">
                    ${currentEvent.timeLeft.hours}ч ${currentEvent.timeLeft.minutes}м
                </span>
            </div>
            
            <div class="event-effects">
                ${getEventEffectsHTML(currentEvent.type)}
            </div>
            
            <button class="action-button" onclick="goBack()">
                Отлично!
            </button>
        </div>
    `;
}

// Получить HTML эффектов события
function getEventEffectsHTML(eventType) {
    switch (eventType) {
        case 'double_rewards':
            return `
                <div class="effect-item">
                    <span class="effect-icon">💰</span>
                    <span class="effect-text">x2 награды за победы</span>
                </div>
            `;
        case 'upgrade_discount':
            return `
                <div class="effect-item">
                    <span class="effect-icon">🔧</span>
                    <span class="effect-text">-50% на все улучшения</span>
                </div>
            `;
        case 'free_fuel':
            return `
                <div class="effect-item">
                    <span class="effect-icon">⛽</span>
                    <span class="effect-text">Гонки без расхода топлива</span>
                </div>
            `;
        case 'bonus_xp':
            return `
                <div class="effect-item">
                    <span class="effect-icon">⭐</span>
                    <span class="effect-text">x2 опыта за все гонки</span>
                </div>
            `;
        default:
            return '';
    }
}

// Показать экран события
export function showEventScreen() {
    if (!currentEvent) {
        window.notify('Нет активных событий', 'info');
        return;
    }
    
    const eventScreen = document.getElementById('event-screen');
    if (eventScreen) {
        document.querySelectorAll('.mobile-screen').forEach(screen => {
            screen.classList.remove('active');
        });
        eventScreen.classList.add('active');
        updateEventDisplay();
    }
}

// Запуск проверки событий
export function startEventChecking() {
    // Проверяем сразу
    checkCurrentEvent();
    
    // Проверяем каждые 30 секунд
    eventCheckInterval = setInterval(() => {
        checkCurrentEvent();
    }, 30000);
}

// Остановка проверки событий
export function stopEventChecking() {
    if (eventCheckInterval) {
        clearInterval(eventCheckInterval);
        eventCheckInterval = null;
    }
}

// Получить текущее событие
export function getCurrentEvent() {
    return currentEvent;
}

// Экспорт для глобального использования
window.checkCurrentEvent = checkCurrentEvent;
window.showEventScreen = showEventScreen;
window.getCurrentEvent = getCurrentEvent;