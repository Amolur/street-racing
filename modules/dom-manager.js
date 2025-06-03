// modules/dom-manager.js
// Централизованное управление DOM элементами

class DOMManager {
    constructor() {
        this.cache = new Map();
        this.batchUpdates = [];
        this.rafId = null;
    }

    // Кеширование DOM элементов
    get(selector) {
        if (!this.cache.has(selector)) {
            const element = document.querySelector(selector);
            if (element) {
                this.cache.set(selector, element);
            }
        }
        return this.cache.get(selector);
    }

    // Получение всех элементов
    getAll(selector) {
        const key = `all:${selector}`;
        if (!this.cache.has(key)) {
            const elements = document.querySelectorAll(selector);
            this.cache.set(key, Array.from(elements));
        }
        return this.cache.get(key);
    }

    // Очистка кеша при изменении DOM
    clearCache(selector = null) {
        if (selector) {
            this.cache.delete(selector);
            this.cache.delete(`all:${selector}`);
        } else {
            this.cache.clear();
        }
    }

    // Батчинг обновлений DOM
    batchUpdate(fn) {
        this.batchUpdates.push(fn);
        if (!this.rafId) {
            this.rafId = requestAnimationFrame(() => {
                this.processBatchUpdates();
            });
        }
    }

    processBatchUpdates() {
        const updates = [...this.batchUpdates];
        this.batchUpdates = [];
        this.rafId = null;

        // Выполняем все обновления за один проход
        updates.forEach(fn => fn());
    }

    // Оптимизированное обновление текста
    setText(selector, text) {
        const element = this.get(selector);
        if (element && element.textContent !== text.toString()) {
            this.batchUpdate(() => {
                element.textContent = text;
            });
        }
    }

    // Оптимизированное обновление HTML
    setHTML(selector, html) {
        const element = this.get(selector);
        if (element) {
            this.batchUpdate(() => {
                element.innerHTML = html;
            });
        }
    }

    // Оптимизированное обновление стилей
    setStyle(selector, property, value) {
        const element = this.get(selector);
        if (element) {
            this.batchUpdate(() => {
                element.style[property] = value;
            });
        }
    }

    // Массовое обновление стилей
    setStyles(selector, styles) {
        const element = this.get(selector);
        if (element) {
            this.batchUpdate(() => {
                Object.assign(element.style, styles);
            });
        }
    }

    // Показать/скрыть элемент
    show(selector) {
        this.setStyle(selector, 'display', 'block');
    }

    hide(selector) {
        this.setStyle(selector, 'display', 'none');
    }

    // Добавление/удаление классов
    addClass(selector, className) {
        const element = this.get(selector);
        if (element && !element.classList.contains(className)) {
            this.batchUpdate(() => {
                element.classList.add(className);
            });
        }
    }

    removeClass(selector, className) {
        const element = this.get(selector);
        if (element && element.classList.contains(className)) {
            this.batchUpdate(() => {
                element.classList.remove(className);
            });
        }
    }

    // Переключение класса
    toggleClass(selector, className) {
        const element = this.get(selector);
        if (element) {
            this.batchUpdate(() => {
                element.classList.toggle(className);
            });
        }
    }

    // Создание элемента с оптимизацией
    createElement(tag, options = {}) {
        const element = document.createElement(tag);
        
        if (options.className) {
            element.className = options.className;
        }
        
        if (options.id) {
            element.id = options.id;
        }
        
        if (options.text) {
            element.textContent = options.text;
        }
        
        if (options.html) {
            element.innerHTML = options.html;
        }
        
        if (options.attributes) {
            Object.entries(options.attributes).forEach(([key, value]) => {
                element.setAttribute(key, value);
            });
        }
        
        if (options.styles) {
            Object.assign(element.style, options.styles);
        }
        
        if (options.events) {
            Object.entries(options.events).forEach(([event, handler]) => {
                element.addEventListener(event, handler);
            });
        }
        
        return element;
    }

    // Добавление элемента с батчингом
    append(parentSelector, element) {
        const parent = this.get(parentSelector);
        if (parent) {
            this.batchUpdate(() => {
                parent.appendChild(element);
            });
        }
    }

    // Очистка содержимого
    empty(selector) {
        const element = this.get(selector);
        if (element) {
            this.batchUpdate(() => {
                element.innerHTML = '';
            });
        }
    }

    // Удаление элемента
    remove(selector) {
        const element = this.get(selector);
        if (element) {
            this.batchUpdate(() => {
                element.remove();
            });
            this.clearCache(selector);
        }
    }

    // Делегирование событий для улучшения производительности
    delegate(parentSelector, eventType, childSelector, handler) {
        const parent = this.get(parentSelector);
        if (!parent) return;

        parent.addEventListener(eventType, (e) => {
            const target = e.target.closest(childSelector);
            if (target && parent.contains(target)) {
                handler.call(target, e);
            }
        });
    }

    // Дебаунс для частых обновлений
    debounce(fn, delay = 300) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    // Throttle для ограничения частоты вызовов
    throttle(fn, limit = 100) {
        let inThrottle;
        return (...args) => {
            if (!inThrottle) {
                fn.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Создаем синглтон
export const dom = new DOMManager();

// Вспомогательные функции для обратной совместимости
export function $(selector) {
    return dom.get(selector);
}

export function $$(selector) {
    return dom.getAll(selector);
}