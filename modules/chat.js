// modules/chat.js
// Функционал чата и новостей

import { gameState } from './game-data.js';
import { showError, storage } from './utils.js';

// Получаем API URL и токен
const API_URL = window.API_URL || 'https://street-racing-backend-wnse.onrender.com/api';
const getAuthToken = () => storage.getItem('authToken');

// Состояние чата
let chatMessages = [];
let newsItems = [];
let chatUpdateInterval = null;
let isLoadingMessages = false;
let oldestMessageTime = null;

// Загрузка сообщений чата
export async function loadChatMessages(before = null) {
    if (isLoadingMessages) return;
    
    try {
        isLoadingMessages = true;
        
        let url = `${API_URL}/chat/messages?limit=50`;
        if (before) {
            url += `&before=${before}`;
        }
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Ошибка загрузки сообщений');
        }
        
        const data = await response.json();
        
        if (before) {
            // Добавляем старые сообщения в начало
            chatMessages = [...data.messages, ...chatMessages];
        } else {
            chatMessages = data.messages;
        }
        
        if (data.messages.length > 0) {
            oldestMessageTime = data.messages[0].timestamp;
        }
        
        updateChatDisplay();
        
    } catch (error) {
        console.error('Ошибка загрузки чата:', error);
        if (!before) {
            showError('Не удалось загрузить чат');
        }
    } finally {
        isLoadingMessages = false;
    }
}

// Отправка сообщения
export async function sendChatMessage(message) {
    if (!message || message.trim().length === 0) {
        showError('Введите сообщение');
        return;
    }
    
    if (message.length > 500) {
        showError('Сообщение слишком длинное (максимум 500 символов)');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/chat/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({ message: message.trim() })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Ошибка отправки');
        }
        
        // Добавляем сообщение в локальный массив
        chatMessages.push(data.message);
        updateChatDisplay();
        
        // Очищаем поле ввода
        const input = document.getElementById('chat-input');
        if (input) {
            input.value = '';
        }
        
        // Прокручиваем вниз
        scrollChatToBottom();
        
    } catch (error) {
        showError(error.message);
    }
}

// Обновление отображения чата
function updateChatDisplay() {
    const chatContainer = document.getElementById('chat-messages');
    if (!chatContainer) return;
    
    const messagesHTML = chatMessages.map(msg => {
        const date = new Date(msg.timestamp);
        const time = date.toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const isOwnMessage = msg.userId === gameState.currentUserId;
        
        return `
            <div class="chat-message ${isOwnMessage ? 'own-message' : ''}">
                <div class="message-header">
                    <span class="message-author">
                        ${msg.username} 
                        <span class="user-level">[${msg.userLevel}]</span>
                    </span>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-content">${escapeHtml(msg.message)}</div>
            </div>
        `;
    }).join('');
    
    chatContainer.innerHTML = messagesHTML || '<p class="no-messages">Нет сообщений</p>';
}

// Загрузка новостей
export async function loadNews(category = 'all') {
    try {
        const authToken = getAuthToken();
        let headers = {};
        
        // Новости могут быть доступны и без авторизации
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        const response = await fetch(`${API_URL}/chat/news?category=${category}`, {
            headers: headers
        });
        
        if (!response.ok) {
            throw new Error('Ошибка загрузки новостей');
        }
        
        const data = await response.json();
        newsItems = data.news;
        
        updateNewsDisplay();
        
    } catch (error) {
        console.error('Ошибка загрузки новостей:', error);
        showError('Не удалось загрузить новости');
    }
}

// Обновление отображения новостей
function updateNewsDisplay() {
    const newsContainer = document.getElementById('news-list');
    if (!newsContainer) return;
    
    if (newsItems.length === 0) {
        newsContainer.innerHTML = '<p class="no-news">Нет новостей</p>';
        return;
    }
    
    const newsHTML = newsItems.map(news => {
        const date = new Date(news.createdAt);
        const dateStr = date.toLocaleDateString('ru-RU');
        
        const categoryColors = {
            update: 'update',
            event: 'event', 
            maintenance: 'maintenance',
            general: 'general'
        };
        
        const categoryNames = {
            update: 'Обновление',
            event: 'Событие',
            maintenance: 'Тех. работы',
            general: 'Новость'
        };
        
        return `
            <div class="news-item">
                <div class="news-header">
                    <span class="news-category ${categoryColors[news.category]}">
                        ${categoryNames[news.category]}
                    </span>
                    <span class="news-date">${dateStr}</span>
                </div>
                <h3 class="news-title">${escapeHtml(news.title)}</h3>
                <div class="news-content">${escapeHtml(news.content)}</div>
                <div class="news-author">— ${news.author}</div>
            </div>
        `;
    }).join('');
    
    newsContainer.innerHTML = newsHTML;
}

// Запуск автообновления чата
export function startChatUpdates() {
    if (chatUpdateInterval) {
        clearInterval(chatUpdateInterval);
    }
    
    // Обновляем каждые 5 секунд
    chatUpdateInterval = setInterval(() => {
        loadChatMessages();
    }, 5000);
}

// Остановка автообновления
export function stopChatUpdates() {
    if (chatUpdateInterval) {
        clearInterval(chatUpdateInterval);
        chatUpdateInterval = null;
    }
}

// Прокрутка чата вниз
function scrollChatToBottom() {
    const chatContainer = document.getElementById('chat-messages');
    if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

// Проверка прокрутки для загрузки старых сообщений
export function checkChatScroll() {
    const chatContainer = document.getElementById('chat-messages');
    if (!chatContainer) return;
    
    if (chatContainer.scrollTop === 0 && oldestMessageTime && !isLoadingMessages) {
        loadChatMessages(oldestMessageTime);
    }
}

// Экранирование HTML
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Обработчик отправки сообщения
export function handleChatSubmit() {
    const input = document.getElementById('chat-input');
    if (input && input.value.trim()) {
        sendChatMessage(input.value);
    }
}

// Переключение категорий новостей
export function switchNewsCategory(category) {
    // Обновляем активную кнопку
    document.querySelectorAll('.news-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`[data-category="${category}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Загружаем новости выбранной категории
    loadNews(category);
}

// Экспорт функций
window.loadChatMessages = loadChatMessages;
window.sendChatMessage = sendChatMessage;
window.handleChatSubmit = handleChatSubmit;
window.startChatUpdates = startChatUpdates;
window.stopChatUpdates = stopChatUpdates;
window.checkChatScroll = checkChatScroll;
window.loadNews = loadNews;
window.switchNewsCategory = switchNewsCategory;