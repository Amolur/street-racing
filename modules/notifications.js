// modules/notifications.js
// Система уведомлений

// Система уведомлений
class NotificationSystem {
    constructor() {
        this.queue = [];
        this.isShowing = false;
    }
    
    show(message, type = 'info', duration = 3000) {
        this.queue.push({ message, type, duration });
        this.processQueue();
    }
    
    async processQueue() {
        if (this.isShowing || this.queue.length === 0) return;
        
        this.isShowing = true;
        const notification = this.queue.shift();
        
        const element = this.createElement(notification);
        document.body.appendChild(element);
        
        // Анимация появления
        await this.animate(element, 'in');
        
        // Ждем
        await new Promise(resolve => setTimeout(resolve, notification.duration));
        
        // Анимация исчезновения
        await this.animate(element, 'out');
        
        element.remove();
        this.isShowing = false;
        
        // Следующее уведомление
        this.processQueue();
    }
    
    createElement(notification) {
        const div = document.createElement('div');
        div.className = `game-notification ${notification.type}`;
        div.innerHTML = `
            <div class="notification-icon">${this.getIcon(notification.type)}</div>
            <div class="notification-message">${notification.message}</div>
        `;
        return div;
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
    
    async animate(element, direction) {
        if (direction === 'in') {
            element.style.transform = 'translateX(100%)';
            element.style.opacity = '0';
            
            // Форсируем перерисовку
            element.offsetHeight;
            
            element.style.transition = 'all 0.3s ease-out';
            element.style.transform = 'translateX(0)';
            element.style.opacity = '1';
        } else {
            element.style.transition = 'all 0.3s ease-in';
            element.style.transform = 'translateX(100%)';
            element.style.opacity = '0';
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
    }
}

export const notifications = new NotificationSystem();

// Глобально
window.notify = (message, type = 'info') => notifications.show(message, type);