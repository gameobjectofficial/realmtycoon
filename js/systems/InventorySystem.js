/**
 * ===================================
 * INVENTORY SYSTEM
 * ===================================
 * Inventory management, item display, filtering, sorting
 * 
 * Dependencies: ITEM_CATEGORIES, RARITIES, EQUIP_SLOTS, CHEST_TIERS,
 *               ItemSystem, HeroSystem, UI, LangSys, Logger, PlayerSystem
 */

const InventorySystem = {
    currentFilter: 'all',
    currentSort: 'newest',

    /**
     * Render inventory (modal and full view)
     */
    render() {
        this.renderModal();
        this.renderFullView();
    },

    /**
     * Render inventory modal
     */
    renderModal() {
        const grid = document.getElementById('inventory-grid-modal');
        if (!grid) return;

        grid.innerHTML = '';

        if (gameState.inventory.length === 0) {
            grid.innerHTML = '<span class="text-muted" style="grid-column: 1/-1; text-align:center; padding:20px;">Envanter boş.</span>';
            return;
        }

        const items = [...gameState.inventory].sort((a, b) => b.craftedAt - a.craftedAt);

        items.forEach(item => {
            const rarityData = RARITIES[item.rarity];
            const gradient = ItemSystem.getPatternGradient(item.patternId, item.rarity);
            const isMythic = item.rarity === 'mythic' ? 'mythic-glow' : '';
            const stars = item.enchantLevel > 0 ? '✦'.repeat(item.enchantLevel) : '';

            const card = document.createElement('div');
            card.className = `item-card ${isMythic}`;
            card.style.borderColor = rarityData.color;
            card.onclick = () => {
                UI.hideModal();
                this.showItemDetails(item);
            };

            card.innerHTML = `
                <div class="item-card-pattern" style="background: ${gradient}; height:80px; font-size:2.5rem;">
                    ${ITEM_CATEGORIES[item.category]?.icon || '❓'}
                </div>
                <div class="item-card-body">
                    <div class="item-card-title" style="color:${rarityData.color}; font-size:0.85rem;">${item.subtype}</div>
                    <div style="font-size:0.7rem;" class="text-gold">${stars}</div>
                </div>
            `;

            grid.appendChild(card);
        });
    },

    /**
     * Render full inventory view
     */
    renderFullView() {
        // Reset new item badge when inventory is viewed
        if (gameState.player) {
            gameState.player.newItemCount = 0;
        }

        if (typeof UI !== 'undefined' && UI.updateNavBadges) {
            UI.updateNavBadges();
        }

        const container = document.getElementById('view-inventory');
        if (!container) return;

        // Update count
        const countDisplay = document.getElementById('inventory-count-display');
        if (countDisplay) {
            countDisplay.textContent = `${gameState.inventory.length}/100`;
        }

        const grid = document.getElementById('inventory-grid-full');
        if (!grid) return;

        if (gameState.inventory.length === 0) {
            grid.innerHTML = '<span class="text-muted" style="grid-column: 1/-1; text-align:center; padding:40px; font-size:1.2rem;">Heybendeki eşyalar bitti. Maceraya devam et!</span>';
            return;
        }

        // Get current filter and sort
        const currentFilter = this.currentFilter || 'all';
        const currentSort = this.currentSort || 'newest';

        // Filter items
        let items = [...gameState.inventory];

        if (currentFilter !== 'all') {
            const matchingCategories = Object.keys(ITEM_CATEGORIES).filter(
                key => EQUIP_SLOTS[key] === currentFilter
            );
            items = items.filter(item =>
                item.category === currentFilter ||
                EQUIP_SLOTS[item.category] === currentFilter ||
                matchingCategories.includes(item.category)
            );
        }

        // Sort items
        if (currentSort === 'newest') {
            items.sort((a, b) => b.craftedAt - a.craftedAt);
        } else if (currentSort === 'rarity') {
            const rarityOrder = { mythic: 6, legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
            items.sort((a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity]);
        } else if (currentSort === 'enchant') {
            items.sort((a, b) => b.enchantLevel - a.enchantLevel);
        }

        if (items.length === 0) {
            grid.innerHTML = '<span class="text-muted" style="grid-column: 1/-1; text-align:center; padding:40px;">Bu kategoride eşya yok.</span>';
            return;
        }

        // Render items
        grid.innerHTML = '';

        items.forEach(item => {
            const card = document.createElement('div');

            if (item.category === 'chest') {
                const chestTier = CHEST_TIERS[item.chestTier];
                card.className = 'inv-item-card chest-item';
                card.style.borderColor = chestTier.color;
                card.style.background = `linear-gradient(135deg, rgba(${this.hexToRgb(chestTier.color)}, 0.15), rgba(30, 30, 40, 0.9))`;
                card.onclick = () => {
                    if (typeof ChestSystem !== 'undefined') {
                        ChestSystem.showChestDetails(item);
                    }
                };
                card.innerHTML = `
                    <div class="inv-item-icon" style="font-size:2.5rem; filter: drop-shadow(0 0 10px ${chestTier.color});">${chestTier.icon}</div>
                    <div class="inv-item-name" style="font-size:0.7rem; color:${chestTier.color}; font-weight:700;">${chestTier.name.split(' ')[0]}</div>
                `;
            } else {
                const rarityData = RARITIES[item.rarity];
                const isMythic = item.rarity === 'mythic' ? 'mythic-glow' : '';
                const stars = item.enchantLevel > 0 ? '✦'.repeat(item.enchantLevel) : '';
                const icon = ITEM_CATEGORIES[item.category]?.icon || '❓';

                card.className = `inv-item-card ${item.rarity} ${isMythic}`;
                card.style.borderColor = rarityData.color;
                card.onclick = () => {
                    this.showItemDetails(item);
                };

                card.innerHTML = `
                    <div class="inv-item-icon">${icon}</div>
                    <div class="inv-item-enchant">${stars}</div>
                    <div class="inv-item-rarity">${item.rarity.charAt(0).toUpperCase()}</div>
                `;
            }

            grid.appendChild(card);
        });
    },

    /**
     * Set filter and re-render
     */
    setFilter(filter) {
        this.currentFilter = filter;
        this.renderFullView();
        this.updateTabActiveState();
    },

    /**
     * Set sort and re-render
     */
    setSort(sort) {
        this.currentSort = sort;
        this.renderFullView();
    },

    /**
     * Update tab active state
     */
    updateTabActiveState() {
        document.querySelectorAll('.inv-tab').forEach(tab => {
            tab.classList.remove('active');
            const tabText = tab.textContent.toUpperCase();

            if (
                (this.currentFilter === 'all' && tabText.includes('TÜM')) ||
                (this.currentFilter === 'weapon' && tabText.includes('SİLAH')) ||
                (this.currentFilter === 'armor' && tabText.includes('ZIRH')) ||
                (this.currentFilter === 'ring' && tabText.includes('YÜZÜK')) ||
                (this.currentFilter === 'amulet' && tabText.includes('TILSIM'))
            ) {
                tab.classList.add('active');
            }
        });
    },

    /**
     * Show item details modal
     */
    showItemDetails(item, isEnchanting = false, isEquipped = false) {
        if (!item) {
            console.warn('showItemDetails called with null item');
            return UI.showToast("Eşya bulunamadı.", "error");
        }

        // Check if item is a chest
        if (item.category === 'chest') {
            if (typeof ChestSystem !== 'undefined') {
                ChestSystem.showChestDetails(item);
            }
            return;
        }

        const cat = ITEM_CATEGORIES[item.category];
        const rarityData = RARITIES[item.rarity];
        const gradient = ItemSystem.getPatternGradient(item.patternId, item.rarity);
        const isMythic = item.rarity === 'mythic' ? 'mythic-glow' : '';

        // Check if item is equipped
        const slot = EQUIP_SLOTS[item.category];
        const eq = gameState.player?.heroEquipped || {};
        const actuallyEquipped = isEquipped || (slot && eq[slot] && eq[slot].id === item.id);

        const modalHtml = `
            <div style="display:flex; flex-direction:column; align-items:center;">
                <h2 style="color:${rarityData.color}; ${item.rarity === 'mythic' ? 'text-shadow: 0 0 10px red;' : ''} margin-bottom: 20px;">
                    ${item.enchantLevel > 0 ? `+${item.enchantLevel} ` : ''}${item.subtype}
                </h2>

                <div class="item-card ${isMythic}" style="width: 250px; border-color: ${rarityData.color}; cursor:default; margin-bottom: 20px;">
                    <div class="item-card-pattern" style="background: ${gradient}; height:120px; font-size:4rem;">
                        ${cat.icon}
                    </div>
                    <div class="item-card-body" style="text-align:left;">
                        <div style="display:flex; justify-content:space-between; border-bottom:1px solid #333; padding-bottom:5px; margin-bottom:5px;">
                            <span class="text-muted">Desen #${item.patternId}</span>
                            <span style="font-size:0.8rem; color:${item.qualityScore < 0.1 ? 'var(--rarity-uncommon)' : 'var(--text-secondary)'}">Q: ${item.qualityScore.toFixed(4)}</span>
                        </div>
                        <div style="margin-top: 10px; font-family:var(--font-display); font-size:1.1rem;">
                            ${item.stats.attack > 0 ? `<div class="flex-between"><span>ATK</span> <span class="text-gold">${this.applyEnchantMult(item.stats.attack, item.enchantLevel)}</span></div>` : ''}
                            ${item.stats.defense > 0 ? `<div class="flex-between"><span>DEF</span> <span class="text-gold">${this.applyEnchantMult(item.stats.defense, item.enchantLevel)}</span></div>` : ''}
                            ${item.stats.magic > 0 ? `<div class="flex-between"><span>MAG</span> <span class="text-gold">${this.applyEnchantMult(item.stats.magic, item.enchantLevel)}</span></div>` : ''}
                        </div>
                    </div>
                </div>

                <div style="width: 100%; border-top: var(--border-subtle); padding-top: 15px; text-align: left; font-size: 0.9rem; color: var(--text-secondary)">
                    <div class="flex-between" style="margin-bottom:5px;"><span>Nadirlik:</span> <strong style="color:${rarityData.color}">${rarityData.name}</strong></div>
                    <div class="flex-between" style="margin-bottom:5px;"><span>Üreten:</span> <span>${item.craftedByName}</span></div>
                    <div class="flex-between" style="margin-bottom:5px;"><span>Tarih:</span> <span>${new Date(item.craftedAt).toLocaleDateString()}</span></div>
                </div>

                <div style="display:flex; gap: 10px; width: 100%; margin-top: 20px; flex-wrap:wrap;">
                    ${actuallyEquipped ? '' : `<button style="flex:1; min-width:120px;" onclick="if(typeof MarketplaceSystem !== 'undefined') MarketplaceSystem.showListingModal('${item.id}')">Pazarda Sat</button>`}
                    ${slot ? `<button style="flex:1; min-width:120px; background:${actuallyEquipped ? 'var(--rarity-mythic)' : 'var(--rarity-rare)'}; color:white;" onclick="InventorySystem.equipCurrentItem(${actuallyEquipped ? `'${slot}'` : `'${item.id}'`}, ${actuallyEquipped})">${actuallyEquipped ? LangSys.get('unequip') : LangSys.get('equip_hero')}</button>` : ''}
                </div>
            </div>
        `;

        UI.showModal(modalHtml);
    },

    /**
     * Get equipped item
     */
    getEquippedItem(slot) {
        return gameState.player?.heroEquipped?.[slot] || null;
    },

    /**
     * Equip/unequip item
     */
    equipCurrentItem(idOrSlot, isEquipped = false) {
        const item = isEquipped ? this.getEquippedItem(idOrSlot) : this.getItem(idOrSlot);
        if (!item) {
            return UI.showToast("Eşya bulunamadı.", "error");
        }

        if (typeof HeroSystem !== 'undefined') {
            HeroSystem.toggleEquip(item);
        }
    },

    /**
     * Get item by ID
     */
    getItem(id) {
        const item = gameState.inventory.find(i => i && i.id === id);
        if (!item) {
            console.warn(`Item not found: ${id}`);
            return null;
        }
        return item;
    },

    /**
     * Add item to inventory
     */
    addToInventory(item, incrementBadge = true) {
        if (!item || !item.id) {
            console.error('addToInventory: Invalid item');
            return false;
        }

        // Check for duplicates
        const exists = gameState.inventory.some(i => i && i.id === item.id);
        if (exists) {
            console.warn(`addToInventory: Item ${item.id} already exists`);
            return false;
        }

        // Check inventory limit
        if (gameState.inventory.length >= 100) {
            UI.showToast("Envanter dolu!", "error");
            return false;
        }

        gameState.inventory.push(item);

        if (incrementBadge && gameState.player) {
            gameState.player.newItemCount = (gameState.player.newItemCount || 0) + 1;
        }

        this.render();
        return true;
    },

    /**
     * Remove item from inventory
     */
    removeFromInventory(itemId) {
        if (!itemId) {
            console.error('removeFromInventory: No item ID provided');
            return false;
        }

        const idx = gameState.inventory.findIndex(i => i && i.id === itemId);
        if (idx === -1) {
            console.warn(`removeFromInventory: Item ${itemId} not found`);
            return false;
        }

        gameState.inventory.splice(idx, 1);
        this.render();
        return true;
    },

    /**
     * Apply enchant multiplier to stat
     */
    applyEnchantMult(baseStat, level) {
        if (level === 0) return baseStat;
        return Math.floor(baseStat * Math.pow(1.15, level));
    },

    /**
     * Helper: Convert hex to RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ?
            `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
            '255, 255, 255';
    }
};

// Export for ES6 modules compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InventorySystem;
}
