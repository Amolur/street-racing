// modules/notifications.js
// Новая компактная система уведомлений

class NotificationSystem {
    constructor() {
        this.container = null;
        this.queue = [];
        this.activeNotifications = [];
        this.maxVisible = 3;
    }
    
    init() {
        this.container = document.getElementById('notifications-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'notifications-container';
            this.container.id = 'notifications-container';
            document.body.appendChild(this.container);
        }
    }
    
    show(message, type = 'info', duration = 3000) {
        if (!this.container) this.init();
        
        // Добавляем в очередь
        this.queue.push({ message, type, duration });
        this.processQueue();
    }
    
    processQueue() {
        // Удаляем завершенные уведомления
        this.activeNotifications = this.activeNotifications.filter(n => n.active);
        
        // Если достигнут лимит видимых уведомлений, ждем
        if (this.activeNotifications.length >= this.maxVisible || this.queue.length === 0) {
            return;
        }
        
        const notification = this.queue.shift();
        this.createNotification(notification);
        
        // Обрабатываем следующее уведомление
        if (this.queue.length > 0) {
            setTimeout(() => this.processQueue(), 100);
        }
    }
    
    createNotification(notification) {
        const element = document.createElement('div');
        element.className = `notification-item ${notification.type}`;
        
        const icon = this.getIcon(notification.type);
        
        element.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-text">${notification.message}</div>
        `;
        
        // Добавляем в контейнер
        this.container.appendChild(element);
        
        // Трекаем уведомление
        const notificationData = {
            element,
            active: true
        };
        this.activeNotifications.push(notificationData);
        
        // Анимация появления
        requestAnimationFrame(() => {
            element.classList.add('show');
        });
        
        // Автоматическое скрытие
        setTimeout(() => {
            this.hideNotification(notificationData);
        }, notification.duration);
    }
    
    hideNotification(notificationData) {
        if (!notificationData.active) return;
        
        notificationData.active = false;
        notificationData.element.classList.add('hide');
        
        setTimeout(() => {
            if (notificationData.element.parentNode) {
                notificationData.element.remove();
            }
            // Обрабатываем очередь после удаления
            this.processQueue();
        }, 300);
    }
    
    getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            reward: '🎁',
            level: '⭐',
            skill: '⚡'
        };
        return icons[type] || icons.info;
    }
}

// Создаем экземпляр
export const notifications = new NotificationSystem();

// Глобальная функция для совместимости
window.notify = (message, type = 'info', duration = 3000) => {
    notifications.show(message, type, duration);
};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    notifications.init();
});