// modules/chat.js
// Чат и новости

let chatMessages = [];
let newsItems = [];

// Заглушки для чата
const mockChatMessages = [
    {
        id: 1,
        username: "Гонщик123",
        message: "Кто-нибудь хочет погонять?",
        timestamp: new Date(Date.now() - 300000).toISOString(),
        level: 15
    },
    {
        id: 2,
        username: "Скорость",
        message: "Только что купил новую Тойоту!",
        timestamp: new Date(Date.now() - 180000).toISOString(),
        level: 8
    },
    {
        id: 3,
        username: "МастерДрифт",
        message: "Где лучше всего прокачивать навыки?",
        timestamp: new Date(Date.now() - 120000).toISOString(),
        level: 22
    }
];

// Заглушки для новостей
const mockNews = [
    {
        id: 1,
        title: "Обновление игры v2.1",
        content: "Добавлены новые машины и улучшения в систему гонок",
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        author: "Разработчики"
    },
    {
        id: 2,
        title: "Турнир выходного дня",
        content: "Участвуйте в турнире и выигрывайте призы!",
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        author: "Администрация"
    },
    {
        id: 3,
        title: "Новые достижения",
        content: "Разблокированы новые достижения для опытных гонщиков",
        timestamp: new Date(Date.now() - 259200000).toISOString(),
        author: "Разработчики"
    }
];

// Инициализация чата
export function initChat() {
    loadChatMessages();
    loadNews();
    
    // Обновляем чат каждые 30 секунд (в реальной игре)
    setInterval(loadChatMessages, 30000);
    
    // Обновляем новости каждые 5 минут
    setInterval(loadNews, 300000);
}

// Загрузка сообщений чата
async function loadChatMessages() {
    try {
        // В реальной версии здесь будет запрос к серверу
        // const response = await fetch('/api/chat/messages');
        // chatMessages = await response.json();
        
        // Пока используем заглушки
        chatMessages = [...mockChatMessages];
        updateChatDisplay();
    } catch (error) {
        console.error('Ошибка загрузки чата:', error);
        
        // Используем заглушки при ошибке
        chatMessages = [...mockChatMessages];
        updateChatDisplay();
        
        window.notifyError('💬 Не удалось загрузить чат');
    }
}

// Обновление отображения чата
function updateChatDisplay() {
    const chatContainer = document.getElementById('chat-messages');
    if (!chatContainer) return;
    
    const messagesHTML = chatMessages
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 50) // Последние 50 сообщений
        .map(message => createChatMessageElement(message))
        .join('');
    
    chatContainer.innerHTML = messagesHTML || '<p class="no-data">Сообщений пока нет</p>';
    
    // Прокручиваем к последнему сообщению
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Создание элемента сообщения
function createChatMessageElement(message) {
    const timeAgo = formatTimeAgo(new Date(message.timestamp));
    const levelColor = getLevelColor(message.level);
    
    return `
        <div class="chat-message">
            <div class="message-header">
                <span class="username" style="color: ${levelColor}">
                    ${message.username}
                    <span class="user-level">Lv.${message.level}</span>
                </span>
                <span class="timestamp">${timeAgo}</span>
            </div>
            <div class="message-content">${escapeHtml(message.message)}</div>
        </div>
    `;
}

// Отправка сообщения
export async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    if (!input || !input.value.trim()) return;
    
    const message = input.value.trim();
    
    try {
        // В реальной версии отправляем на сервер
        // await fetch('/api/chat/send', {
        //     method: 'POST',
        //     body: JSON.stringify({ message })
        // });
        
        // Добавляем сообщение локально (заглушка)
        const newMessage = {
            id: Date.now(),
            username: "Вы", // В реальной версии из данных пользователя
            message: message,
            timestamp: new Date().toISOString(),
            level: 1 // В реальной версии из данных пользователя
        };
        
        chatMessages.unshift(newMessage);
        updateChatDisplay();
        
        input.value = '';
    } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
        window.notifyError(`💬 ${error.message}`);
    }
}

// Загрузка новостей
async function loadNews() {
    try {
        // В реальной версии здесь будет запрос к серверу
        // const response = await fetch('/api/news');
        // newsItems = await response.json();
        
        // Пока используем заглушки
        newsItems = [...mockNews];
        updateNewsDisplay();
    } catch (error) {
        console.error('Ошибка загрузки новостей:', error);
        
        // Используем заглушки при ошибке
        newsItems = [...mockNews];
        updateNewsDisplay();
        
        window.notifyError('📰 Не удалось загрузить новости');
    }
}

// Обновление отображения новостей
function updateNewsDisplay() {
    const newsContainer = document.getElementById('news-list');
    if (!newsContainer) return;
    
    const newsHTML = newsItems
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .map(item => createNewsItemElement(item))
        .join('');
    
    newsContainer.innerHTML = newsHTML || '<p class="no-data">Новостей пока нет</p>';
}

// Создание элемента новости
function createNewsItemElement(item) {
    const timeAgo = formatTimeAgo(new Date(item.timestamp));
    
    return `
        <div class="news-item card">
            <div class="card-header">
                <h3 class="card-title">${escapeHtml(item.title)}</h3>
                <span class="news-time">${timeAgo}</span>
            </div>
            <div class="card-body">
                <p class="news-content">${escapeHtml(item.content)}</p>
                <p class="news-author">— ${escapeHtml(item.author)}</p>
            </div>
        </div>
    `;
}

// Переключение вкладок чата
export function showChatTab(tab) {
    // Убираем активные классы
    document.querySelectorAll('#community-screen .tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('#community-screen .tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    if (tab === 'chat') {
        const chatButton = document.querySelector('#community-screen .tab-button:first-child');
        const chatContent = document.getElementById('community-chat');
        
        if (chatButton) chatButton.classList.add('active');
        if (chatContent) chatContent.classList.add('active');
        
        loadChatMessages();
    } else if (tab === 'news') {
        const newsButton = document.querySelector('#community-screen .tab-button:last-child');
        const newsContent = document.getElementById('community-news');
        
        if (newsButton) newsButton.classList.add('active');
        if (newsContent) newsContent.classList.add('active');
        
        loadNews();
    }
}

// Вспомогательные функции
function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return 'только что';
    if (diffMinutes < 60) return `${diffMinutes}м назад`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}ч назад`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}д назад`;
    
    return date.toLocaleDateString();
}

function getLevelColor(level) {
    if (level < 5) return '#cccccc';
    if (level < 10) return '#33aa33';
    if (level < 20) return '#4488ff';
    if (level < 30) return '#ffa500';
    return '#ff4444';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Обработка Enter в поле ввода
document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
            }
        });
    }
});

// Экспорт функций для глобального доступа
window.sendChatMessage = sendChatMessage;
window.showChatTab = showChatTab;
window.initChat = initChat;