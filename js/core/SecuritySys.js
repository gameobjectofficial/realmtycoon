/**
 * ===================================
 * SECURITY SYSTEM - ANTI-CHEAT ENGINE
 * ===================================
 */

const SecuritySys = {
    // SECRET SALT - Known only to you
    SECRET_SALT: "R3alm_Tyc00n_AntiCh3at_2026_!xQp9",
    _goldSignature: "",

    /**
     * Generate signature for gold amount
     */
    generateSignature(amount) {
        let str = amount.toString() + this.SECRET_SALT;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            let char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(16); // Return as hexadecimal
    },

    /**
     * Initialize engine when game loads
     */
    initEngine(initialGold) {
        this._goldSignature = this.generateSignature(initialGold);
        Logger.info('SecuritySys', 'Engine initialized');
    },

    /**
     * SECURE GOLD ADD (Use instead of direct +=)
     */
    addGold(amount) {
        if (typeof gameState !== 'undefined' && gameState.player) {
            gameState.player.gold += amount;
            this._goldSignature = this.generateSignature(gameState.player.gold);
            Logger.debug('SecuritySys', `Gold added: +${amount}`, `Total: ${gameState.player.gold}`);
        }
    },

    /**
     * SECURE GOLD SPEND (Use instead of direct -=)
     */
    spendGold(amount) {
        if (typeof gameState !== 'undefined' && gameState.player) {
            if (gameState.player.gold >= amount) {
                gameState.player.gold -= amount;
                this._goldSignature = this.generateSignature(gameState.player.gold);
                Logger.debug('SecuritySys', `Gold spent: -${amount}`, `Remaining: ${gameState.player.gold}`);
                return true; // Spend successful
            }
            Logger.warn('SecuritySys', 'Insufficient gold', `Required: ${amount}, Available: ${gameState.player.gold}`);
            return false; // Insufficient gold
        }
        return false;
    },

    /**
     * Verify gold integrity
     */
    verifyGold() {
        if (typeof gameState !== 'undefined' && gameState.player) {
            const currentSignature = this.generateSignature(gameState.player.gold);
            if (currentSignature !== this._goldSignature) {
                Logger.warn('SecuritySys', 'Gold signature mismatch! Possible tampering detected.');
                return false;
            }
            return true;
        }
        return true;
    }
};

// Export for ES6 modules compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecuritySys;
}
