/**
 * ===================================
 * LOGGER - Debug Logging System
 * ===================================
 */

const Logger = {
    enabled: true,
    debugMode: false,

    enable() {
        this.enabled = true;
    },

    disable() {
        this.enabled = false;
    },

    setDebugMode(enabled) {
        this.debugMode = enabled;
    },

    info(module, message, data = null) {
        if (!this.enabled) return;
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] [INFO] [${module}] ${message}`, data || '');
    },

    warn(module, message, data = null) {
        if (!this.enabled) return;
        const timestamp = new Date().toLocaleTimeString();
        console.warn(`[${timestamp}] [WARN] [${module}] ${message}`, data || '');
    },

    error(module, error, message = '') {
        if (!this.enabled) return;
        const timestamp = new Date().toLocaleTimeString();
        console.error(`[${timestamp}] [ERROR] [${module}] ${message}`, error);
    },

    debug(module, message, data = null) {
        if (!this.enabled || !this.debugMode) return;
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] [DEBUG] [${module}] ${message}`, data || '');
    },

    trace(module, message) {
        if (!this.enabled || !this.debugMode) return;
        const timestamp = new Date().toLocaleTimeString();
        console.trace(`[${timestamp}] [TRACE] [${module}] ${message}`);
    }
};

// Export for ES6 modules compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Logger;
}
