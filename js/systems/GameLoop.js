/**
 * ===================================
 * GAME LOOP SYSTEM
 * ===================================
 * Main game loop - updates every second
 * 
 * Dependencies: PlayerSystem, ItemSystem, LeaderboardSystem, StorageAPI, 
 *               SecuritySys, LevelSystem, Logger
 */

const GameLoop = {
    intervalId: null,
    lastSave: Date.now(),

    /**
     * Start game loop
     */
    start() {
        gameState.lastTick = Date.now();
        this.intervalId = setInterval(() => this.tick(), 1000);
        Logger.info('GameLoop', 'Game loop started');
    },

    /**
     * Stop game loop
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            Logger.info('GameLoop', 'Game loop stopped');
        }
    },

    /**
     * Game tick - called every second
     */
    tick() {
        const now = Date.now();
        let dt = (now - gameState.lastTick) / 1000;

        // Cap delta time to prevent huge jumps after being away
        if (dt > 86400) dt = 86400;

        gameState.lastTick = now;

        if (gameState.player) {
            // Update UI
            if (typeof PlayerSystem !== 'undefined') {
                PlayerSystem.updateUI();
            }

            // Update craft timers
            if (typeof ItemSystem !== 'undefined') {
                ItemSystem.updateCraftTimers();
            }

            // Hero HP regeneration
            this.regenerateHeroHP(now);

            // Push leaderboard score (throttled)
            if (typeof LeaderboardSystem !== 'undefined') {
                LeaderboardSystem.pushMyScore();
            }
        }

        // Auto save every 10 seconds
        if (now - this.lastSave > 10000) {
            if (typeof PlayerSystem !== 'undefined') {
                PlayerSystem.save();
            }

            if (typeof StorageAPI !== 'undefined') {
                StorageAPI.set('last-save-time', now);
            }

            this.lastSave = now;
        }
    },

    /**
     * Regenerate hero HP over time
     */
    regenerateHeroHP(now) {
        if (!gameState.player) return;

        const heroLevel = gameState.player.level || 1;
        const maxHp = LevelSystem.getMaxHp(heroLevel);
        const currentHp = gameState.player.heroHp !== undefined ? gameState.player.heroHp : maxHp;

        // Check combat status with timestamp lock
        const combatLock = gameState.player._combatLock || 0;
        const isInCombat = (typeof DungeonSystem !== 'undefined' && DungeonSystem.inCombat) || 
                          (Date.now() - combatLock < 5000);

        // Only regen when not in combat
        if (!isInCombat && currentHp < maxHp) {
            const lastRegen = gameState.player._lastHpRegen || 0;

            // Regen rate scales with level: 1 HP per (15 / level) seconds, min 1 sec
            const regenInterval = Math.max(1000, Math.floor(15000 / heroLevel));

            if (now - lastRegen >= regenInterval) {
                gameState.player.heroHp = Math.min(maxHp, currentHp + 1);
                gameState.player._lastHpRegen = now;

                if (typeof PlayerSystem !== 'undefined') {
                    PlayerSystem.updateHeroHPDisplay();
                }
            }
        }
    }
};

// Export for ES6 modules compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameLoop;
}
