/**
 * ===================================
 * REALM TYCOON - MAIN ENTRY POINT
 * ===================================
 */

// Firebase configuration
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyA3DCjL351ezkYpFy4QsBmVz7RR296ltzk",
    authDomain: "realm-tycoon.firebaseapp.com",
    projectId: "realm-tycoon",
    storageBucket: "realm-tycoon.firebasestorage.app",
    messagingSenderId: "1075977992909",
    appId: "1:1075977992909:web:b4ee69734e4febf6644784",
    measurementId: "G-SCJ1K0HKG9"
};

/**
 * Initialize Game
 */
async function initGame() {
    try {
        Logger.info('Main', 'Initializing Realm Tycoon...');

        // Remove loading screen
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }

        // Initialize Firebase
        await StorageAPI.init(FIREBASE_CONFIG);

        // Initialize UI
        UI.init();

        // Initialize DevMode if applicable
        if (typeof DevMode !== 'undefined') {
            DevMode.init();
        }

        // Setup auth state change handler
        StorageAPI.onAuthStateChanged(async (user) => {
            if (user) {
                await onUserAuthenticated(user);
            } else {
                Logger.info('Main', 'User not authenticated');
            }
        });

        Logger.info('Main', 'Initialization complete');
    } catch (error) {
        Logger.error('Main', error, 'Failed to initialize game');
        UI.showToast('Failed to initialize game. Please refresh.', 'error');
    }
}

/**
 * Handle user authentication
 */
async function onUserAuthenticated(user) {
    try {
        Logger.info('Main', 'User authenticated:', user.uid);

        // Load player data
        const playerData = await StorageAPI.get('player-data');

        if (playerData && playerData.id) {
            // Existing player - load game
            await loadGame(playerData);
        } else {
            // New player - show welcome screen
            showWelcomeScreen();
        }
    } catch (error) {
        Logger.error('Main', error, 'Failed to load player data');
        UI.showToast('Failed to load game data. Please refresh.', 'error');
    }
}

/**
 * Load existing game
 */
async function loadGame(playerData) {
    try {
        // Load all game data
        const buildingsData = await StorageAPI.get('player-buildings');
        const inventoryData = await StorageAPI.get('player-inventory');

        // Initialize game state
        const initialState = {
            player: playerData,
            buildings: buildingsData || {
                iron_mine: { level: 1 },
                lumber_mill: { level: 1 },
                crystal_cavern: { level: 0 },
                forge: { level: 0 },
                enchant_tower: { level: 0 },
                trade_port: { level: 0 }
            },
            inventory: inventoryData || [],
            activeCrafts: []
        };

        GameStateManager.initState(initialState);

        // Initialize security system
        SecuritySys.initEngine(initialState.player.gold);

        // Show game container
        UI.gameContainer.classList.remove('hidden');

        // Initialize game systems
        BuildingSystem.renderMainView();
        InventorySystem.render();
        PlayerSystem.updateUI();

        // Apply DevMode if active
        if (typeof DevMode !== 'undefined' && DevMode.enabled) {
            DevMode.apply();
        }

        // Start game loop
        GameLoop.start();

        Logger.info('Main', 'Game loaded successfully');
        UI.showToast('Welcome back, ' + initialState.player.name + '!', 'success');
    } catch (error) {
        Logger.error('Main', error, 'Failed to load game');
        UI.showToast('Failed to load game. Please refresh.', 'error');
    }
}

/**
 * Show welcome screen for new players
 */
function showWelcomeScreen() {
    UI.showModal(`
        <div style="text-align: center; padding: 20px;">
            <h2 class="text-gold" style="font-size: 2rem; margin-bottom: 10px;">Realm Tycoon</h2>
            <p style="color: var(--text-secondary); margin-bottom: 20px;">
                Kaderinizi şekillendirin. İmparatorluğunuzu kurun. Eşyalarınızı takas edin.
            </p>
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 10px; color: var(--text-primary);">
                    Lordunuzun adı nedir?
                </label>
                <input
                    type="text"
                    id="init-player-name"
                    placeholder="İsim girin (maks 15 karakter)"
                    maxlength="15"
                    style="width: 100%; font-size: 1.1rem; padding: 12px;"
                >
            </div>
            <button
                id="btn-start-journey"
                style="width: 100%; padding: 15px; font-size: 1.1rem; background: var(--accent-gold); color: black; font-weight: bold;"
            >
                Maceraya Başla
            </button>
        </div>
    `, true);

    document.getElementById('btn-start-journey').addEventListener('click', async () => {
        const name = document.getElementById('init-player-name').value.trim();

        if (name.length < 3 || name.length > 15) {
            UI.showToast('İsim 3 ile 15 karakter arasında olmalıdır.', 'error');
            return;
        }

        await createNewPlayer(name);
    });
}

/**
 * Create new player
 */
async function createNewPlayer(name) {
    try {
        const newId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        const newPlayer = {
            id: newId,
            name: name,
            gold: 100,
            iron: 50,
            wood: 50,
            crystal: 20,
            gems: 0,
            level: 1,
            xp: 0,
            heroHp: 100,
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

        // Save player data
        await StorageAPI.set('player-data', newPlayer);

        // Create public profile
        const publicProfile = {
            id: newId,
            name: name,
            showcase: [],
            stats: { totalCrafted: 0, rarest_item: 'None' },
            joinedAt: Date.now()
        };

        await StorageAPI.set(`public-profile:${newId}`, publicProfile, true);

        UI.hideModal();

        // Initialize game state
        const initialState = {
            player: newPlayer,
            buildings: {
                iron_mine: { level: 1 },
                lumber_mill: { level: 1 },
                crystal_cavern: { level: 0 },
                forge: { level: 0 },
                enchant_tower: { level: 0 },
                trade_port: { level: 0 }
            },
            inventory: [],
            activeCrafts: []
        };

        GameStateManager.initState(initialState);
        SecuritySys.initEngine(newPlayer.gold);

        UI.gameContainer.classList.remove('hidden');

        // Initialize systems
        BuildingSystem.renderMainView();
        InventorySystem.render();
        PlayerSystem.updateUI();

        // Apply DevMode if active
        if (typeof DevMode !== 'undefined' && DevMode.enabled) {
            DevMode.apply();
        }

        // Start game loop
        GameLoop.start();

        UI.showToast(`Realm Tycoon'a hoş geldin, Lord ${name}!`, 'success');
        Logger.info('Main', 'New player created:', newId);
    } catch (error) {
        Logger.error('Main', error, 'Failed to create new player');
        UI.showToast('Failed to create character. Please try again.', 'error');
    }
}

// Start game when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}

// Export for debugging
if (typeof window !== 'undefined') {
    window.RealmTycoon = {
        initGame,
        loadGame,
        createNewPlayer,
        GameStateManager,
        StorageAPI,
        SecuritySys,
        Logger,
        UI
    };
}
