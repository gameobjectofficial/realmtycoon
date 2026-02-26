/**
 * ===================================
 * LEVEL SYSTEM
 * ===================================
 * Experience points, level progression, HP and ATK calculations
 * 
 * Dependencies: Utils (memoize), PlayerSystem, Analytics, AudioSystem
 */

const LevelSystem = {
    /**
     * XP required for next level: 100 * level^1.5
     * Memoized for performance
     */
    getXpRequired: Utils.memoize(function(level) {
        return Math.floor(100 * Math.pow(level, 1.5));
    }),

    /**
     * Max HP: 100 * (1 + (level-1)*0.15)
     * Memoized for performance
     */
    getMaxHp: Utils.memoize(function(level) {
        return Math.floor(100 * (1 + (level - 1) * 0.15));
    }),

    /**
     * Base ATK: 10 * (1 + (level-1)*0.12)
     * Memoized for performance
     */
    getBaseAtk: Utils.memoize(function(level) {
        return Math.floor(10 * (1 + (level - 1) * 0.12));
    }),

    /**
     * Add XP and check for level up
     */
    addXp(amount) {
        const player = gameState.player;
        if (!player) return;

        player.xp += amount;

        let leveledUp = false;
        let newLevel = player.level;

        // Check for level up
        while (player.xp >= this.getXpRequired(newLevel)) {
            player.xp -= this.getXpRequired(newLevel);
            newLevel++;
            leveledUp = true;
        }

        if (leveledUp) {
            const oldLevel = player.level;
            player.level = newLevel;

            // Clear memoize cache for level-dependent functions
            if (this.getXpRequired.cache) this.getXpRequired.cache.clear();
            if (this.getMaxHp.cache) this.getMaxHp.cache.clear();
            if (this.getBaseAtk.cache) this.getBaseAtk.cache.clear();

            // Track analytics
            if (typeof Analytics !== 'undefined') {
                Analytics.trackLevelUp(newLevel, player.xp);
            }

            // Show level up toast
            this.showLevelUpToast(newLevel);

            // Play achievement sound
            if (typeof AudioSystem !== 'undefined') {
                AudioSystem.achievement();
            }
        }

        // Update UI
        if (typeof PlayerSystem !== 'undefined') {
            PlayerSystem.updateUI();
            PlayerSystem.save();
        }
    },

    /**
     * Show level up toast notification
     */
    showLevelUpToast(newLevel) {
        const toast = document.createElement('div');
        toast.className = 'toast achievement';
        toast.innerHTML = `🎉 <strong>LEVEL ATLANDI!</strong><br>Seviye ${newLevel} ulaştın!<br><span style="font-size:0.85rem; color:var(--text-secondary)">HP ve Saldırı Gücün arttı!</span>`;

        const container = document.getElementById('toast-container');
        if (container) {
            container.appendChild(toast);
        }

        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    },

    /**
     * Get XP progress percentage (0-100)
     */
    getXpProgress() {
        const player = gameState.player;
        if (!player) return 0;

        const required = this.getXpRequired(player.level);
        return Math.floor((player.xp / required) * 100);
    },

    /**
     * Get current level
     */
    getLevel() {
        return gameState.player?.level || 1;
    },

    /**
     * Get current XP
     */
    getCurrentXp() {
        return gameState.player?.xp || 0;
    },

    /**
     * Check if player can reach level with current XP
     */
    canReachLevel(targetLevel) {
        const player = gameState.player;
        if (!player) return false;

        let totalXpNeeded = 0;
        for (let i = player.level; i < targetLevel; i++) {
            totalXpNeeded += this.getXpRequired(i);
        }

        return player.xp >= totalXpNeeded;
    }
};

// Export for ES6 modules compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LevelSystem;
}
