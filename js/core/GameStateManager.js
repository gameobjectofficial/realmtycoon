/**
 * ===================================
 * GAME STATE MANAGER
 * ===================================
 * Centralized state management with deep proxy support
 */

const GameStateManager = {
    _state: {},
    _subscribers: {},

    // Initialize state
    initState(initialState) {
        this._state = initialState;
        this._subscribers = {};
        Logger.info('GameStateManager', 'State initialized');
    },

    // Get state or specific category
    getState(category = null) {
        if (category) {
            return this._state[category];
        }
        return this._state;
    },

    // Set state and notify subscribers
    setState(newState) {
        this._mergeState(newState);
        this._notifySubscribers();
    },

    // Deep merge state
    _mergeState(newState) {
        this._state = this._mergeDeep(this._state, newState);
    },

    _mergeDeep(target, source) {
        const result = { ...target };

        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                const sourceValue = source[key];
                const targetValue = target[key];

                if (this._isObject(sourceValue) && this._isObject(targetValue)) {
                    result[key] = this._mergeDeep(targetValue, sourceValue);
                } else if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
                    result[key] = sourceValue;
                } else {
                    result[key] = sourceValue;
                }
            }
        }

        return result;
    },

    _isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    },

    // Subscribe to state changes
    subscribe(category, callback) {
        if (!this._subscribers[category]) {
            this._subscribers[category] = [];
        }
        this._subscribers[category].push(callback);

        return () => {
            this._subscribers[category] = this._subscribers[category].filter(cb => cb !== callback);
        };
    },

    // Notify subscribers of changes
    _notifySubscribers() {
        for (const category in this._subscribers) {
            if (this._subscribers.hasOwnProperty(category)) {
                const callbacks = this._subscribers[category];
                const value = this._state[category];

                callbacks.forEach(callback => {
                    try {
                        callback(value);
                    } catch (error) {
                        Logger.error('GameStateManager', error, `Subscriber callback error for ${category}`);
                    }
                });
            }
        }
    },

    // Get state history for debugging
    getHistory() {
        return {
            state: this._state,
            subscriberCount: Object.values(this._subscribers).reduce((a, b) => a + b.length, 0)
        };
    },

    // Export state for save
    exportState() {
        return JSON.parse(JSON.stringify(this._state));
    },

    // Import state from save
    importState(savedState) {
        try {
            this._state = this._mergeDeep(this._state, savedState);
            Logger.info('GameStateManager', 'State imported successfully');
        } catch (error) {
            Logger.error('GameStateManager', error, 'Failed to import state');
        }
    }
};

// Export for ES6 modules compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameStateManager;
}
