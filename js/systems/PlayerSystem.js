/**
 * ===================================
 * PLAYER SYSTEM
 * ===================================
 * Player authentication, save/load, UI updates
 * 
 * Dependencies: StorageAPI, UI, SecuritySys, LevelSystem, BuildingSystem, 
 *               InventorySystem, ChatSystem, GameLoop, DailySystem, Analytics
 */

const PlayerSystem = {
    /**
     * Initialize player system
     */
    async init() {
        if (!StorageAPI.isReady || !StorageAPI.uid) {
            this.showAuthScreen();
            return;
        }

        const pData = await StorageAPI.get('player-data');
        const bData = await StorageAPI.get('player-buildings');

        if (pData && pData.id) {
            gameState.player = pData;
            if (bData) {
                gameState.buildings = bData;
            }
            // Load Inventory
            const invData = await StorageAPI.get('player-inventory');
            if (invData) {
                gameState.inventory = invData;
            }
            this.onLoadGame();
        } else {
            this.showWelcomeScreen();
        }
    },

    /**
     * Show authentication screen
     */
    showAuthScreen() {
        UI.showModal(`
            <h2 class="text-gold" style="font-size:2rem; text-align:center; margin-bottom:10px;">Realm Tycoon</h2>
            <p style="text-align:center; margin-bottom: 20px;" class="text-secondary">İlerlemenizi Buluta kaydetmek için Giriş Yapın veya Kayıt Olun.</p>

            <div style="display:flex; gap:10px; margin-bottom:15px;">
                <button id="tab-login" style="flex:1; background:var(--accent-gold); color:black;" onclick="PlayerSystem.switchAuthTab('login')">Giriş Yap</button>
                <button id="tab-register" style="flex:1;" onclick="PlayerSystem.switchAuthTab('register')">Kayıt Ol</button>
            </div>

            <div id="auth-form-container">
                <input type="email" id="auth-email" placeholder="E-posta Adresi" style="width:100%; font-size:1.1rem; padding:10px; margin-bottom:10px;">
                <input type="password" id="auth-pass" placeholder="Şifre (min 6 krk)" style="width:100%; font-size:1.1rem; padding:10px; margin-bottom:20px;">
                <button style="width:100%; padding:15px; font-size:1.1rem; background:var(--accent-gold); color:black;" id="btn-submit-auth" onclick="PlayerSystem.submitAuth('login')">Giriş Yap</button>
            </div>
        `, true);
    },

    /**
     * Switch between login and register tabs
     */
    switchAuthTab(tab) {
        const btnL = document.getElementById('tab-login');
        const btnR = document.getElementById('tab-register');
        const submitBtn = document.getElementById('btn-submit-auth');

        if (tab === 'login') {
            btnL.style.background = 'var(--accent-gold)';
            btnL.style.color = 'black';
            btnR.style.background = 'var(--bg-tertiary)';
            btnR.style.color = 'var(--text-primary)';
            submitBtn.innerText = 'Giriş Yap';
            submitBtn.setAttribute('onclick', "PlayerSystem.submitAuth('login')");
        } else {
            btnR.style.background = 'var(--accent-gold)';
            btnR.style.color = 'black';
            btnL.style.background = 'var(--bg-tertiary)';
            btnL.style.color = 'var(--text-primary)';
            submitBtn.innerText = 'Hesap Oluştur';
            submitBtn.setAttribute('onclick', "PlayerSystem.submitAuth('register')");
        }
    },

    /**
     * Submit authentication form
     */
    async submitAuth(action) {
        const email = document.getElementById('auth-email').value.trim();
        const pass = document.getElementById('auth-pass').value.trim();

        if (!email || pass.length < 6) {
            return UI.showToast("Invalid Email or Şifre (min 6 krk).", "error");
        }

        const btn = document.getElementById('btn-submit-auth');
        btn.disabled = true;
        btn.innerText = "İşleniyor...";

        try {
            if (action === 'login') {
                await window.FB.signInWithEmailAndPassword(window.FB.auth, email, pass);
            } else {
                await window.FB.createUserWithEmailAndPassword(window.FB.auth, email, pass);
            }
            UI.hideModal();

            if (!StorageAPI.initCallback) {
                StorageAPI.uid = window.FB.auth.currentUser.uid;
                StorageAPI.isReady = true;
                this.init();
            }
        } catch (e) {
            console.error("Auth error", e);
            UI.showToast(e.message, "error");
            btn.disabled = false;
            btn.innerText = action === 'login' ? "Giriş Yap" : "Hesap Oluştur";
        }
    },

    /**
     * Show welcome screen for new players
     */
    showWelcomeScreen() {
        UI.showModal(`
            <h2 class="text-gold" style="font-size:2rem; text-align:center; margin-bottom:10px;">Realm Tycoon</h2>
            <p style="text-align:center; margin-bottom: 20px;" class="text-secondary">Kaderinizi şekillendirin. İmparatorluğunuzu kurun. Eşyalarınızı takas edin.</p>
            <div style="margin-bottom: 20px;">
                <label style="display:block; margin-bottom:5px;">Lordunuzun adı nedir?</label>
                <input type="text" id="init-player-name" placeholder="İsim girin (maks 15 krk)" maxlength="15" style="width:100%; font-size:1.1rem; padding:10px;">
            </div>
            <button style="width:100%; padding:15px; font-size:1.1rem;" id="btn-start-journey">Maceraya Başla</button>
        `, true);

        document.getElementById('btn-start-journey').addEventListener('click', async () => {
            const name = document.getElementById('init-player-name').value.trim();
            if (name.length < 3 || name.length > 15) {
                UI.showToast("İsim 3 ile 15 karakter arasında olmalıdır.", "error");
                return;
            }
            await this.createNewPlayer(name);
        });
    },

    /**
     * Create new player
     */
    async createNewPlayer(name) {
        const newId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        gameState.player = {
            id: newId,
            name: name,
            gold: 100,
            iron: 50,
            wood: 50,
            crystal: 20,
            gems: 0,
            level: 1,
            xp: 0,
            createdAt: Date.now(),
            stats: {
                totalItemsCrafted: 0,
                totalItemsSold: 0,
                totalGoldEarned: 0,
                monstersKilled: 0,
                enchantSuccesses: 0,
                totalEnchants: 0,
                legendaryFound: 0,
                mythicFound: 0,
                buildingsMaxed: 0,
                unlockedAchievements: []
            },
            dailyData: {
                lastLogin: 0,
                streakCount: 0,
                lastQuestsReset: 0,
                questsProgress: { kills: 0, crafts: 0, sells: 0, enchants: 0 },
                questsCompleted: []
            },
            heroEquipped: { weapon: null, armor: null, ring: null, amulet: null },
            newItemCount: 0
        };

        // Create public profile
        const publicProfile = {
            id: newId,
            name: name,
            showcase: [],
            stats: { totalCrafted: 0, rarest_item: 'None' },
            joinedAt: Date.now()
        };

        await StorageAPI.set('player-data', gameState.player);
        await StorageAPI.set('player-buildings', gameState.buildings);
        await StorageAPI.set('player-inventory', gameState.inventory);
        await StorageAPI.set(`public-profile:${newId}`, publicProfile, true);

        UI.hideModal();
        this.onLoadGame();
        UI.showToast(`Realm Tycoon'a hoş geldin, Lord ${name}! Üretim başlasın.`, "success");
    },

    /**
     * Save player data
     */
    async save() {
        if (!gameState.player) return;
        await StorageAPI.set('player-data', gameState.player);
        await StorageAPI.set('player-buildings', gameState.buildings);
        await StorageAPI.set('player-inventory', gameState.inventory);
    },

    /**
     * Load game after authentication
     */
    onLoadGame() {
        // Patch old saves for new fields
        const p = gameState.player;
        if (!p.stats) p.stats = {};
        if (!p.stats.monstersKilled) p.stats.monstersKilled = 0;
        if (!p.stats.enchantSuccesses) p.stats.enchantSuccesses = 0;
        if (!p.stats.legendaryFound) p.stats.legendaryFound = 0;
        if (!p.stats.mythicFound) p.stats.mythicFound = 0;
        if (!p.stats.buildingsMaxed) p.stats.buildingsMaxed = 0;
        if (!p.stats.unlockedAchievements) p.stats.unlockedAchievements = [];
        if (!p.dailyData) p.dailyData = {
            lastLogin: 0,
            streakCount: 0,
            lastQuestsReset: 0,
            questsProgress: { kills: 0, crafts: 0, sells: 0, enchants: 0 },
            questsCompleted: []
        };
        if (!p.dailyData.questsProgress) p.dailyData.questsProgress = { kills: 0, crafts: 0, sells: 0, enchants: 0 };
        if (!p.heroEquipped) p.heroEquipped = { weapon: null, armor: null, ring: null, amulet: null };
        if (p.newItemCount === undefined) p.newItemCount = 0;
        if (p.level === undefined) p.level = 1;
        if (p.xp === undefined) p.xp = 0;
        if (p.heroHp === undefined) p.heroHp = LevelSystem.getMaxHp(p.level);

        // Initialize security system
        SecuritySys.initEngine(gameState.player.gold);

        UI.gameContainer.classList.remove('hidden');

        // Initialize systems
        if (typeof BuildingSystem !== 'undefined') {
            BuildingSystem.renderList();
            BuildingSystem.renderMainView();
        }

        if (typeof InventorySystem !== 'undefined') {
            InventorySystem.render();
        }

        if (typeof ChatSystem !== 'undefined') {
            ChatSystem.init();
        }

        this.updateUI();

        if (typeof GameLoop !== 'undefined') {
            GameLoop.start();
        }

        if (typeof DailySystem !== 'undefined') {
            DailySystem.checkLoginStreak();
        }

        this.calcOfflineProgress();

        Logger.info('PlayerSystem', 'Game loaded for', p.name);
    },

    /**
     * Calculate offline progress
     */
    async calcOfflineProgress() {
        const lastSave = await StorageAPI.get('last-save-time');
        if (!lastSave) return;

        const now = Date.now();
        const offlineSeconds = Math.floor((now - lastSave) / 1000);

        if (offlineSeconds > 60) {
            const offlineMinutes = Math.floor(offlineSeconds / 60);
            Logger.info('PlayerSystem', `Player was offline for ${offlineMinutes} minutes`);

            if (typeof Analytics !== 'undefined') {
                Analytics.track('offline_session', {
                    durationSeconds: offlineSeconds,
                    playerId: gameState.player?.id
                });
            }
        }
    },

    /**
     * Update UI with current player state
     */
    updateUI() {
        if (!gameState.player) return;

        const p = gameState.player;

        // Update resources
        if (UI.resCells.gold) UI.resCells.gold.innerText = UI.formatNumber(p.gold);
        if (UI.resCells.iron) UI.resCells.iron.innerText = UI.formatNumber(p.iron);
        if (UI.resCells.wood) UI.resCells.wood.innerText = UI.formatNumber(p.wood);
        if (UI.resCells.crystal) UI.resCells.crystal.innerText = Math.floor(p.crystal);
        if (UI.resCells.gems) UI.resCells.gems.innerText = UI.formatNumber(p.gems);
        if (UI.playerName) UI.playerName.innerText = p.name;

        // Update level and XP
        const levelEl = document.getElementById('player-level');
        const xpCurrentEl = document.getElementById('xp-current');
        const xpRequiredEl = document.getElementById('xp-required');
        const xpProgressEl = document.getElementById('xp-progress');

        if (levelEl) levelEl.textContent = p.level;

        if (xpCurrentEl && xpRequiredEl && xpProgressEl) {
            const xpRequired = LevelSystem.getXpRequired(p.level);
            xpCurrentEl.textContent = p.xp;
            xpRequiredEl.textContent = xpRequired;
            const xpPercent = Math.floor((p.xp / xpRequired) * 100);
            xpProgressEl.style.width = xpPercent + '%';
        }

        // Update hero HP
        this.updateHeroHPDisplay();

        // Update nav badges
        if (typeof UI.updateNavBadges === 'function') {
            UI.updateNavBadges();
        }
    },

    /**
     * Update hero HP display
     */
    updateHeroHPDisplay() {
        const hpEl = document.getElementById('hero-hp-topbar');
        if (!hpEl || !gameState.player) return;

        const heroLevel = gameState.player.level || 1;
        const maxHp = LevelSystem.getMaxHp(heroLevel);

        if (gameState.player.heroHp === undefined) {
            gameState.player.heroHp = maxHp;
        }

        hpEl.textContent = `${Math.floor(gameState.player.heroHp)}/${maxHp}`;

        if (gameState.player.heroHp < maxHp * 0.3) {
            hpEl.style.color = 'var(--rarity-mythic)';
        } else if (gameState.player.heroHp < maxHp * 0.6) {
            hpEl.style.color = 'var(--accent-warning)';
        } else {
            hpEl.style.color = 'var(--accent-danger)';
        }
    }
};

// Export for ES6 modules compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlayerSystem;
}
