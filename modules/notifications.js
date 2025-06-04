// modules/notifications.js
// Улучшенная система уведомлений для мобильных устройств

class NotificationSystem {
    constructor() {
        this.queue = [];
        this.isShowing = false;
        this.currentNotification = null;
        this.maxQueue = 10; // Ограничиваем очередь для мобильных
    }
    
    show(message, type = 'info', duration = 3000) {
        // Ограничиваем длину очереди
        if (this.queue.length >= this.maxQueue) {
            this.queue.shift(); // Удаляем старое уведомление
        }
        
        // Сокращаем длинные сообщения для мобильных
        const truncatedMessage = this.truncateMessage(message);
        
        this.queue.push({ 
            message: truncatedMessage, 
            type, 
            duration: this.adjustDuration(duration, type),
            id: Date.now() + Math.random()
        });
        
        this.processQueue();
    }
    
    // Сокращаем длинные сообщения
    truncateMessage(message) {
        const maxLength = 80; // Оптимально для мобильных
        if (message.length > maxLength) {
            return message.substring(0, maxLength - 3) + '...';
        }
        return message;
    }
    
    // Настраиваем длительность показа
    adjustDuration(duration, type) {
        const baseDuration = {
            'error': 4000,     // Ошибки показываем дольше
            'success': 2500,   // Успех - средне
            'reward': 3500,    // Награды - дольше
            'level': 4000,     // Уровень - дольше
            'skill': 3500,     // Навыки - дольше
            'warning': 3000,   // Предупреждения - средне
            'info': 2000       // Инфо - быстро
        };
        
        return baseDuration[type] || duration;
    }
    
    async processQueue() {
        if (this.isShowing || this.queue.length === 0) return;
        
        this.isShowing = true;
        const notification = this.queue.shift();
        
        // Если уже есть активное уведомление - скрываем его
        if (this.currentNotification) {
            await this.hideNotification(this.currentNotification);
        }
        
        const element = this.createElement(notification);
        this.currentNotification = element;
        document.body.appendChild(element);
        
        // Анимация появления
        await this.animate(element, 'in');
        
        // Ждем
        await new Promise(resolve => setTimeout(resolve, notification.duration));
        
        // Анимация исчезновения
        await this.hideNotification(element);
        
        this.currentNotification = null;
        this.isShowing = false;
        
        // Следующее уведомление
        setTimeout(() => this.processQueue(), 100);
    }
    
    async hideNotification(element) {
        if (!element || !element.parentNode) return;
        
        await this.animate(element, 'out');
        element.remove();
    }
    
    createElement(notification) {
        const div = document.createElement('div');
        div.className = `game-notification ${notification.type}`;
        
        // Добавляем обработчик клика для скрытия
        div.addEventListener('click', () => {
            this.hideNotification(div);
        });
        
        div.innerHTML = `
            <div class="notification-icon">${this.getIcon(notification.type)}</div>
            <div class="notification-message">${notification.message}</div>
            <div class="notification-close">×</div>
        `;
        
        return div;
    }
    
    getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌', 
            warning: '⚠️',
            info: 'ℹ️',
            reward: '💰',
            level: '⭐',
            skill: '⚡',
            fuel: '⛽',
            race: '🏁',
            car: '🚗',
            upgrade: '🔧',
            achievement: '🏆'
        };
        return icons[type] || icons.info;
    }
    
    async animate(element, direction) {
        if (direction === 'in') {
            // Мобильная анимация - снизу вверх
            element.style.transform = 'translateY(100px)';
            element.style.opacity = '0';
            element.style.scale = '0.9';
            
            // Форсируем перерисовку
            element.offsetHeight;
            
            element.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
            element.style.transform = 'translateY(0)';
            element.style.opacity = '1';
            element.style.scale = '1';
        } else {
            element.style.transition = 'all 0.2s ease-in';
            element.style.transform = 'translateY(-20px)';
            element.style.opacity = '0';
            element.style.scale = '0.95';
        }
        
        await new Promise(resolve => setTimeout(resolve, direction === 'in' ? 300 : 200));
    }
    
    // Очистка всех уведомлений
    clear() {
        this.queue = [];
        if (this.currentNotification) {
            this.hideNotification(this.currentNotification);
        }
    }
    
    // Быстрое уведомление для частых действий
    quickNotify(message, type = 'info') {
        this.show(message, type, 1500);
    }
}

export const notifications = new NotificationSystem();

// Глобальные функции
window.notify = (message, type = 'info') => notifications.show(message, type);
window.quickNotify = (message, type = 'info') => notifications.quickNotify(message, type);

// Специальные функции для разных типов уведомлений
window.notifySuccess = (message) => notifications.show(message, 'success');
window.notifyError = (message) => notifications.show(message, 'error');
window.notifyReward = (message) => notifications.show(message, 'reward');
window.notifyLevel = (message) => notifications.show(message, 'level');
window.notifySkill = (message) => notifications.show(message, 'skill');
window.notifyAchievement = (message) => notifications.show(message, 'achievement');