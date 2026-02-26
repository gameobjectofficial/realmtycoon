/**
 * ===================================
 * ITEM DATA - Categories, Rarities & Constants
 * ===================================
 */

const ITEM_CATEGORIES = {
    weapon: {
        name: 'Silah',
        icon: '⚔️',
        baseStats: { attack: [10, 25], defense: [0, 5], magic: [0, 10] },
        subtypes: ['Kılıç', 'Balta', 'Mızrak', 'Hançer', 'Asa']
    },
    armor: {
        name: 'Zırh',
        icon: '🛡️',
        baseStats: { attack: [0, 5], defense: [15, 40], magic: [0, 10] },
        subtypes: ['Göğüs Zırhı', 'Miğfer', 'Eldiven', 'Çizme']
    },
    ring: {
        name: 'Yüzük',
        icon: '💍',
        baseStats: { attack: [5, 15], defense: [5, 15], magic: [10, 25] },
        subtypes: ['Güç Yüzüğü', 'Koruma Yüzüğü', 'Büyü Yüzüğü']
    },
    amulet: {
        name: 'Kolye',
        icon: '📿',
        baseStats: { attack: [8, 20], defense: [8, 20], magic: [15, 35] },
        subtypes: ['Güç Kolyesi', 'Bilgelik Kolyesi', 'Koruma Kolyesi']
    },
    chest: {
        name: 'Sandık',
        icon: '📦',
        baseStats: { attack: [0, 0], defense: [0, 0], magic: [0, 0] },
        subtypes: ['Sıradan Sandık', 'Nadir Sandık', 'Efsanevi Sandık']
    }
};

const RARITIES = {
    common: {
        name: 'Sıradan',
        color: '#9d9d9d',
        multiplier: 1,
        chance: 50
    },
    uncommon: {
        name: 'Sıradışı',
        color: '#1eff00',
        multiplier: 1.5,
        chance: 30
    },
    rare: {
        name: 'Nadir',
        color: '#0070dd',
        multiplier: 2.5,
        chance: 12
    },
    epic: {
        name: 'Destansı',
        color: '#a335ee',
        multiplier: 4,
        chance: 5
    },
    legendary: {
        name: 'Efsanevi',
        color: '#ff8000',
        multiplier: 7,
        chance: 2.5
    },
    mythic: {
        name: 'Mitik',
        color: '#ff0000',
        multiplier: 12,
        chance: 0.5
    }
};

const EQUIP_SLOTS = {
    weapon: 'weapon',
    armor: 'armor',
    ring: 'ring',
    amulet: 'amulet'
};

const CHEST_CONTENTS = {
    common_chest: {
        name: 'Sıradan Sandık',
        cost: 50,
        rewards: {
            gold: [20, 50],
            resources: {
                iron: [10, 30],
                wood: [10, 30]
            },
            items: {
                rarities: ['common', 'uncommon'],
                count: [1, 2]
            }
        }
    },
    rare_chest: {
        name: 'Nadir Sandık',
        cost: 150,
        rewards: {
            gold: [50, 150],
            resources: {
                iron: [30, 80],
                wood: [30, 80],
                crystal: [10, 30]
            },
            items: {
                rarities: ['uncommon', 'rare', 'epic'],
                count: [1, 3]
            }
        }
    },
    legendary_chest: {
        name: 'Efsanevi Sandık',
        cost: 500,
        rewards: {
            gold: [200, 500],
            resources: {
                iron: [100, 200],
                wood: [100, 200],
                crystal: [50, 100],
                gems: [1, 5]
            },
            items: {
                rarities: ['rare', 'epic', 'legendary', 'mythic'],
                count: [2, 5]
            }
        }
    }
};

// Export for ES6 modules compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ITEM_CATEGORIES,
        RARITIES,
        EQUIP_SLOTS,
        CHEST_CONTENTS
    };
}
