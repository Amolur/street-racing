// gameCore.js - Основные системы игры для production

(function() {
    'use strict';
    
    // Event Bus для коммуникации между модулями
    class EventBus {
        constructor() {
            this.events = {};
            this.debug = false; // Отключаем debug в production
        }
        
        on(event, callback) {
            if (!this.events[event]) {
                this.events[event] = [];
            }
            this.events[event].push(callback);
            
            return () => {
                this.events[event] = this.events[event].filter(cb => cb !== callback);
            };
        }
        
        emit(event, data) {
            if (this.debug) {
                console.log(`[EventBus] ${event}`, data);
            }
            
            if (!this.events[event]) return;
            this.events[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Ошибка в обработчике события ${event}:`, error);
                }
            });
        }
        
        once(event, callback) {
            const unsubscribe = this.on(event, (data) => {
                callback(data);
                unsubscribe();
            });
        }
    }
    
    // Game Store для централизованного управления состоянием
    class GameStore {
        constructor(initialState = {}) {
            this.state = { ...initialState };
            this.listeners = new Map();
            this.history = [];
            this.maxHistory = 10;
        }
        
        subscribe(fields, callback) {
            const id = Symbol();
            this.listeners.set(id, { fields, callback });
            
            return () => {
                this.listeners.delete(id);
            };
        }
        
        setState(updates, skipValidation = false) {
            const oldState = { ...this.state };
            
            // Сохраняем историю
            this.history.push(oldState);
            if (this.history.length > this.maxHistory) {
                this.history.shift();
            }
            
            // Применяем обновления
            Object.keys(updates).forEach(key => {
                this.state[key] = updates[key];
            });
            
            // Синхронизируем с глобальной переменной gameData
            if (window.gameData) {
                Object.assign(window.gameData, this.state);
            }
            
            // Уведомляем подписчиков
            this.notify(updates);
        }
        
        notify(updates) {
            const changedFields = Object.keys(updates);
            
            this.listeners.forEach(({ fields, callback }) => {
                const hasChanges = fields.some(field => changedFields.includes(field));
                if (hasChanges) {
                    callback(this.state, updates);
                }
            });
        }
        
        getState() {
            return { ...this.state };
        }
        
        undo() {
            if (this.history.length === 0) return false;
            
            const previousState = this.history.pop();
            this.state = previousState;
            
            // Синхронизируем с gameData
            if (window.gameData) {
                Object.assign(window.gameData, previousState);
            }
            
            this.notify(previousState);
            return true;
        }
    }
    
    // Утилиты для безопасной работы с DOM
    const DOM = {
        updateText(selector, text) {
            const elements = selector.startsWith('#') 
                ? [document.querySelector(selector)]
                : document.querySelectorAll(selector);
                
            elements.forEach(el => {
                if (el) el.textContent = text;
            });
        },
        
        updateHTML(selector, html) {
            const element = document.querySelector(selector);
            if (element) element.innerHTML = html;
        },
        
        createElement(html) {
            const template = document.createElement('template');
            template.innerHTML = html.trim();
            return template.content.firstChild;
        },
        
        batchUpdate(updates) {
            const fragment = document.createDocumentFragment();
            updates.forEach(update => {
                if (update.action === 'append') {
                    fragment.appendChild(update.element);
                }
            });
            return fragment;
        }
    };
    
    // Менеджер анимаций
    class AnimationManager {
        constructor() {
            this.animations = new Map();
            this.running = false;
        }
        
        add(id, animation) {
            this.animations.set(id, animation);
            if (!this.running) {
                this.start();
            }
        }
        
        remove(id) {
            this.animations.delete(id);
            if (this.animations.size === 0) {
                this.stop();
            }
        }
        
        start() {
            this.running = true;
            this.animate();
        }
        
        stop() {
            this.running = false;
        }
        
        animate() {
            if (!this.running) return;
            
            this.animations.forEach((animation, id) => {
                if (!animation()) {
                    this.remove(id);
                }
            });
            
            requestAnimationFrame(() => this.animate());
        }
    }
    
    // Менеджер кеширования
    class CacheManager {
        constructor() {
            this.cache = new Map();
            this.ttl = new Map();
        }
        
        set(key, value, ttlMs = 60000) {
            this.cache.set(key, value);
            this.ttl.set(key, Date.now() + ttlMs);
            
            setTimeout(() => this.delete(key), ttlMs);
        }
        
        get(key) {
            if (!this.isValid(key)) {
                this.delete(key);
                return null;
            }
            return this.cache.get(key);
        }
        
        isValid(key) {
            const expiry = this.ttl.get(key);
            return expiry && expiry > Date.now();
        }
        
        delete(key) {
            this.cache.delete(key);
            this.ttl.delete(key);
        }
        
        clear() {
            this.cache.clear();
            this.ttl.clear();
        }
    }
    
    // Система уведомлений
    class NotificationSystem {
        constructor(eventBus) {
            this.eventBus = eventBus;
            this.container = null;
            this.init();
            
            // Подписываемся на события уведомлений
            this.eventBus.on('notification:show', (data) => {
                this.show(data.message, data.type, data.duration);
            });
        }
        
        init() {
            // Используем существующий showError если есть
            if (typeof window.showError === 'function') {
                this.showLegacy = window.showError;
            }
        }
        
        show(message, type = 'info', duration = 5000) {
            // Используем существующую функцию showError
            if (this.showLegacy) {
                this.showLegacy(message);
            } else if (window.showError) {
                window.showError(message);
            } else {
                console.log(`[${type}] ${message}`);
            }
        }
    }
    
    // Фабрика для создания игровых объектов
    class GameObjectFactory {
        static createCar(carData) {
            const car = {
                id: carData.id,
                name: carData.name,
                power: carData.power,
                speed: carData.speed,
                handling: carData.handling,
                acceleration: carData.acceleration,
                price: carData.price,
                owned: carData.owned || false,
                upgrades: {
                    engine: 0,
                    turbo: 0,
                    tires: 0,
                    suspension: 0,
                    transmission: 0,
                    ...carData.upgrades
                },
                specialParts: {
                    nitro: false,
                    bodyKit: false,
                    ecuTune: false,
                    fuelTank: false,
                    ...carData.specialParts
                },
                fuel: carData.fuel ?? 30,
                maxFuel: carData.maxFuel ?? 30,
                lastFuelUpdate: carData.lastFuelUpdate || new Date().toISOString()
            };
            
            if (car.specialParts.fuelTank) {
                car.maxFuel = 40;
            }
            
            return car;
        }
        
        static createOpponent(level, difficulty) {
            const difficulties = {
                easy: { mult: 0.8, reward: 0.8, names: ["Новичок", "Студент", "Таксист"] },
                medium: { mult: 1.0, reward: 1.0, names: ["Гонщик", "Дрифтер", "Стритрейсер"] },
                hard: { mult: 1.3, reward: 1.5, names: ["Профи", "Мастер", "Чемпион"] },
                extreme: { mult: 1.6, reward: 2.0, names: ["Легенда", "Призрак", "Босс"] }
            };
            
            const settings = difficulties[difficulty];
            const names = ["Иван", "Петр", "Алексей", "Максим", "Артем", "Денис"];
            
            return {
                name: `${settings.names[Math.floor(Math.random() * settings.names.length)]} ${names[Math.floor(Math.random() * names.length)]}`,
                difficulty: Number((0.7 + (level * 0.02) * settings.mult).toFixed(2)),
                reward: Math.floor((200 + (level * 100)) * settings.reward / 50) * 50
            };
        }
    }
    
    // Экспортируем для использования в других модулях
    window.GameCore = {
        EventBus: new EventBus(),
        Store: null, // Будет инициализирован с начальным состоянием
        DOM,
        AnimationManager: new AnimationManager(),
        CacheManager: new CacheManager(),
        GameObjectFactory,
        Notifications: null, // Инициализируется после EventBus
        
        // Метод инициализации
        init(initialGameData) {
            console.log('[GameCore] Инициализация...');
            
            // Создаем Store с начальными данными
            this.Store = new GameStore(initialGameData);
            
            // Создаем систему уведомлений
            this.Notifications = new NotificationSystem(this.EventBus);
            
            // Подписываемся на критические события
            this.EventBus.on('game:error', (data) => {
                console.error('[GameCore] Ошибка:', data);
                this.Notifications.show(data.message || 'Произошла ошибка', 'error');
            });
            
            console.log('[GameCore] Инициализация завершена');
        }
    };
    
})();