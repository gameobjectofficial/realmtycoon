/**
 * ===================================
 * DAILY SYSTEM
 * ===================================
 * Daily quests, login streaks, progress tracking
 * 
 * Dependencies: DAILY_QUESTS, STREAK_REWARDS, PlayerSystem, UI, LangSys, AudioSystem
 */

const DailySystem = {
    /**
     * Check login streak and award rewards
     */
    checkLoginStreak() {
        const p = gameState.player;
        if (!p || !p.dailyData) return;

        const d = p.dailyData;
        const now = Date.now();
        const todayMidnight = new Date();
        todayMidnight.setHours(0, 0, 0, 0);
        const todayStamp = todayMidnight.getTime();

        const lastLoginMidnight = d.lastLogin ? new Date(d.lastLogin) : null;
        if (lastLoginMidnight) {
            lastLoginMidnight.setHours(0, 0, 0, 0);
        }
        const lastStamp = lastLoginMidnight ? lastLoginMidnight.getTime() : 0;
        const yesterday = todayStamp - 86400000;

        // Already logged in today
        if (lastStamp === todayStamp) return;

        // Calculate streak
        if (lastStamp === yesterday) {
            d.streakCount = (d.streakCount || 0) + 1;
        } else if (lastStamp < yesterday) {
            d.streakCount = 1; // Streak broken
        }

        d.lastLogin = now;
        const dayIdx = ((d.streakCount - 1) % 7);
        const reward = STREAK_REWARDS[dayIdx];

        // Apply reward
        for (const [res, amt] of Object.entries(reward)) {
            p[res] = (p[res] || 0) + amt;
        }

        // Reset daily quests if new day
        if (!d.lastQuestsReset || d.lastQuestsReset < todayStamp) {
            d.questsProgress = { kills: 0, crafts: 0, sells: 0, enchants: 0 };
            d.questsCompleted = [];
            d.lastQuestsReset = todayStamp;
        }

        PlayerSystem.save();
        PlayerSystem.updateUI();

        // Show reward modal
        const rewardText = Object.entries(reward)
            .map(([k, v]) => `+${v} ${LangSys.get('res_' + k) || k}`)
            .join(', ');

        UI.showModal(`
            <div style="text-align:center;">
                <h2 class="text-gold" style="margin-bottom:10px;">${LangSys.get('streak_reward')}</h2>
                <div style="font-size:3rem; margin-bottom:10px;">🔥</div>
                <p style="color:var(--rarity-legendary); font-size:1.3rem; margin-bottom:5px;">
                    ${LangSys.get('streak_day')} ${d.streakCount}
                </p>
                ${d.streakCount % 7 === 0 ? 
                    '<p style="color:var(--rarity-mythic); font-weight:bold;">⭐ Haftalık Bonus Tamamlandı!</p>' : 
                    ''}
                <div style="background:var(--bg-tertiary); padding:15px; border-radius:8px; margin:15px 0; border:1px solid var(--accent-gold);">
                    <strong>${rewardText}</strong>
                </div>
                <button style="width:100%; margin-top:10px; background:var(--accent-gold); color:black;" onclick="UI.hideModal()">Al!</button>
            </div>
        `);

        if (typeof AudioSystem !== 'undefined') {
            AudioSystem.achievement();
        }
    },

    /**
     * Track progress for daily quests
     */
    trackProgress(type, amount) {
        const p = gameState.player;
        if (!p || !p.dailyData) return;

        const d = p.dailyData;
        const now = Date.now();
        const todayMidnight = new Date();
        todayMidnight.setHours(0, 0, 0, 0);

        // Reset if day changed
        if (!d.lastQuestsReset || d.lastQuestsReset < todayMidnight.getTime()) {
            d.questsProgress = { kills: 0, crafts: 0, sells: 0, enchants: 0 };
            d.questsCompleted = [];
            d.lastQuestsReset = todayMidnight.getTime();
        }

        if (!d.questsProgress) {
            d.questsProgress = { kills: 0, crafts: 0, sells: 0, enchants: 0 };
        }

        d.questsProgress[type] = (d.questsProgress[type] || 0) + amount;

        // Check quest completion
        DAILY_QUESTS.forEach(q => {
            if (!d.questsCompleted.includes(q.id) && d.questsProgress[q.reqKey] >= q.target) {
                d.questsCompleted.push(q.id);
                p[q.rewardKey] = (p[q.rewardKey] || 0) + q.rewardAmt;

                PlayerSystem.updateUI();

                const questName = LangSys.get(q.nameKey) || q.id;
                UI.showToast(
                    `✅ ${LangSys.get('daily_quests')}: ${questName} — +${q.rewardAmt} ${LangSys.get('res_' + q.rewardKey) || q.rewardKey}`,
                    'success'
                );
            }
        });

        // All quests bonus
        if (d.questsCompleted.length === DAILY_QUESTS.length && !d.allQuestsBonusClaimed) {
            d.allQuestsBonusClaimed = true;
            p.gems = (p.gems || 0) + 3;

            PlayerSystem.updateUI();

            UI.showToast(`🌟 ${LangSys.get('quests_complete')} +3✦`, 'achievement');

            if (typeof AudioSystem !== 'undefined') {
                AudioSystem.achievement();
            }
        }
    },

    /**
     * Render quest panel
     */
    renderQuestPanel() {
        const p = gameState.player;
        if (!p || !p.dailyData) {
            return '<em class="text-muted">Giriş gerekli.</em>';
        }

        const d = p.dailyData;
        const streak = d.streakCount || 0;

        let html = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <h4 class="text-gold">${LangSys.get('daily_quests')}</h4>
                <span style="color:var(--rarity-legendary); font-family:var(--font-display);">
                    🔥 ${LangSys.get('login_streak')}: ${streak}
                </span>
            </div>
        `;

        DAILY_QUESTS.forEach(q => {
            const done = d.questsCompleted && d.questsCompleted.includes(q.id);
            const progress = (d.questsProgress && d.questsProgress[q.reqKey]) || 0;
            const pct = Math.min(100, (progress / q.target) * 100);
            const questName = LangSys.get(q.nameKey) || q.id;

            html += `
                <div class="quest-item ${done ? 'done' : 'active'}">
                    <div>
                        <div style="font-size:0.9rem; ${done ? 'text-decoration:line-through; color:var(--text-muted)' : ''}">
                            ${done ? '✅ ' : ''}${questName}
                        </div>
                        ${!done ? `
                            <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:3px;">
                                ${progress}/${q.target}
                            </div>
                        ` : ''}
                    </div>
                    <div style="text-align:right; font-size:0.8rem; color:var(--accent-gold);">
                        +${q.rewardAmt} ${LangSys.get('res_' + q.rewardKey) || q.rewardKey}
                    </div>
                </div>
            `;
        });

        // Next streak reward preview
        const nextDay = ((streak % 7) + 1);
        const nextReward = STREAK_REWARDS[nextDay - 1] || STREAK_REWARDS[0];
        const nextRewardText = Object.entries(nextReward)
            .map(([k, v]) => `+${v} ${LangSys.get('res_' + k) || k}`)
            .join(', ');

        html += `
            <div style="margin-top:12px; font-size:0.8rem; color:var(--text-muted);">
                Sonraki giriş ödülü: ${nextRewardText}
            </div>
        `;

        return html;
    },

    /**
     * Get quest progress
     */
    getQuestProgress(questId) {
        const p = gameState.player;
        if (!p || !p.dailyData) return null;

        const d = p.dailyData;
        const quest = DAILY_QUESTS.find(q => q.id === questId);

        if (!quest) return null;

        const progress = d.questsProgress?.[quest.reqKey] || 0;
        const completed = d.questsCompleted?.includes(questId) || false;

        return {
            progress,
            target: quest.target,
            completed,
            reward: `${quest.rewardAmt} ${LangSys.get('res_' + quest.rewardKey) || quest.rewardKey}`
        };
    }
};

// Export for ES6 modules compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DailySystem;
}
