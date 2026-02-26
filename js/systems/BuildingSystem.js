/**
 * ===================================
 * BUILDING SYSTEM
 * ===================================
 * Building management, upgrades, rendering
 * 
 * Dependencies: BUILDING_DATA, UI, LangSys, SecuritySys, PlayerSystem, 
 *               ItemSystem, InventorySystem, LevelSystem, DailySystem, AudioSystem
 */

const BuildingSystem = {
    /**
     * Render building list (obsolete - using category view)
     */
    renderList() {
        // Obsolete: We no longer use the left panel list.
    },

    /**
     * Render main view with category selection
     */
    renderMainView() {
        const title = document.getElementById('view-title');
        if (title) title.innerText = "Kingdom Overview";

        const container = document.getElementById('view-container');
        if (!container) return;

        container.innerHTML = this.renderCategoryView();
    },

    /**
     * Render category selection view
     */
    renderCategoryView() {
        const categories = {
            resource: {
                id: 'resource',
                name: '⚔️ Savaş Alanları',
                description: 'Kaynak toplamak için canavarlarla savaş',
                icon: '⚔️',
                color: 'var(--rarity-mythic)',
                buildings: Object.keys(BUILDING_DATA).filter(key => BUILDING_DATA[key].category === 'resource')
            },
            production: {
                id: 'production',
                name: '🏭 Üretim Binaları',
                description: 'Eşya üret ve yükselt',
                icon: '🏭',
                color: 'var(--accent-info)',
                buildings: Object.keys(BUILDING_DATA).filter(key => BUILDING_DATA[key].category === 'production')
            },
            trade: {
                id: 'trade',
                name: '💰 Ticaret',
                description: 'Pazar ve ticaret işlemleri',
                icon: '💰',
                color: 'var(--accent-gold)',
                buildings: Object.keys(BUILDING_DATA).filter(key => BUILDING_DATA[key].category === 'trade')
            }
        };

        let html = `<div class="category-container">`;

        for (const cat of Object.values(categories)) {
            const buildingCount = cat.buildings.length;
            html += `
                <div class="category-card" onclick="BuildingSystem.showCategory('${cat.id}')" style="border-color: ${cat.color};">
                    <div class="category-icon">${cat.icon}</div>
                    <div class="category-name">${cat.name}</div>
                    <div class="category-desc">${cat.description}</div>
                    <div class="category-count">${buildingCount} Bina</div>
                </div>
            `;
        }

        html += `</div>
        <p class="text-secondary" style="margin-top:25px; text-align:center;">
            Bir kategori seçin veya <button style="padding:5px 10px; margin-left:5px;" onclick="BuildingSystem.showAllBuildings()">tüm binaları göster</button>
        </p>`;

        return html;
    },

    /**
     * Show buildings by category
     */
    showCategory(categoryId) {
        const title = document.getElementById('view-title');
        if (title) title.innerText = "Kingdom Overview";

        const container = document.getElementById('view-container');
        if (!container) return;

        const categoryBuildings = Object.keys(BUILDING_DATA).filter(
            key => BUILDING_DATA[key].category === categoryId
        );

        let html = `
            <button style="margin-bottom:20px; background:var(--bg-tertiary); border:var(--border-subtle); color:var(--text-secondary); width:auto; padding:8px 15px;" onclick="BuildingSystem.renderMainView()">← Geri Dön</button>
            <div class="town-map">
        `;

        for (const key of categoryBuildings) {
            const bData = BUILDING_DATA[key];
            const currentLevel = gameState.buildings[key]?.level || 0;
            let maxLvl = bData.maxLevel;
            let tier = Math.ceil((currentLevel / maxLvl) * 5) || 1;
            if (currentLevel === 0) tier = 1;

            html += `
                <div class="town-building tier-${tier}" onclick="BuildingSystem.selectBuilding('${key}')">
                    <div class="b-icon">${bData.icon}</div>
                    <div class="b-name">${bData.name}</div>
                    <div class="b-level">Svy ${currentLevel} ${currentLevel >= maxLvl ? '(MAKS)' : ''}</div>
                </div>
            `;
        }

        html += `</div>`;
        container.innerHTML = html;
    },

    /**
     * Show all buildings
     */
    showAllBuildings() {
        const title = document.getElementById('view-title');
        if (title) title.innerText = "Kingdom Overview";

        const container = document.getElementById('view-container');
        if (!container) return;

        let html = `
            <button style="margin-bottom:20px; background:var(--bg-tertiary); border:var(--border-subtle); color:var(--text-secondary); width:auto; padding:8px 15px;" onclick="BuildingSystem.renderMainView()">← Geri Dön</button>
            <div class="town-map">
        `;

        for (const [key, bData] of Object.entries(BUILDING_DATA)) {
            const currentLevel = gameState.buildings[key]?.level || 0;
            let maxLvl = bData.maxLevel;
            let tier = Math.ceil((currentLevel / maxLvl) * 5) || 1;
            if (currentLevel === 0) tier = 1;

            html += `
                <div class="town-building tier-${tier}" onclick="BuildingSystem.selectBuilding('${key}')">
                    <div class="b-icon">${bData.icon}</div>
                    <div class="b-name">${bData.name}</div>
                    <div class="b-level">Svy ${currentLevel} ${currentLevel >= maxLvl ? '(MAKS)' : ''}</div>
                </div>
            `;
        }

        html += `</div>`;
        container.innerHTML = html;
    },

    /**
     * Select and show building details
     */
    selectBuilding(buildingKey) {
        const bData = BUILDING_DATA[buildingKey];
        const currentLevel = gameState.buildings[buildingKey]?.level || 0;
        const isMax = currentLevel >= bData.maxLevel;

        const title = document.getElementById('view-title');
        const container = document.getElementById('view-container');

        if (!container) return;

        let html = `
            <button style="margin-bottom:20px; background:var(--bg-tertiary); border:var(--border-subtle); color:var(--text-secondary); width:auto; padding:8px 15px;" onclick="BuildingSystem.showCategory('${bData.category}')">← Geri Dön</button>

            <div class="card" style="padding: 30px; max-width: 600px; margin: 0 auto;">
                <div style="text-align:center;">
                    <div style="font-size:4rem; margin-bottom:10px;">${bData.icon}</div>
                    <h2 class="text-gold" style="margin-bottom:5px;">${bData.name}</h2>
                    <p style="color:var(--text-secondary); margin-bottom:20px;">${bData.desc}</p>
                    <div style="font-size:1.2rem; color:var(--accent-gold); margin-bottom:20px;">Seviye ${currentLevel} / ${bData.maxLevel}</div>
                </div>

                ${isMax ? `
                    <div style="text-align:center; padding:20px; background:rgba(0,255,136,0.1); border:2px solid var(--rarity-uncommon); border-radius:8px;">
                        <div style="font-size:1.5rem; color:var(--rarity-uncommon);">✅ Maksimum Seviyeye Ulaşıldı!</div>
                    </div>
                ` : `
                    <button style="width:100%; padding:15px; font-size:1.1rem; background:var(--accent-gold); color:black; font-weight:bold;" onclick="BuildingSystem.upgradeBuilding('${buildingKey}')">
                        Yükselt (Seviye ${currentLevel + 1})
                    </button>
                `}

                ${this.getBuildingEffects(buildingKey, currentLevel)}
            </div>
        `;

        container.innerHTML = html;
    },

    /**
     * Get building effects description
     */
    getBuildingEffects(buildingKey, level) {
        const effects = {
            iron_mine: `⛏️ Demir Madeni - Seviye ${level}: Günde ${level * 10} Demir`,
            lumber_mill: `🌲 Odun Değirmeni - Seviye ${level}: Günde ${level * 10} Odun`,
            crystal_cavern: `🔮 Kristal Mağara - Seviye ${level}: Günde ${level * 5} Kristal`,
            forge: `⚒️ Demirci - Seviye ${level}: ${this.getForgeSlots(level)} üretim yuvası`,
            enchant_tower: `✨ Büyü Kulesi - Seviye ${level}: +%${level} büyü başarı şansı`,
            trade_port: `🚢 Ticaret Limanı - Seviye ${level}: Pazar erişimi`
        };

        return effects[buildingKey] ? `
            <div style="margin-top:20px; padding:15px; background:var(--bg-secondary); border-radius:8px;">
                <div style="font-size:0.9rem; color:var(--text-secondary);">${effects[buildingKey]}</div>
            </div>
        ` : '';
    },

    /**
     * Get forge slots by level
     */
    getForgeSlots(level) {
        if (level < 6) return 1;
        if (level < 11) return 2;
        if (level < 21) return 3;
        return 4;
    },

    /**
     * Upgrade building
     */
    upgradeBuilding(buildingKey) {
        const bData = BUILDING_DATA[buildingKey];
        const currentLevel = gameState.buildings[buildingKey]?.level || 0;

        if (currentLevel >= bData.maxLevel) {
            return UI.showToast("Bu bina zaten maksimum seviyede!", "error");
        }

        const cost = bData.getCost(currentLevel);

        // Check resources
        for (const [res, amt] of Object.entries(cost)) {
            if (gameState.player[res] < amt) {
                return UI.showToast(`Yetersiz ${LangSys.get('res_' + res) || res}!`, "error");
            }
        }

        // Confirm upgrade
        UI.confirm(
            `${bData.name} binasını ${currentLevel + 1}. seviyeye yükseltmek istiyor musunuz?`,
            () => {
                // Deduct resources
                for (const [res, amt] of Object.entries(cost)) {
                    if (res === 'gold') {
                        SecuritySys.spendGold(amt);
                    } else {
                        gameState.player[res] -= amt;
                    }
                }

                // Upgrade
                gameState.buildings[buildingKey].level++;

                // Track buildings maxed
                if (gameState.buildings[buildingKey].level >= bData.maxLevel) {
                    gameState.player.stats.buildingsMaxed = (gameState.player.stats.buildingsMaxed || 0) + 1;
                }

                PlayerSystem.updateUI();
                PlayerSystem.save();

                UI.showToast(`${bData.name} yükseltildi!`, "success");

                if (typeof AudioSystem !== 'undefined') {
                    AudioSystem.success();
                }

                // Re-render
                this.selectBuilding(buildingKey);
            },
            () => {
                UI.showToast("Yükseltme iptal edildi.", "info");
            }
        );
    },

    /**
     * Get building stats for upgrade comparison
     */
    getBuildingStats(buildingKey, level) {
        const stats = [];

        switch (buildingKey) {
            case 'iron_mine':
                stats.push({ label: 'Demir Üretimi', value: `${level * 10}/gün` });
                break;
            case 'lumber_mill':
                stats.push({ label: 'Odun Üretimi', value: `${level * 10}/gün` });
                break;
            case 'crystal_cavern':
                stats.push({ label: 'Kristal Üretimi', value: `${level * 5}/gün` });
                break;
            case 'forge':
                stats.push({ label: 'Üretim Yuvası', value: this.getForgeSlots(level) });
                break;
            case 'enchant_tower':
                stats.push({ label: 'Büyü Başarısı', value: `+${level}%` });
                break;
            case 'trade_port':
                stats.push({ label: 'Pazar Erişimi', value: level >= 1 ? 'Açık' : 'Kapalı' });
                break;
        }

        return stats;
    }
};

// Export for ES6 modules compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BuildingSystem;
}
