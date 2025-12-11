const Utils = {
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    lerp(start, end, t) {
        return start + (end - start) * t;
    },

    storage: {
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch {
                return defaultValue;
            }
        },

        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch {
                return false;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch {
                return false;
            }
        },

        clear() {
            try {
                localStorage.clear();
                return true;
            } catch {
                return false;
            }
        }
    },

    dom: {
        $(selector) {
            return document.querySelector(selector);
        },

        $$(selector) {
            return document.querySelectorAll(selector);
        },

        createElement(tag, className, content) {
            const el = document.createElement(tag);
            if (className) el.className = className;
            if (content) el.textContent = content;
            return el;
        },

        addClass(element, ...classes) {
            element.classList.add(...classes);
        },

        removeClass(element, ...classes) {
            element.classList.remove(...classes);
        },

        toggleClass(element, className) {
            element.classList.toggle(className);
        },

        hasClass(element, className) {
            return element.classList.contains(className);
        },

        setStyles(element, styles) {
            Object.assign(element.style, styles);
        },

        animate(element, keyframes, options) {
            return element.animate(keyframes, options);
        }
    },

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    createConfetti(container, count = 50) {
        const colors = ['#c41e3a', '#228b22', '#ffd700', '#ffffff', '#ff69b4'];
        
        for (let i = 0; i < count; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            container.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 5000);
        }
    },

    createSnowflakes(container, count = 50) {
        for (let i = 0; i < count; i++) {
            const snowflake = document.createElement('div');
            snowflake.className = 'snowflake';
            snowflake.textContent = '❄';
            snowflake.style.left = Math.random() * 100 + '%';
            snowflake.style.fontSize = (Math.random() * 15 + 8) + 'px';
            snowflake.style.animationDuration = (Math.random() * 5 + 5) + 's';
            snowflake.style.animationDelay = Math.random() * 5 + 's';
            snowflake.style.opacity = Math.random() * 0.6 + 0.4;
            container.appendChild(snowflake);
        }
    },

    vibrateDevice(pattern = [50]) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    },

    calculateScore(time, moves, size, hintsUsed = 0) {
        const baseScore = CONFIG.SCORING.baseScore * size;
        const timePenalty = time * CONFIG.SCORING.timePenalty;
        const movePenalty = moves * CONFIG.SCORING.movePenalty;
        const hintPenalty = hintsUsed * CONFIG.SCORING.hintPenalty;
        
        const optimalMoves = size * size * 10;
        const perfectBonus = moves <= optimalMoves ? CONFIG.SCORING.perfectBonus : 0;
        
        return Math.max(0, Math.round(baseScore - timePenalty - movePenalty - hintPenalty + perfectBonus));
    },

    calculateStars(time, moves, size) {
        const thresholds = {
            3: { time: [30, 60, 120], moves: [20, 40, 80] },
            4: { time: [60, 120, 240], moves: [50, 100, 200] },
            6: { time: [180, 360, 720], moves: [150, 300, 600] },
            8: { time: [300, 600, 1200], moves: [300, 600, 1200] },
            10: { time: [600, 1200, 2400], moves: [500, 1000, 2000] }
        };
        
        const sizeThreshold = thresholds[size] || thresholds[4];
        let stars = 0;
        
        if (time <= sizeThreshold.time[0] && moves <= sizeThreshold.moves[0]) stars = 3;
        else if (time <= sizeThreshold.time[1] && moves <= sizeThreshold.moves[1]) stars = 2;
        else if (time <= sizeThreshold.time[2] && moves <= sizeThreshold.moves[2]) stars = 1;
        
        return stars;
    }
};

