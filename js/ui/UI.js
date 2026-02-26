/**
 * ===================================
 * UI SYSTEM
 * ===================================
 * User Interface management - Modals, Toasts, View Switching
 */

const UI = {
    gameContainer: null,
    modalContainer: null,
    toastContainer: null,
    currentView: 'town',

    resCells: {
        gold: null,
        iron: null,
        wood: null,
        crystal: null,
        gems: null
    },

    playerName: null,

    /**
     * Initialize UI system
     */
    init() {
        this.gameContainer = document.getElementById('game-container');
        this.modalContainer = document.getElementById('modal-container');
        this.toastContainer = document.getElementById('toast-container');

        // Cache resource cells
        this.resCells = {
            gold: document.getElementById('res-gold'),
            iron: document.getElementById('res-iron'),
            wood: document.getElementById('res-wood'),
            crystal: document.getElementById('res-crystal'),
            gems: document.getElementById('res-gems')
        };

        this.playerName = document.getElementById('player-name');

        // Setup modal close handlers
        if (this.modalContainer) {
            this.modalContainer.addEventListener('click', (e) => {
                if (e.target === this.modalContainer) {
                    this.hideModal();
                }
            });
        }

        Logger.info('UI', 'UI System initialized');
    },

    /**
     * Show modal with content
     */
    showModal(content, preventClose = false) {
        if (!this.modalContainer) return;

        const modalContent = this.modalContainer.querySelector('.modal-content');
        if (modalContent) {
            if (typeof content === 'string') {
                modalContent.innerHTML = content;
            } else {
                modalContent.innerHTML = '';
                modalContent.appendChild(content);
            }
        }

        this.modalContainer.classList.add('active');

        // Store prevent close state
        this.modalContainer.dataset.preventClose = preventClose;

        Logger.debug('UI', 'Modal shown');
    },

    /**
     * Hide modal
     */
    hideModal() {
        if (!this.modalContainer) return;
        if (this.modalContainer.dataset.preventClose === 'true') return;

        this.modalContainer.classList.remove('active');

        Logger.debug('UI', 'Modal hidden');
    },

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        if (!this.toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        this.toastContainer.appendChild(toast);

        // Auto remove after 4 seconds
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 4000);

        Logger.debug('UI', `Toast: ${message}`);
    },

    /**
     * Switch view
     */
    switchView(viewName) {
        const sections = document.querySelectorAll('.view-section');
        sections.forEach(section => {
            section.classList.add('hidden');
        });

        const targetSection = document.getElementById(`${viewName}-view`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }

        // Update nav active state
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.view === viewName) {
                item.classList.add('active');
            }
        });

        this.currentView = viewName;
        Logger.info('UI', `Switched to view: ${viewName}`);
    },

    /**
     * Format number with K, M, B suffixes
     */
    formatNumber(num) {
        if (num >= 1e9) {
            return (num / 1e9).toFixed(2) + 'B';
        }
        if (num >= 1e6) {
            return (num / 1e6).toFixed(2) + 'M';
        }
        if (num >= 1e3) {
            return (num / 1e3).toFixed(2) + 'K';
        }
        return num.toString();
    },

    /**
     * Update resource display
     */
    updateResources() {
        if (typeof gameState !== 'undefined' && gameState.player) {
            const p = gameState.player;
            if (this.resCells.gold) this.resCells.gold.innerText = this.formatNumber(p.gold);
            if (this.resCells.iron) this.resCells.iron.innerText = this.formatNumber(p.iron);
            if (this.resCells.wood) this.resCells.wood.innerText = this.formatNumber(p.wood);
            if (this.resCells.crystal) this.resCells.crystal.innerText = Math.floor(p.crystal);
            if (this.resCells.gems) this.resCells.gems.innerText = this.formatNumber(p.gems);
        }
    },

    /**
     * Show loading overlay
     */
    showLoading(message = 'Loading...') {
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;

        overlay.innerHTML = `
            <div style="text-align: center; color: var(--accent-gold);">
                <div style="font-size: 2rem; margin-bottom: 20px;">⏳</div>
                <div style="font-family: var(--font-display); font-size: 1.2rem;">${message}</div>
            </div>
        `;

        document.body.appendChild(overlay);
    },

    /**
     * Hide loading overlay
     */
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    },

    /**
     * Confirm dialog
     */
    confirm(message, onConfirm, onCancel) {
        this.showModal(`
            <div style="text-align: center; padding: 20px;">
                <h3 style="margin-bottom: 15px; color: var(--accent-gold);">Onay</h3>
                <p style="margin-bottom: 25px; color: var(--text-secondary);">${message}</p>
                <div style="display: flex; gap: 15px;">
                    <button id="btn-confirm-yes" style="flex: 1; background: var(--accent-gold); color: black;">Evet</button>
                    <button id="btn-confirm-no" style="flex: 1;">Hayır</button>
                </div>
            </div>
        `);

        document.getElementById('btn-confirm-yes').addEventListener('click', () => {
            this.hideModal();
            if (onConfirm) onConfirm();
        });

        document.getElementById('btn-confirm-no').addEventListener('click', () => {
            this.hideModal();
            if (onCancel) onCancel();
        });
    },

    /**
     * Alert dialog
     */
    alert(message, onClose) {
        this.showModal(`
            <div style="text-align: center; padding: 20px;">
                <h3 style="margin-bottom: 15px; color: var(--accent-gold);">Bilgi</h3>
                <p style="margin-bottom: 25px; color: var(--text-secondary);">${message}</p>
                <button id="btn-alert-ok" style="width: 100%; background: var(--accent-gold); color: black;">Tamam</button>
            </div>
        `);

        document.getElementById('btn-alert-ok').addEventListener('click', () => {
            this.hideModal();
            if (onClose) onClose();
        });
    },

    /**
     * Scroll to top
     */
    scrollToTop() {
        const mainView = document.getElementById('main-view');
        if (mainView) {
            mainView.scrollTop = 0;
        }
    },

    /**
     * Animate number count
     */
    animateNumber(element, start, end, duration) {
        const startTime = performance.now();
        const diff = end - start;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out quart
            const eased = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(start + diff * eased);

            element.textContent = this.formatNumber(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }
};

// Export for ES6 modules compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UI;
}
