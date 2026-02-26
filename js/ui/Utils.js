/**
 * ===================================
 * UTILS - Helper Functions
 * ===================================
 */

const Utils = {
    /**
     * Memoization helper for expensive function calls
     */
    memoize(fn) {
        const cache = new Map();
        return function(...args) {
            const key = JSON.stringify(args);
            if (cache.has(key)) {
                return cache.get(key);
            }
            const result = fn.apply(this, args);
            cache.set(key, result);
            return result;
        };
    },

    /**
     * Format number with K, M, B suffixes
     */
    formatNumber(num) {
        if (num >= 1e9) {
            return (num / 1e9).toFixed(2) + 'B';
        }
        if (num >= 1e6) {
            return (num / 1e6).toFixed(2) + 'M';
        }
        if (num >= 1e3) {
            return (num / 1e3).toFixed(2) + 'K';
        }
        return num.toString();
    },

    /**
     * Parse formatted number back to integer
     */
    parseNumber(str) {
        if (typeof str === 'number') return str;

        const suffix = str.slice(-1).toLowerCase();
        const multiplier = { 'k': 1e3, 'm': 1e6, 'b': 1e9 }[suffix];

        if (multiplier) {
            return parseFloat(str.slice(0, -1)) * multiplier;
        }
        return parseFloat(str);
    },

    /**
     * Random integer between min and max (inclusive)
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Random float between min and max
     */
    randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    },

    /**
     * Random choice from array
     */
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    /**
     * Clamp value between min and max
     */
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    /**
     * Linear interpolation
     */
    lerp(start, end, t) {
        return start + (end - start) * t;
    },

    /**
     * Check if object is empty
     */
    isEmpty(obj) {
        return Object.keys(obj).length === 0;
    },

    /**
     * Deep clone object
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * Get current timestamp
     */
    now() {
        return Date.now();
    },

    /**
     * Format time duration
     */
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    },

    /**
     * Generate unique ID
     */
    generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Debounce function
     */
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

    /**
     * Throttle function
     */
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

    /**
     * Calculate percentage
     */
    percentage(part, whole) {
        if (whole === 0) return 0;
        return (part / whole) * 100;
    },

    /**
     * Round to decimal places
     */
    roundTo(num, decimals) {
        const factor = Math.pow(10, decimals);
        return Math.round(num * factor) / factor;
    }
};

// Export for ES6 modules compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
