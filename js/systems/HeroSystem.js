/**
 * ===================================
 * HERO SYSTEM
 * ===================================
 * Hero equipment management and statistics display
 * 
 * Dependencies: EQUIP_SLOTS, ITEM_CATEGORIES, RARITIES, 
 *               InventorySystem, UI, LangSys, LevelSystem, PlayerSystem
 */

const HeroSystem = {
    /**
     * Toggle equipment for an item
     */
    toggleEquip(item) {
        if (!item) return;

        const slot = EQUIP_SLOTS[item.category];
        if (!slot) {
            return UI.showToast("This item cannot be equipped.", 'error');
        }

        if (!gameState.player.heroEquipped) {
            gameState.player.heroEquipped = {
                weapon: null,
                armor: null,
                ring: null,
                amulet: null
            };
        }

        const current = gameState.player.heroEquipped[slot];

        if (current && current.id === item.id) {
            // Unequip: Return item to inventory
            gameState.player.heroEquipped[slot] = null;
            InventorySystem.addToInventory(item, true);
            UI.showToast(`${item.subtype} çıkarıldı.`, 'info');
        } else {
            // Equip: First return current equipped item to inventory (if any)
            if (current) {
                gameState.player.heroEquipped[slot] = null;
                InventorySystem.addToInventory(current, true);
                UI.showToast(`${current.subtype} çıkarıldı, ${item.subtype} giyildi.`, 'info');
            } else {
                UI.showToast(`${item.subtype} kuşanıldı!`, 'success');
            }
            // Then equip new item
            InventorySystem.removeFromInventory(item.id);
            gameState.player.heroEquipped[slot] = item;
        }

        UI.hideModal();
        PlayerSystem.save();

        // Refresh UI - re-render enchant tower if open
        const enchantArea = document.getElementById('enchant-main-area');
        if (enchantArea && EnchantSystem.currentItem) {
            EnchantSystem.setupEnchantView(EnchantSystem.currentItem);
        }

        // Refresh hero view if open
        const heroView = document.getElementById('hero-view-content');
        if (heroView) {
            this.renderFullView();
        }

        // Refresh forge/enchant tower view if open
        const viewTitle = document.getElementById('view-title');
        if (viewTitle && viewTitle.innerText.includes('Büyücü')) {
            if (typeof BuildingSystem !== 'undefined') {
                BuildingSystem.selectBuilding('enchant_tower');
            }
        }
    },

    /**
     * Show equipped item details
     */
    showEquippedItem(slot) {
        const item = gameState.player.heroEquipped[slot];
        if (!item) return;

        // Pass item directly with a flag indicating it's equipped
        if (typeof InventorySystem !== 'undefined') {
            InventorySystem.showItemDetails(item, false, true);
        }
    },

    /**
     * Render equipment panel HTML
     */
    renderEquipPanel() {
        const eq = gameState.player.heroEquipped || {};
        const slots = ['weapon', 'armor', 'ring', 'amulet'];
        const slotIcons = {
            weapon: '⚔️',
            armor: '🛡️',
            ring: '💍',
            amulet: '📿'
        };

        let bonusAtk = 0, bonusDef = 0, bonusMag = 0;

        let html = `<h4 class="text-gold" style="margin-bottom:12px;">Kahraman Ekipmanı</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;">`;

        slots.forEach(slot => {
            const item = eq[slot];

            if (item) {
                const effAtk = this.applyEnchantMult(item.stats.attack, item.enchantLevel || 0);
                const effDef = this.applyEnchantMult(item.stats.defense, item.enchantLevel || 0);
                const effMag = this.applyEnchantMult(item.stats.magic, item.enchantLevel || 0);

                bonusAtk += effAtk;
                bonusDef += effDef;
                bonusMag += effMag;

                const rarityData = RARITIES[item.rarity];

                html += `
                    <div class="equip-slot filled" style="border-color:${rarityData.color};" onclick="HeroSystem.showEquippedItem('${slot}')">
                        <div style="font-size:1.4rem;">${ITEM_CATEGORIES[item.category]?.icon || '❓'}</div>
                        <div style="font-size:0.7rem; color:${rarityData.color}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:80px;">${item.subtype}</div>
                        <div style="font-size:0.65rem; color:var(--text-muted);">${slotIcons[slot]}</div>
                    </div>
                `;
            } else {
                html += `
                    <div class="equip-slot">
                        <div style="font-size:1.4rem; color:#444;">${slotIcons[slot]}</div>
                        <div style="font-size:0.75rem; color:var(--text-muted);">${slotIcons[slot]}</div>
                        <div style="font-size:0.7rem; color:#333;">Boş</div>
                    </div>
                `;
            }
        });

        html += `</div>`;

        if (bonusAtk > 0 || bonusDef > 0 || bonusMag > 0) {
            html += `
                <div style="background:var(--bg-secondary); padding:10px; border-radius:6px; font-size:0.85rem; border:var(--border-subtle);">
                    <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:5px;">Ekipman Bonusları:</div>
                    ${bonusAtk > 0 ? `<div class="flex-between"><span>ATK</span><span class="text-gold">+${bonusAtk}</span></div>` : ''}
                    ${bonusDef > 0 ? `<div class="flex-between"><span>DEF</span><span class="text-gold">+${bonusDef}</span></div>` : ''}
                    ${bonusMag > 0 ? `<div class="flex-between"><span>MAG</span><span class="text-gold">+${bonusMag}</span></div>` : ''}
                </div>
            `;
        }

        return html;
    },

    /**
     * Apply enchant multiplier to stat
     */
    applyEnchantMult(baseStat, level) {
        if (level === 0) return baseStat;
        return Math.floor(baseStat * Math.pow(1.15, level));
    },

    /**
     * Render full hero view
     */
    renderFullView() {
        const container = document.getElementById('hero-view-content');
        if (!container) return;

        const player = gameState.player;
        const xpRequired = LevelSystem.getXpRequired(player.level);
        const xpProgress = LevelSystem.getXpProgress();

        let html = `
            <div class="card" style="padding: 30px;">
                ${this.renderEquipPanel()}
            </div>

            <div class="card" style="padding: 30px;">
                <h4 class="text-gold" style="margin-bottom: 20px;">Kahraman İstatistikleri</h4>
                <div style="display:flex; flex-direction:column; gap:15px;">
                    <div class="flex-between">
                        <span>Seviye:</span>
                        <strong class="text-gold">${player.level || 1}</strong>
                    </div>

                    <div style="padding:8px 0;">
                        <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:4px;">
                            <span style="color:var(--text-secondary);">Tecrübe</span>
                            <span style="color:var(--accent-gold);">${player.xp || 0} / ${xpRequired} XP</span>
                        </div>
                        <div style="width:100%; height:10px; background:#222; border-radius:5px; overflow:hidden;">
                            <div style="height:100%; background:linear-gradient(to right, var(--accent-gold), var(--accent-gold-bright)); width:${xpProgress}%; transition:width 0.3s;"></div>
                        </div>
                    </div>

                    <div class="flex-between">
                        <span>Canavarlar:</span>
                        <strong class="text-gold">${player.stats.monstersKilled || 0}</strong>
                    </div>

                    <div class="flex-between">
                        <span>Eşyalar:</span>
                        <strong class="text-gold">${player.stats.totalItemsCrafted || 0}</strong>
                    </div>

                    <div class="flex-between">
                        <span>Efsaneviler:</span>
                        <strong style="color:var(--rarity-legendary)">${player.stats.legendaryFound || 0}</strong>
                    </div>

                    <div class="flex-between">
                        <span>Büyü Başarısı:</span>
                        <strong class="text-uncommon">${((player.stats.enchantSuccesses / (player.stats.totalEnchants || 1)) * 100).toFixed(1)}%</strong>
                    </div>
                </div>

                ${typeof AchievementSystem !== 'undefined' ? `
                    <div style="margin-top: 30px;">
                        ${AchievementSystem.renderPanel()}
                    </div>
                ` : ''}
            </div>
        `;

        container.innerHTML = html;
    },

    /**
     * Get total stats including equipment
     */
    getTotalStats() {
        const player = gameState.player;
        if (!player) return { atk: 0, def: 0, mag: 0, hp: 100 };

        const baseAtk = LevelSystem.getBaseAtk(player.level);
        const baseHp = LevelSystem.getMaxHp(player.level);

        let bonusAtk = 0, bonusDef = 0, bonusMag = 0;

        const eq = player.heroEquipped || {};
        for (const slot in eq) {
            const item = eq[slot];
            if (item) {
                bonusAtk += this.applyEnchantMult(item.stats.attack, item.enchantLevel || 0);
                bonusDef += this.applyEnchantMult(item.stats.defense, item.enchantLevel || 0);
                bonusMag += this.applyEnchantMult(item.stats.magic, item.enchantLevel || 0);
            }
        }

        return {
            atk: baseAtk + bonusAtk,
            def: bonusDef,
            mag: bonusMag,
            hp: baseHp
        };
    }
};

// Export for ES6 modules compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeroSystem;
}
