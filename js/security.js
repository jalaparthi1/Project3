const Security = {
    sanitizeString(str) {
        if (typeof str !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    escapeHtml(str) {
        if (typeof str !== 'string') return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return str.replace(/[&<>"']/g, m => map[m]);
    },

    validateEmail(email) {
        if (!email || typeof email !== 'string') return false;
        if (email.length > 100) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    },

    validateUsername(username) {
        if (!username || typeof username !== 'string') return false;
        const trimmed = username.trim();
        if (trimmed.length < 3 || trimmed.length > 20) return false;
        const usernameRegex = /^[a-zA-Z0-9_-]+$/;
        return usernameRegex.test(trimmed);
    },

    validatePassword(password) {
        if (!password || typeof password !== 'string') return false;
        if (password.length < 6 || password.length > 128) return false;
        return true;
    },

    validatePuzzleSize(size) {
        const validSizes = [3, 4, 6, 8, 10];
        const numSize = parseInt(size);
        return validSizes.includes(numSize);
    },

    validatePositiveInteger(value, max = null) {
        const num = parseInt(value);
        if (isNaN(num) || num < 0) return false;
        if (max !== null && num > max) return false;
        return true;
    },

    validateTime(seconds) {
        if (!this.validatePositiveInteger(seconds)) return false;
        return seconds <= 86400;
    },

    validateMoves(moves) {
        if (!this.validatePositiveInteger(moves)) return false;
        return moves <= 100000;
    },

    createElementWithText(tag, text, className = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        element.textContent = text;
        return element;
    }
};

