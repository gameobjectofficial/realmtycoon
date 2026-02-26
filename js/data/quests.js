/**
 * ===================================
 * QUESTS & REWARDS DATA
 * ===================================
 */

const DAILY_QUESTS = [
    {
        id: 'daily_kills',
        nameKey: 'daily_kills',
        reqKey: 'kills',
        target: 10,
        rewardKey: 'gold',
        rewardAmt: 100
    },
    {
        id: 'daily_crafts',
        nameKey: 'daily_crafts',
        reqKey: 'crafts',
        target: 5,
        rewardKey: 'crystal',
        rewardAmt: 20
    },
    {
        id: 'daily_sells',
        nameKey: 'daily_sells',
        reqKey: 'sells',
        target: 3,
        rewardKey: 'gold',
        rewardAmt: 150
    },
    {
        id: 'daily_enchants',
        nameKey: 'daily_enchants',
        reqKey: 'enchants',
        target: 2,
        rewardKey: 'gems',
        rewardAmt: 1
    }
];

const STREAK_REWARDS = [
    { gold: 100, crystal: 20 },      // Day 1
    { gold: 150, crystal: 30 },      // Day 2
    { gold: 200, crystal: 40 },      // Day 3
    { gold: 300, crystal: 50 },      // Day 4
    { gold: 400, crystal: 60 },      // Day 5
    { gold: 500, crystal: 80 },      // Day 6
    { gold: 1000, crystal: 150, gems: 5 } // Day 7 (Weekly Bonus)
];

const ACHIEVEMENTS = [
    {
        id: 'first_craft',
        name: 'İlk Üretim',
        desc: 'İlk eşyanı üret',
        condition: { type: 'stat', key: 'totalItemsCrafted', value: 1 },
        reward: { gold: 50 }
    },
    {
        id: 'first_legendary',
        name: 'Efsane Başlangıcı',
        desc: 'İlk efsanevi eşyanı bul',
        condition: { type: 'stat', key: 'legendaryFound', value: 1 },
        reward: { gold: 500, gems: 2 }
    },
    {
        id: 'mythic_hunter',
        name: 'Mitik Avcı',
        desc: 'İlk mitik eşyanı bul',
        condition: { type: 'stat', key: 'mythicFound', value: 1 },
        reward: { gold: 2000, gems: 10 }
    },
    {
        id: 'master_builder',
        name: 'Usta İnşaatçı',
        desc: 'Tüm binaları maksimum seviyeye çıkar',
        condition: { type: 'stat', key: 'buildingsMaxed', value: 6 },
        reward: { gold: 10000, gems: 50 }
    },
    {
        id: 'enchant_master',
        name: 'Büyü Ustası',
        desc: '100 başarılı büyüleme yap',
        condition: { type: 'stat', key: 'enchantSuccesses', value: 100 },
        reward: { gold: 5000, crystal: 500 }
    },
    {
        id: 'monster_slayer',
        name: 'Canavar Avcısı',
        desc: '1000 canavar öldür',
        condition: { type: 'stat', key: 'monstersKilled', value: 1000 },
        reward: { gold: 3000, gems: 15 }
    }
];

const LEVEL_REWARDS = {
    2: { gold: 200 },
    3: { gold: 300, crystal: 50 },
    4: { gold: 400, crystal: 75 },
    5: { gold: 500, crystal: 100, gems: 1 },
    10: { gold: 2000, crystal: 500, gems: 5 },
    20: { gold: 5000, crystal: 1000, gems: 15 },
    30: { gold: 10000, crystal: 2500, gems: 30 },
    40: { gold: 20000, crystal: 5000, gems: 50 },
    50: { gold: 50000, crystal: 10000, gems: 100 }
};

// Export for ES6 modules compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DAILY_QUESTS,
        STREAK_REWARDS,
        ACHIEVEMENTS,
        LEVEL_REWARDS
    };
}
