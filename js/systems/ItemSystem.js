/**
 * ===================================
 * ITEM SYSTEM
 * ===================================
 * Item crafting, pattern generation, stats calculation
 * 
 * Dependencies: ITEM_CATEGORIES, RARITIES, InventorySystem, 
 *               SecuritySys, PlayerSystem, LevelSystem, AchievementSystem, 
 *               DailySystem, Analytics, AudioSystem, UI, LangSys, BuildingSystem
 */

const ItemSystem = {
    /**
     * Get available forge slots based on forge level
     */
    getForgeSlots() {
        const lvl = gameState.buildings.forge.level;
        if (lvl < 6) return 1;
        if (lvl < 11) return 2;
        if (lvl < 21) return 3;
        return 4;
    },

    /**
     * Start crafting an item
     */
    startCraft(catId) {
        const cat = ITEM_CATEGORIES[catId];

        if (gameState.activeCrafts.length >= this.getForgeSlots()) {
            return UI.showToast("No available craft slots!", "error");
        }

        // Check resources
        if (gameState.player.iron < cat.cost.iron ||
            gameState.player.wood < cat.cost.wood ||
            gameState.player.crystal < cat.cost.crystal ||
            gameState.player.gold < cat.cost.gold) {
            return UI.showToast("Not enough resources.", "error");
        }

        // Deduct resources
        gameState.player.iron -= cat.cost.iron;
        gameState.player.wood -= cat.cost.wood;
        gameState.player.crystal -= cat.cost.crystal;

        if (!SecuritySys.spendGold(cat.cost.gold)) {
            UI.showToast("Yetersiz altın!", "error");
            return;
        }

        PlayerSystem.updateUI();

        // Start timer
        const now = Date.now();
        const targetTime = now + (cat.craftTime * 1000);
        const craftId = 'craft_' + now + '_' + Math.floor(Math.random() * 1000);

        gameState.activeCrafts.push({
            id: craftId,
            catId: catId,
            startTime: now,
            targetTime: targetTime
        });

        PlayerSystem.save();

        // Refresh UI if forge is open
        if (document.getElementById('active-crafts-container')) {
            if (typeof BuildingSystem !== 'undefined') {
                BuildingSystem.selectBuilding('forge');
            }
        }
    },

    /**
     * Update craft timers (called every second by game loop)
     */
    updateCraftTimers() {
        const container = document.getElementById('active-crafts-container');
        const now = Date.now();
        let completedIndexes = [];

        gameState.activeCrafts.forEach((craft, index) => {
            if (now >= craft.targetTime) {
                completedIndexes.push(index);
            } else if (container) {
                const totalTime = craft.targetTime - craft.startTime;
                const elapsed = now - craft.startTime;
                const pct = (elapsed / totalTime) * 100;
                const remSec = Math.ceil((craft.targetTime - now) / 1000);

                let craftRow = document.getElementById('craft-row-' + craft.id);

                if (!craftRow) {
                    // Create new craft row
                    craftRow = document.createElement('div');
                    craftRow.id = 'craft-row-' + craft.id;
                    craftRow.className = 'card';
                    craftRow.style.padding = '10px';

                    const rushCost = Math.max(1, Math.ceil(remSec / 10));
                    const canRush = (gameState.player.gems || 0) >= rushCost;

                    craftRow.innerHTML = `
                        <div class="flex-between" style="font-size:0.9rem;">
                            <span>${ITEM_CATEGORIES[craft.catId].icon} Crafting ${ITEM_CATEGORIES[craft.catId].name}...</span>
                            <span id="craft-time-${craft.id}">${remSec}s</span>
                        </div>
                        <div class="crafting-progress-bar">
                            <div id="craft-fill-${craft.id}" class="crafting-progress-fill" style="width: ${pct}%"></div>
                        </div>
                        <div style="display:flex; justify-content:flex-end; margin-top:6px;">
                            <button id="rush-btn-${craft.id}" style="font-size:0.75rem; padding:3px 10px; border-color:var(--rarity-epic); color:var(--rarity-epic); ${!canRush ? 'opacity:0.5' : ''}" ${!canRush ? 'disabled' : ''} onclick="ItemSystem.rushCraft('${craft.id}', ${rushCost})">
                                ⚡ Hızlandır (${rushCost}✦)
                            </button>
                        </div>
                    `;

                    container.appendChild(craftRow);

                    const emptyMsg = container.querySelector('em');
                    if (emptyMsg) emptyMsg.remove();
                } else {
                    // Update existing craft row
                    document.getElementById('craft-time-' + craft.id).innerText = remSec + 's';
                    document.getElementById('craft-fill-' + craft.id).style.width = pct + '%';

                    const rushCost = Math.max(1, Math.ceil(remSec / 10));
                    const canRush = (gameState.player.gems || 0) >= rushCost;
                    const rushBtn = document.getElementById('rush-btn-' + craft.id);

                    if (rushBtn) {
                        rushBtn.innerText = `⚡ Hızlandır (${rushCost}✦)`;
                        rushBtn.disabled = !canRush;
                        rushBtn.style.opacity = canRush ? '1' : '0.5';
                        rushBtn.setAttribute('onclick', `ItemSystem.rushCraft('${craft.id}', ${rushCost})`);
                    }
                }
            }
        });

        // Process completions
        if (completedIndexes.length > 0) {
            completedIndexes.sort((a, b) => b - a).forEach(idx => {
                const craft = gameState.activeCrafts[idx];
                gameState.activeCrafts.splice(idx, 1);
                this.generateCompletedItem(craft.catId);
            });

            PlayerSystem.save();

            if (container && typeof BuildingSystem !== 'undefined') {
                BuildingSystem.selectBuilding('forge');
            }
        }
    },

    /**
     * Generate completed item
     */
    generateCompletedItem(catId, isDrop = false, forcedRarity = null) {
        // Check inventory limit
        if (gameState.inventory.length >= 100) {
            UI.showToast("Envanter dolu! Eşya alınamadı.", "error");
            return null;
        }

        const cat = ITEM_CATEGORIES[catId];
        const forgeLevel = gameState.buildings.forge ? gameState.buildings.forge.level : 1;

        let rarity = forcedRarity;

        if (!rarity) {
            const forgeBonus = Math.min(forgeLevel * 500, 5000);
            let roll = Math.floor(Math.random() * 100000) + forgeBonus;

            if (roll >= 99900 && forgeLevel >= 21) rarity = 'mythic';
            else if (roll >= 99000 && forgeLevel >= 11) rarity = 'legendary';
            else if (roll >= 95000 && forgeLevel >= 6) rarity = 'epic';
            else if (roll >= 85000) rarity = 'rare';
            else if (roll >= 60000) rarity = 'uncommon';
            else rarity = 'common';
        }

        // Subtype selection
        let subIdx = 0;
        const r = Math.random();

        if (rarity === 'common' || rarity === 'uncommon') {
            if (r > 0.9) subIdx = 2;
            else if (r > 0.7) subIdx = 1;
            else subIdx = 0;
        } else if (rarity === 'rare' || rarity === 'epic') {
            if (r > 0.8) subIdx = 3;
            else if (r > 0.4) subIdx = 2;
            else if (r > 0.1) subIdx = 1;
            else subIdx = 0;
        } else {
            if (r > 0.4) subIdx = 3;
            else if (r > 0.1) subIdx = 2;
            else subIdx = 1;
        }

        const subtype = cat.subtypes[subIdx];

        // Pattern & Quality
        const patternId = Math.floor(Math.random() * 1000) + 1;
        const qualityScore = Math.random();

        // Stats generation
        const rarityData = RARITIES[rarity];
        const stats = {
            attack: Math.floor((Math.random() * (cat.stats.atk[1] - cat.stats.atk[0]) + cat.stats.atk[0]) * rarityData.mult),
            defense: Math.floor((Math.random() * (cat.stats.def[1] - cat.stats.def[0]) + cat.stats.def[0]) * rarityData.mult),
            magic: Math.floor((Math.random() * (cat.stats.mag[1] - cat.stats.mag[0]) + cat.stats.mag[0]) * rarityData.mult)
        };

        // Create item
        const newItem = {
            id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            category: catId,
            subtype: subtype,
            rarity: rarity,
            patternId: patternId,
            qualityScore: parseFloat(qualityScore.toFixed(4)),
            enchantLevel: 0,
            craftedBy: isDrop ? "Dungeon" : gameState.player.id,
            craftedByName: isDrop ? "Loot Drop" : gameState.player.name,
            craftedAt: Date.now(),
            season: 1,
            tradeHistory: [],
            stats: stats
        };

        // Add to inventory
        if (typeof InventorySystem !== 'undefined') {
            InventorySystem.addToInventory(newItem, !isDrop);
        }

        if (!isDrop) {
            gameState.player.stats.totalItemsCrafted++;

            if (typeof AchievementSystem !== 'undefined') {
                AchievementSystem.check('totalItemsCrafted', gameState.player.stats.totalItemsCrafted);
            }

            if (typeof DailySystem !== 'undefined') {
                DailySystem.trackProgress('crafts', 1);
            }

            // XP gain based on rarity
            const xpValues = { common: 5, uncommon: 10, rare: 25, epic: 50, legendary: 100, mythic: 250 };
            const xpGain = xpValues[rarity] || 5;

            if (typeof LevelSystem !== 'undefined') {
                LevelSystem.addXp(xpGain);
            }

            if (typeof Analytics !== 'undefined') {
                Analytics.trackItemCraft(rarity, catId);
            }
        }

        // Track rare items
        if (rarity === 'legendary' || rarity === 'mythic') {
            if (rarity === 'legendary') {
                gameState.player.stats.legendaryFound++;
                if (typeof AchievementSystem !== 'undefined') {
                    AchievementSystem.check('legendaryFound', gameState.player.stats.legendaryFound);
                }
            }
            if (rarity === 'mythic') {
                gameState.player.stats.mythicFound++;
                if (typeof AchievementSystem !== 'undefined') {
                    AchievementSystem.check('mythicFound', gameState.player.stats.mythicFound);
                }
            }
        }

        PlayerSystem.save();

        // Play reveal animation
        if (!isDrop && typeof window.AudioSystem !== 'undefined') {
            window.AudioSystem.craftReveal();
            this.playRevealAnimation(newItem);
        }

        return newItem;
    },

    /**
     * Rush craft with gems
     */
    rushCraft(craftId, cost) {
        if ((gameState.player.gems || 0) < cost) {
            return UI.showToast("Yetersiz elmas!", "error");
        }

        const idx = gameState.activeCrafts.findIndex(c => c.id === craftId);
        if (idx === -1) return;

        gameState.player.gems -= cost;
        gameState.activeCrafts[idx].targetTime = Date.now() - 1;

        PlayerSystem.updateUI();

        if (typeof AudioSystem !== 'undefined') {
            AudioSystem.success();
        }
    },

    /**
     * Get pattern gradient for item visual
     */
    getPatternGradient(patternId, rarity) {
        const hue1 = (patternId * 137) % 360;
        const hue2 = (hue1 + 40 + (patternId % 60)) % 360;
        const saturation = rarity === 'mythic' ? 90 : rarity === 'legendary' ? 75 : 50;
        return `linear-gradient(${patternId % 180}deg, hsl(${hue1}, ${saturation}%, 15%), hsl(${hue2}, ${saturation}%, 25%))`;
    },

    /**
     * Play item reveal animation
     */
    playRevealAnimation(item) {
        const cat = ITEM_CATEGORIES[item.category];
        const rarityData = RARITIES[item.rarity];
        const gradient = this.getPatternGradient(item.patternId, item.rarity);

        UI.showModal(`
            <div class="craft-reveal-container">
                <h2 class="text-gold">Üretim Tamamlandı</h2>
                <div class="craft-silhouette" style="display:flex; justify-content:center; align-items:center; font-size:4rem; color:#333;">?</div>
                <p class="text-secondary">Eşya ortaya çıkarılıyor...</p>
            </div>
        `, true);

        setTimeout(() => {
            let qualityTextClass = 'text-secondary';
            if (item.qualityScore < 0.01) qualityTextClass = 'text-gold';
            else if (item.qualityScore < 0.1) qualityTextClass = 'text-uncommon';

            const isMythic = item.rarity === 'mythic' ? 'mythic-glow' : '';

            UI.showModal(`
                <div class="craft-reveal-container">
                    <h2 style="color:${rarityData.color}; ${item.rarity === 'mythic' ? 'text-shadow: 0 0 10px red;' : ''}">${rarityData.name} Keşfedildi!</h2>

                    <div class="item-card craft-reveal-item ${isMythic}" style="width: 250px; margin: 20px auto; border-color: ${rarityData.color}; cursor:default;">
                        <div class="item-card-pattern" style="background: ${gradient}; height:120px; font-size:4rem;">${cat.icon}</div>
                        <div class="item-card-body" style="text-align:left;">
                            <div class="item-card-title" style="color:${rarityData.color}; font-size:1.1rem; border-bottom:1px solid #333; padding-bottom:5px; margin-bottom:5px;">${item.subtype}</div>
                            <div style="display:flex; justify-content:space-between;">
                                <span class="text-muted">Desen #${item.patternId}</span>
                                <span style="font-size:0.8rem; color:${item.qualityScore < 0.1 ? 'var(--rarity-uncommon)' : 'var(--text-secondary)'}">Q: ${item.qualityScore}</span>
                            </div>
                            <div style="margin-top: 10px; font-family:var(--font-display);">
                                ${item.stats.attack > 0 ? `<div class="flex-between"><span>ATK</span> <span>${item.stats.attack}</span></div>` : ''}
                                ${item.stats.defense > 0 ? `<div class="flex-between"><span>DEF</span> <span>${item.stats.defense}</span></div>` : ''}
                                ${item.stats.magic > 0 ? `<div class="flex-between"><span>MAG</span> <span>${item.stats.magic}</span></div>` : ''}
                            </div>
                        </div>
                    </div>

                    <button onclick="UI.hideModal(); if(typeof AudioSystem !== 'undefined') AudioSystem.success();" style="margin-top:20px;">Eşyayı Al</button>
                </div>
            `, false);
        }, 1500);
    }
};

// Export for ES6 modules compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ItemSystem;
}
