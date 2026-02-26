/**
 * ===================================
 * CHAT SYSTEM
 * ===================================
 * Chat panel, messaging, channels
 * 
 * Dependencies: StorageAPI, UI, Utils, PlayerSystem
 */

const ChatSystem = {
    messages: [],
    isPanelOpen: false,
    currentChannel: 'Global',
    unsub: null,
    MAX_MESSAGES: 100,
    MESSAGE_EXPIRY_MS: 3 * 60 * 1000, // 3 minutes
    cleanupInterval: null,
    lastReadMessageId: null,
    unreadCount: 0,

    /**
     * Initialize chat system
     */
    init() {
        this.messages = [];
        this.lastReadMessageId = null;
        this.unreadCount = 0;

        this.render();

        if (window.FB) {
            this.loadRecentMessages();
            this.setupRealTimeListener();
        }

        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredMessages();
        }, 30000);

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'c' || e.key === 'C') {
                if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                    this.togglePanel();
                }
            }
            if (e.key === 'Escape' && this.isPanelOpen) {
                this.togglePanel();
            }
        });
    },

    /**
     * Load recent messages
     */
    async loadRecentMessages() {
        try {
            const chatRef = window.FB.collection(
                window.FB.db,
                'shared_data',
                'global',
                'chat-messages'
            );

            const q = window.FB.query(
                chatRef,
                window.FB.orderBy('timestamp', 'desc'),
                window.FB.limit(this.MAX_MESSAGES)
            );

            const snapshot = await window.FB.getDocs(q);
            const now = Date.now();

            this.messages = [];
            snapshot.forEach(doc => {
                const msg = doc.data();
                if ((now - msg.timestamp) < this.MESSAGE_EXPIRY_MS) {
                    this.messages.unshift(msg);
                }
            });

            this.updateUnreadCount();
            this.render();
        } catch (e) {
            console.error('Failed to load chat messages:', e);
        }
    },

    /**
     * Setup real-time listener
     */
    setupRealTimeListener() {
        const chatRef = window.FB.collection(
            window.FB.db,
            'shared_data',
            'global',
            'chat-messages'
        );

        const q = window.FB.query(
            chatRef,
            window.FB.where('timestamp', '>', this.lastMessageTimestamp || 0),
            window.FB.orderBy('timestamp', 'asc')
        );

        this.unsub = window.FB.onSnapshot(q, (snapshot) => {
            const now = Date.now();
            let hasNewMessages = false;

            snapshot.forEach(doc => {
                const msg = doc.data();
                if ((now - msg.timestamp) < this.MESSAGE_EXPIRY_MS &&
                    !this.messages.find(m => m.id === msg.id)) {
                    this.messages.push(msg);
                    hasNewMessages = true;
                }
            });

            if (this.messages.length > this.MAX_MESSAGES) {
                this.messages = this.messages.slice(this.messages.length - this.MAX_MESSAGES);
            }

            if (hasNewMessages) {
                this.updateUnreadCount();
                this.render();
            }
        });
    },

    /**
     * Update unread count
     */
    updateUnreadCount() {
        if (!this.lastReadMessageId) {
            this.unreadCount = 0;
        } else {
            const lastReadIndex = this.messages.findIndex(msg => msg.id === this.lastReadMessageId);
            if (lastReadIndex === -1) {
                this.unreadCount = 0;
            } else {
                this.unreadCount = this.messages.length - lastReadIndex - 1;
            }
        }
        this.updateFabBadge();
    },

    /**
     * Update FAB badge
     */
    updateFabBadge() {
        const badge = document.getElementById('chat-badge');
        if (badge) {
            if (this.unreadCount > 0) {
                badge.style.display = 'block';
                badge.textContent = Math.min(99, this.unreadCount);
            } else {
                badge.style.display = 'none';
            }
        }
    },

    /**
     * Toggle chat panel
     */
    togglePanel() {
        const panel = document.getElementById('chat-side-panel');
        const overlay = document.getElementById('chat-overlay');

        if (!panel || !overlay) return;

        this.isPanelOpen = !this.isPanelOpen;

        if (this.isPanelOpen) {
            panel.classList.add('active');
            overlay.classList.add('active');
            this.markAsRead();
            this.scrollToBottom();
        } else {
            panel.classList.remove('active');
            overlay.classList.remove('active');
        }
    },

    /**
     * Mark messages as read
     */
    markAsRead() {
        if (this.messages.length > 0) {
            this.lastReadMessageId = this.messages[this.messages.length - 1].id;
            this.unreadCount = 0;
            this.updateFabBadge();
        }
    },

    /**
     * Set channel
     */
    setChannel(channel, btn) {
        this.currentChannel = channel;

        document.querySelectorAll('.chat-channel-btn').forEach(b => {
            b.classList.remove('active');
        });

        if (btn) {
            btn.classList.add('active');
        }
    },

    /**
     * Send message
     */
    async sendMessage() {
        const input = document.getElementById('chat-input');
        if (!input) return;

        const text = input.value.trim();
        if (!text || !gameState.player) return;

        input.value = '';

        const message = {
            id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            playerId: gameState.player.id,
            playerName: gameState.player.name,
            text: text,
            timestamp: Date.now(),
            channel: this.currentChannel
        };

        try {
            const msgRef = window.FB.doc(
                window.FB.db,
                `shared_data/global/chat-messages/${message.id}`
            );

            await window.FB.setDoc(msgRef, message);

            this.messages.push(message);

            if (this.messages.length > this.MAX_MESSAGES) {
                this.messages = this.messages.slice(this.messages.length - this.MAX_MESSAGES);
            }

            this.render();
            this.scrollToBottom();
        } catch (e) {
            console.error('Failed to send message:', e);
            UI.showToast('Mesaj gönderilemedi.', 'error');
            input.value = text; // Restore text
        }
    },

    /**
     * Cleanup expired messages
     */
    cleanupExpiredMessages() {
        const now = Date.now();
        const beforeCount = this.messages.length;

        this.messages = this.messages.filter(msg =>
            (now - msg.timestamp) < this.MESSAGE_EXPIRY_MS
        );

        if (this.messages.length !== beforeCount) {
            this.render();
        }
    },

    /**
     * Render chat messages
     */
    render() {
        const container = document.getElementById('chat-panel-messages');
        if (!container) return;

        if (this.messages.length === 0) {
            container.innerHTML = `
                <div class="chat-empty-state">
                    <div class="chat-empty-state-icon">💬</div>
                    <div>Henüz mesaj yok</div>
                </div>
            `;
            return;
        }

        container.innerHTML = this.messages.map(msg => {
            const time = new Date(msg.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
                <div class="chat-message">
                    <div class="chat-msg-header">
                        <span class="chat-msg-author">${msg.playerName}</span>
                        <span class="chat-msg-time">${time}</span>
                    </div>
                    <div class="chat-msg-text">${this.escapeHtml(msg.text)}</div>
                </div>
            `;
        }).join('');
    },

    /**
     * Scroll to bottom
     */
    scrollToBottom() {
        const container = document.getElementById('chat-panel-messages');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    },

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Destroy chat system (cleanup)
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }

        if (this.unsub) {
            this.unsub();
            this.unsub = null;
        }
    }
};

// Export for ES6 modules compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatSystem;
}
