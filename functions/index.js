/**
 * REALM TYCOON - Cloud Functions
 * Server-side validation for critical game operations
 * 
 * Deploy: firebase deploy --only functions
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// ========================================
// VALIDATION HELPERS
// ========================================

/**
 * Validate trade request
 * - Check sender has required gold/item
 * - Check target exists
 * - Prevent self-trading
 */
async function validateTradeRequest(senderId, targetId, offerGold, offerItem, reqGold) {
    const errors = [];
    
    // Prevent self-trading
    if (senderId === targetId) {
        errors.push("Cannot trade with yourself");
        return { valid: false, errors };
    }
    
    // Check target player exists
    const targetRef = db.collection('players').doc(targetId);
    const targetDoc = await targetRef.get();
    
    if (!targetDoc.exists) {
        errors.push("Target player does not exist");
        return { valid: false, errors };
    }
    
    // Get sender data
    const senderRef = db.collection('players').doc(senderId);
    const senderDoc = await senderRef.get();
    
    if (!senderDoc.exists) {
        errors.push("Sender player does not exist");
        return { valid: false, errors };
    }
    
    const senderData = senderDoc.data();
    const senderPlayer = senderData?.value || {};
    
    // Validate sender has enough gold
    if (offerGold > 0 && senderPlayer.gold < offerGold) {
        errors.push(`Insufficient gold: has ${senderPlayer.gold}, needs ${offerGold}`);
    }
    
    // Validate sender has the item
    if (offerItem) {
        const hasItem = senderPlayer.inventory?.some(i => i.id === offerItem.id);
        if (!hasItem) {
            errors.push("Sender does not have the offered item");
        }
    }
    
    // Rate limiting check - max 5 pending trades
    const tradesQuery = db.collection('shared_data')
        .where('value.senderId', '==', senderId)
        .where('value.status', '==', 'pending');
    const tradesSnap = await tradesQuery.get();
    
    if (tradesSnap.size >= 5) {
        errors.push("Too many pending trades (max 5)");
    }
    
    return {
        valid: errors.length === 0,
        errors,
        senderGold: senderPlayer.gold,
        senderInventory: senderPlayer.inventory || []
    };
}

/**
 * Validate trade acceptance
 * - Check accepter has required gold
 * - Verify trade still exists and is pending
 */
async function validateTradeAccept(tradeId, targetId, senderId, reqGold) {
    const errors = [];
    
    // Get trade document
    const tradeRef = db.collection('shared_data').doc(`trades_${targetId}_${tradeId}`);
    const tradeDoc = await tradeRef.get();
    
    if (!tradeDoc.exists) {
        errors.push("Trade does not exist");
        return { valid: false, errors, trade: null };
    }
    
    const trade = tradeDoc.data()?.value;
    
    if (!trade) {
        errors.push("Invalid trade data");
        return { valid: false, errors, trade: null };
    }
    
    if (trade.status !== 'pending') {
        errors.push(`Trade is no longer pending (status: ${trade.status})`);
        return { valid: false, errors, trade };
    }
    
    // Verify trade details match
    if (trade.targetId !== targetId || trade.senderId !== senderId) {
        errors.push("Trade participant mismatch");
        return { valid: false, errors, trade };
    }
    
    // Get accepter data and verify gold
    const accepterRef = db.collection('players').doc(targetId);
    const accepterDoc = await accepterRef.get();
    
    if (!accepterDoc.exists) {
        errors.push("Accpter does not exist");
        return { valid: false, errors, trade };
    }
    
    const accepterData = accepterDoc.data();
    const accepterPlayer = accepterData?.value || {};
    
    if (reqGold > 0 && accepterPlayer.gold < reqGold) {
        errors.push(`Insufficient gold: has ${accepterPlayer.gold}, needs ${reqGold}`);
    }
    
    return {
        valid: errors.length === 0,
        errors,
        trade,
        accepterGold: accepterPlayer.gold
    };
}

/**
 * Validate leaderboard score
 * - Check score is within reasonable bounds
 * - Verify player stats match claimed score
 */
function validateLeaderboardScore(category, value, playerData) {
    const errors = [];
    const MAX_REASONABLE = {
        gold: 100000000,      // 100M gold max
        crafts: 100000,       // 100K crafts max
        kills: 500000         // 500K kills max
    };
    
    // Check for impossible values
    if (value < 0) {
        errors.push("Score cannot be negative");
    }
    
    if (value > MAX_REASONABLE[category]) {
        errors.push(`Score ${value} exceeds maximum reasonable value for ${category}`);
    }
    
    // Verify against player data
    if (playerData) {
        const actualValue = category === 'gold' ? playerData.gold :
                           category === 'crafts' ? playerData.stats?.totalItemsCrafted :
                           category === 'kills' ? playerData.stats?.monstersKilled : 0;
        
        // Allow 10% tolerance for timing differences
        const tolerance = 0.1;
        if (value > actualValue * (1 + tolerance)) {
            errors.push(`Claimed ${category} (${value}) exceeds actual (${actualValue}) by more than 10%`);
        }
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

// ========================================
// CLOUD FUNCTIONS - TRADES
// ========================================

/**
 * Create a trade with server-side validation
 * 
 * Usage from client:
 * const createTrade = httpsCallable(functions, 'createTrade');
 * const result = await createTrade({ targetId, offerGold, offerItem, reqGold });
 */
exports.createTrade = functions.https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }
    
    const senderId = context.auth.uid;
    const { targetId, offerGold, offerItem, reqGold } = data;
    
    // Validate input
    if (!targetId) {
        throw new functions.https.HttpsError('invalid-argument', 'targetId required');
    }
    
    // Validate trade request
    const validation = await validateTradeRequest(senderId, targetId, offerGold || 0, offerItem, reqGold || 0);
    
    if (!validation.valid) {
        throw new functions.https.HttpsError('failed-precondition', validation.errors.join(', '));
    }
    
    // Create trade with server timestamp
    const tradeId = `trd_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const trade = {
        tradeId,
        senderId,
        senderName: data.senderName || 'Unknown',
        targetId,
        offerGold: offerGold || 0,
        offerItem: offerItem || null,
        reqGold: reqGold || 0,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        serverValidated: true
    };
    
    // Save to Firestore
    const tradeRef = db.collection('shared_data').doc(`trades_${targetId}_${tradeId}`);
    await tradeRef.set({ value: trade });
    
    return {
        success: true,
        tradeId,
        message: 'Trade created successfully'
    };
});

/**
 * Accept a trade with server-side gold verification
 * 
 * This is the CRITICAL function that prevents gold manipulation
 */
exports.acceptTrade = functions.https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }
    
    const accepterId = context.auth.uid;
    const { tradeId, targetId } = data;
    
    if (!tradeId || !targetId) {
        throw new functions.https.HttpsError('invalid-argument', 'tradeId and targetId required');
    }
    
    // Validate trade acceptance (includes gold check)
    const validation = await validateTradeAccept(tradeId, targetId, accepterId, data.reqGold);
    
    if (!validation.valid) {
        throw new functions.https.HttpsError('failed-precondition', validation.errors.join(', '));
    }
    
    const trade = validation.trade;
    
    // Execute trade atomically using Firestore transaction
    const tradeRef = db.collection('shared_data').doc(`trades_${targetId}_${tradeId}`);
    const senderRef = db.collection('players').doc(trade.senderId);
    const accepterRef = db.collection('players').doc(accepterId);
    const inboxRef = db.collection('shared_data').doc('player-inbox');
    
    try {
        await db.runTransaction(async (transaction) => {
            // Re-read trade to ensure it hasn't changed
            const tradeDoc = await transaction.get(tradeRef);
            const currentTrade = tradeDoc.data()?.value;
            
            if (!currentTrade || currentTrade.status !== 'pending') {
                throw new Error('Trade is no longer valid');
            }
            
            // Re-verify gold (double-check within transaction)
            const accepterDoc = await transaction.get(accepterRef);
            const accepterData = accepterDoc.data()?.value || {};
            
            if (accepterData.gold < trade.reqGold) {
                throw new Error('Insufficient gold (verified server-side)');
            }
            
            // Update trade status
            transaction.update(tradeRef, {
                'value.status': 'completed',
                'value.completedAt': admin.firestore.FieldValue.serverTimestamp()
            });
            
            // Update sender gold
            const senderDoc = await transaction.get(senderRef);
            const senderData = senderDoc.data()?.value || {};
            const senderGold = senderData.gold || 0;
            
            transaction.update(senderRef, {
                'value.gold': senderGold + trade.reqGold
            });
            
            // Update accepter gold
            const accepterGold = accepterData.gold || 0;
            transaction.update(accepterRef, {
                'value.gold': accepterGold - trade.reqGold + trade.offerGold
            });
            
            // Add inbox notification to sender
            const inboxDoc = await transaction.get(inboxRef);
            const inbox = inboxDoc.exists ? inboxDoc.data().value || [] : [];
            
            inbox.push({
                id: `inb_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                playerId: trade.senderId,
                gold: trade.reqGold,
                message: `Trade Completed! You received ${trade.reqGold} Gold.`,
                timestamp: Date.now(),
                serverValidated: true
            });
            
            transaction.set(inboxRef, { value: inbox }, { merge: true });
        });
        
        return {
            success: true,
            message: 'Trade completed successfully'
        };
        
    } catch (error) {
        console.error('Trade transaction failed:', error);
        throw new functions.https.HttpsError('internal', `Trade failed: ${error.message}`);
    }
});

// ========================================
// CLOUD FUNCTIONS - LEADERBOARD
// ========================================

/**
 * Submit leaderboard score with server-side validation
 */
exports.submitLeaderboardScore = functions.https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }
    
    const playerId = context.auth.uid;
    const { category, value, playerName } = data;
    
    // Validate category
    const validCategories = ['gold', 'crafts', 'kills'];
    if (!validCategories.includes(category)) {
        throw new functions.https.HttpsError('invalid-argument', `Invalid category. Must be one of: ${validCategories.join(', ')}`);
    }
    
    // Get player data for validation
    const playerRef = db.collection('players').doc(playerId);
    const playerDoc = await playerRef.get();
    
    if (!playerDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Player not found');
    }
    
    const playerData = playerDoc.data()?.value || {};
    
    // Validate score
    const validation = validateLeaderboardScore(category, value, playerData);
    
    if (!validation.valid) {
        throw new functions.https.HttpsError('failed-precondition', validation.errors.join(', '));
    }
    
    // Update leaderboard
    const leaderboardRef = db.collection('shared_data').doc('leaderboard-data');
    const now = Date.now();
    
    await db.runTransaction(async (transaction) => {
        const lbDoc = await transaction.get(leaderboardRef);
        const lb = lbDoc.exists ? lbDoc.data().value : { gold: [], crafts: [], kills: [] };
        
        // Ensure arrays exist
        if (!lb[category] || !Array.isArray(lb[category])) {
            lb[category] = [];
        }
        
        // Find existing entry
        const existingIndex = lb[category].findIndex(e => e.playerId === playerId);
        
        const entry = {
            playerId,
            playerName: playerName || playerData.name || 'Unknown',
            value,
            updatedAt: now,
            serverValidated: true
        };
        
        if (existingIndex >= 0) {
            // Update existing entry
            lb[category][existingIndex] = entry;
        } else {
            // Add new entry
            lb[category].push(entry);
        }
        
        // Sort and keep top 20
        lb[category].sort((a, b) => b.value - a.value);
        lb[category] = lb[category].slice(0, 20);
        
        transaction.set(leaderboardRef, { value: lb }, { merge: true });
    });
    
    return {
        success: true,
        message: 'Score submitted successfully',
        rank: category // Will be calculated client-side
    };
});

// ========================================
// CLOUD FUNCTIONS - ANTI-CHEAT
// ========================================

/**
 * Report suspicious activity
 */
exports.reportSuspiciousActivity = functions.https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }
    
    const reporterId = context.auth.uid;
    const { reportedPlayerId, reason, evidence } = data;
    
    if (!reportedPlayerId || !reason) {
        throw new functions.https.HttpsError('invalid-argument', 'reportedPlayerId and reason required');
    }
    
    // Save report
    const reportRef = db.collection('reports').doc();
    await reportRef.set({
        id: reportRef.id,
        reporterId,
        reportedPlayerId,
        reason,
        evidence: evidence || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'pending'
    });
    
    return {
        success: true,
        reportId: reportRef.id,
        message: 'Report submitted. Thank you for helping keep the game fair!'
    };
});

/**
 * Scheduled function: Auto-detect suspicious patterns
 * Runs every hour
 */
exports.detectSuspiciousPatterns = functions.pubsub
    .schedule('every 60 minutes')
    .onRun(async (context) => {
        console.log('Running suspicious pattern detection...');
        
        const reports = [];
        
        // Check for impossible gold gains
        const allPlayers = await db.collection('players').get();
        
        for (const playerDoc of allPlayers.docs) {
            const player = playerDoc.data()?.value || {};
            const playerId = playerDoc.id;
            
            // Check gold vs playtime ratio
            const playTimeHours = (player.stats?.totalPlayTime || 0) / 3600;
            const goldPerHour = playTimeHours > 0 ? player.gold / playTimeHours : player.gold;
            
            // Flag if earning > 1M gold per hour (adjust threshold as needed)
            if (goldPerHour > 1000000 && player.gold > 10000000) {
                reports.push({
                    playerId,
                    reason: 'Impossible gold gain rate',
                    details: { goldPerHour, totalGold: player.gold, playTimeHours }
                });
            }
            
            // Check for impossible craft counts
            if (player.stats?.totalItemsCrafted > 50000) {
                reports.push({
                    playerId,
                    reason: 'Impossible craft count',
                    details: { crafts: player.stats.totalItemsCrafted }
                });
            }
        }
        
        // Save reports
        if (reports.length > 0) {
            const batch = db.batch();
            
            for (const report of reports) {
                const reportRef = db.collection('reports').doc();
                batch.set(reportRef, {
                    id: reportRef.id,
                    reporterId: 'system',
                    reportedPlayerId: report.playerId,
                    reason: report.reason,
                    evidence: report.details,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    status: 'pending',
                    autoDetected: true
                });
            }
            
            await batch.commit();
            console.log(`Created ${reports.length} auto-detection reports`);
        }
        
        return null;
    });

// ========================================
// CLOUD FUNCTIONS - PLAYER VALIDATION
// ========================================

/**
 * Validate player data integrity
 * Called periodically to check for tampering
 */
exports.validatePlayerData = functions.https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }
    
    const playerId = context.auth.uid;
    const playerRef = db.collection('players').doc(playerId);
    const playerDoc = await playerRef.get();
    
    if (!playerDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Player not found');
    }
    
    const player = playerDoc.data()?.value || {};
    const issues = [];
    
    // Validate gold is non-negative
    if (player.gold < 0) {
        issues.push('Negative gold detected');
    }
    
    // Validate resources are non-negative
    ['iron', 'wood', 'crystal', 'gems'].forEach(res => {
        if (player[res] < 0) {
            issues.push(`Negative ${res} detected`);
        }
    });
    
    // Validate inventory count
    if (player.inventory && player.inventory.length > 100) {
        issues.push(`Inventory overflow: ${player.inventory.length}/100`);
    }
    
    // Validate building levels
    const MAX_LEVEL = 50;
    if (player.buildings) {
        for (const [building, data] of Object.entries(player.buildings)) {
            if (data.level > MAX_LEVEL) {
                issues.push(`Building ${building} over max level: ${data.level}/${MAX_LEVEL}`);
            }
            if (data.level < 0) {
                issues.push(`Building ${building} has negative level`);
            }
        }
    }
    
    // Auto-fix minor issues
    if (issues.length > 0) {
        console.warn(`Player ${playerId} has data issues:`, issues);
        
        // Fix negative values
        if (player.gold < 0) player.gold = 0;
        ['iron', 'wood', 'crystal', 'gems'].forEach(res => {
            if (player[res] < 0) player[res] = 0;
        });
        
        // Truncate inventory
        if (player.inventory && player.inventory.length > 100) {
            player.inventory = player.inventory.slice(0, 100);
        }
        
        // Fix building levels
        if (player.buildings) {
            for (const [building, data] of Object.entries(player.buildings)) {
                if (data.level > MAX_LEVEL) data.level = MAX_LEVEL;
                if (data.level < 0) data.level = 0;
            }
        }
        
        // Save corrected data
        await playerRef.set({ value: player }, { merge: true });
    }
    
    return {
        valid: issues.length === 0,
        issues,
        message: issues.length === 0 ? 'Data validated successfully' : 'Data issues found and auto-corrected'
    };
});
