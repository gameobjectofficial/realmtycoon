/**
 * ===================================
 * LANGUAGE SYSTEM (LangSys)
 * ===================================
 * Localization and text management
 */

const LangSys = {
    currentLang: 'tr', // Default to Turkish

    translations: {
        tr: {
            // Buildings
            b_iron_mine: "Demir Madeni",
            b_lumber_mill: "Odun Değirmeni",
            b_crystal_cavern: "Kristal Mağara",
            b_forge: "Demirci",
            b_enchant_tower: "Büyü Kulesi",
            b_trade_port: "Ticaret Limanı",

            // Resources
            res_gold: "Altın",
            res_iron: "Demir",
            res_wood: "Odun",
            res_crystal: "Kristal",
            res_gems: "Elmas",

            // UI Labels
            upgrade: "Yükselt",
            cancel: "İptal",
            confirm: "Onayla",
            close: "Kapat",
            sell: "Sat",
            buy: "Satın Al",
            craft: "Üret",
            enchant: "Büyüle",
            equip: "Kuşan",
            unequip: "Çıkar",

            // Hero
            equip_hero: "Kahramana Kuşan",

            // Daily System
            streak_reward: "Giriş Ödülü",
            streak_day: "Gün",
            daily_quests: "Günlük Görevler",
            login_streak: "Giriş Serisi",
            quests_complete: "Görevler Tamamlandı",

            // Rarities
            rarity_common: "Sıradan",
            rarity_uncommon: "Sıradışı",
            rarity_rare: "Nadir",
            rarity_epic: "Destansı",
            rarity_legendary: "Efsanevi",
            rarity_mythic: "Mitik",

            // Categories
            cat_weapon: "Silah",
            cat_armor: "Zırh",
            cat_ring: "Yüzük",
            cat_amulet: "Kolye",
            cat_chest: "Sandık",

            // Messages
            insufficient_gold: "Yetersiz Altın",
            insufficient_resources: "Yetersiz Kaynak",
            inventory_full: "Envanter Dolu",
            upgrade_success: "Yükseltme Başarılı",
            craft_started: "Üretim Başlatıldı",
            enchant_success: "Büyüleme Başarılı",
            enchant_fail: "Büyüleme Başarısız",

            // Time
            seconds: "saniye",
            minutes: "dakika",
            hours: "saat",
            days: "gün"
        },

        en: {
            // Buildings
            b_iron_mine: "Iron Mine",
            b_lumber_mill: "Lumber Mill",
            b_crystal_cavern: "Crystal Cavern",
            b_forge: "Forge",
            b_enchant_tower: "Enchant Tower",
            b_trade_port: "Trade Port",

            // Resources
            res_gold: "Gold",
            res_iron: "Iron",
            res_wood: "Wood",
            res_crystal: "Crystal",
            res_gems: "Gems",

            // UI Labels
            upgrade: "Upgrade",
            cancel: "Cancel",
            confirm: "Confirm",
            close: "Close",
            sell: "Sell",
            buy: "Buy",
            craft: "Craft",
            enchant: "Enchant",
            equip: "Equip",
            unequip: "Unequip",

            // Hero
            equip_hero: "Equip Hero",

            // Daily System
            streak_reward: "Login Reward",
            streak_day: "Day",
            daily_quests: "Daily Quests",
            login_streak: "Login Streak",
            quests_complete: "Quests Complete",

            // Rarities
            rarity_common: "Common",
            rarity_uncommon: "Uncommon",
            rarity_rare: "Rare",
            rarity_epic: "Epic",
            rarity_legendary: "Legendary",
            rarity_mythic: "Mythic",

            // Categories
            cat_weapon: "Weapon",
            cat_armor: "Armor",
            cat_ring: "Ring",
            cat_amulet: "Amulet",
            cat_chest: "Chest",

            // Messages
            insufficient_gold: "Insufficient Gold",
            insufficient_resources: "Insufficient Resources",
            inventory_full: "Inventory Full",
            upgrade_success: "Upgrade Successful",
            craft_started: "Craft Started",
            enchant_success: "Enchant Successful",
            enchant_fail: "Enchant Failed",

            // Time
            seconds: "seconds",
            minutes: "minutes",
            hours: "hours",
            days: "days"
        }
    },

    /**
     * Get translation for key
     */
    get(key, lang = null) {
        const language = lang || this.currentLang;
        const translation = this.translations[language]?.[key] || this.translations['tr']?.[key] || key;
        return translation;
    },

    /**
     * Set current language
     */
    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLang = lang;
            Logger.info('LangSys', `Language changed to ${lang}`);
            return true;
        }
        Logger.warn('LangSys', `Language not found: ${lang}`);
        return false;
    },

    /**
     * Get available languages
     */
    getAvailableLanguages() {
        return Object.keys(this.translations);
    },

    /**
     * Add new translation
     */
    addTranslation(lang, key, value) {
        if (!this.translations[lang]) {
            this.translations[lang] = {};
        }
        this.translations[lang][key] = value;
    },

    /**
     * Add multiple translations
     */
    addTranslations(lang, translations) {
        if (!this.translations[lang]) {
            this.translations[lang] = {};
        }
        Object.assign(this.translations[lang], translations);
    }
};

// Export for ES6 modules compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LangSys;
}
