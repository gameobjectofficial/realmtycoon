/**
 * ===================================
 * BUILDING DATA
 * ===================================
 */

const BUILDING_DATA = {
    iron_mine: {
        name: 'Demir Madeni',
        icon: "🦇",
        maxLevel: 50,
        category: 'resource',
        desc: "Karanlık, istila edilmiş bir maden. Demir ve ganimet toplamak için içindeki canavarları öldürün.",
        baseCost: { gold: 50, wood: 20 },
        getCost: function(level) {
            const mult = Math.pow(1.5, level - 1);
            return {
                gold: Math.round(50 * mult),
                wood: Math.round(20 * mult)
            };
        }
    },
    lumber_mill: {
        name: 'Odun Değirmeni',
        icon: "🌲",
        maxLevel: 50,
        category: 'resource',
        desc: "Lanetli bir orman. Odun toplamak için yozlaşmış entleri alt edin.",
        baseCost: { gold: 50, iron: 20 },
        getCost: function(level) {
            const mult = Math.pow(1.5, level - 1);
            return {
                gold: Math.round(50 * mult),
                iron: Math.round(20 * mult)
            };
        }
    },
    crystal_cavern: {
        name: 'Kristal Mağara',
        icon: "🔮",
        maxLevel: 50,
        category: 'resource',
        desc: "Kadim yeraltı mezarları. Kristaller ve nadir elmaslar için muhafızlarla savaşın.",
        baseCost: { gold: 100, iron: 30, wood: 30 },
        getCost: function(level) {
            const mult = Math.pow(1.5, level - 1);
            return {
                gold: Math.round(100 * mult),
                iron: Math.round(30 * mult),
                wood: Math.round(30 * mult)
            };
        }
    },
    forge: {
        name: 'Demirci',
        icon: "⚒️",
        maxLevel: 50,
        category: 'production',
        desc: "Güçlü eşyalar üretin. Daha yüksek seviye daha iyi nadirlikler ve daha fazla alan açar.",
        baseCost: { gold: 100, iron: 50, crystal: 30 },
        getCost: function(level) {
            const mult = Math.pow(1.5, level - 1);
            return {
                gold: Math.round(100 * mult),
                iron: Math.round(50 * mult),
                crystal: Math.round(30 * mult)
            };
        }
    },
    enchant_tower: {
        name: 'Büyü Kulesi',
        icon: "🔮",
        maxLevel: 30,
        category: 'production',
        desc: "Eşyaları Yükselt. Seviye başına +%1 başarı şansı.",
        baseCost: { gold: 150, crystal: 40 },
        getCost: function(level) {
            const mult = Math.pow(1.5, level - 1);
            return {
                gold: Math.round(150 * mult),
                crystal: Math.round(40 * mult)
            };
        }
    },
    trade_port: {
        name: 'Ticaret Limanı',
        icon: "🚢",
        maxLevel: 30,
        category: 'trade',
        desc: "Pazara erişin. Daha yüksek seviye listeleme alanlarını artırır ve ücretleri düşürür.",
        baseCost: { gold: 200, wood: 50, iron: 30 },
        getCost: function(level) {
            const mult = Math.pow(1.5, level - 1);
            return {
                gold: Math.round(200 * mult),
                wood: Math.round(50 * mult),
                iron: Math.round(30 * mult)
            };
        }
    }
};

// Export for ES6 modules compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BUILDING_DATA;
}
