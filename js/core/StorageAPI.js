/**
 * ===================================
 * STORAGE API - Firebase Integration
 * ===================================
 */

const StorageAPI = {
    uid: null,
    isReady: false,
    initCallback: null,

    /**
     * Initialize storage with Firebase
     */
    async init(firebaseConfig) {
        try {
            // Initialize Firebase
            window.FB = {
                app: window.firebase.initializeApp(firebaseConfig),
                db: window.firebase.firestore(),
                auth: window.firebase.auth()
            };

            // Listen for auth state changes
            window.FB.auth.onAuthStateChanged((user) => {
                if (user) {
                    this.uid = user.uid;
                    this.isReady = true;
                    Logger.info('StorageAPI', 'User authenticated', user.uid);

                    if (this.initCallback) {
                        this.initCallback(user);
                    }
                } else {
                    this.uid = null;
                    this.isReady = false;
                    Logger.info('StorageAPI', 'User logged out');
                }
            });

            Logger.info('StorageAPI', 'Firebase initialized');
        } catch (error) {
            Logger.error('StorageAPI', error, 'Failed to initialize Firebase');
        }
    },

    /**
     * Set callback for auth state changes
     */
    onAuthStateChanged(callback) {
        this.initCallback = callback;
    },

    /**
     * Get data from Firestore
     */
    async get(key, isPublic = false) {
        if (!this.isReady && !isPublic) {
            Logger.warn('StorageAPI', 'Storage not ready');
            return null;
        }

        try {
            let docRef;
            if (isPublic) {
                docRef = window.FB.doc(window.FB.db, `shared_data/${key}`);
            } else {
                const docId = `users_${this.uid}_${key}`;
                docRef = window.FB.doc(window.FB.db, `users/${docId}`);
            }

            const docSnap = await docRef.get();

            if (docSnap.exists) {
                const data = docSnap.data();
                Logger.debug('StorageAPI', `Retrieved: ${key}`, data);
                return data.value !== undefined ? data.value : data;
            }

            Logger.debug('StorageAPI', `Document not found: ${key}`);
            return null;
        } catch (error) {
            Logger.error('StorageAPI', error, `Failed to get: ${key}`);
            return null;
        }
    },

    /**
     * Set data in Firestore
     */
    async set(key, value, isPublic = false) {
        if (!this.isReady && !isPublic) {
            Logger.warn('StorageAPI', 'Storage not ready');
            return false;
        }

        try {
            let docRef;
            if (isPublic) {
                docRef = window.FB.doc(window.FB.db, `shared_data/${key}`);
            } else {
                const docId = `users_${this.uid}_${key}`;
                docRef = window.FB.doc(window.FB.db, `users/${docId}`);
            }

            await docRef.set({ value: value }, { merge: true });
            Logger.debug('StorageAPI', `Saved: ${key}`);
            return true;
        } catch (error) {
            Logger.error('StorageAPI', error, `Failed to set: ${key}`);
            return false;
        }
    },

    /**
     * Update specific field in a document
     */
    async update(key, field, value, isPublic = false) {
        if (!this.isReady && !isPublic) {
            Logger.warn('StorageAPI', 'Storage not ready');
            return false;
        }

        try {
            let docRef;
            if (isPublic) {
                docRef = window.FB.doc(window.FB.db, `shared_data/${key}`);
            } else {
                const docId = `users_${this.uid}_${key}`;
                docRef = window.FB.doc(window.FB.db, `users/${docId}`);
            }

            await docRef.update({ [field]: value });
            Logger.debug('StorageAPI', `Updated: ${key}.${field}`);
            return true;
        } catch (error) {
            Logger.error('StorageAPI', error, `Failed to update: ${key}.${field}`);
            return false;
        }
    },

    /**
     * Delete data from Firestore
     */
    async delete(key, isPublic = false) {
        if (!this.isReady && !isPublic) {
            Logger.warn('StorageAPI', 'Storage not ready');
            return false;
        }

        try {
            let docRef;
            if (isPublic) {
                docRef = window.FB.doc(window.FB.db, `shared_data/${key}`);
            } else {
                const docId = `users_${this.uid}_${key}`;
                docRef = window.FB.doc(window.FB.db, `users/${docId}`);
            }

            await docRef.delete();
            Logger.info('StorageAPI', `Deleted: ${key}`);
            return true;
        } catch (error) {
            Logger.error('StorageAPI', error, `Failed to delete: ${key}`);
            return false;
        }
    },

    /**
     * Query collection
     */
    async query(collection, filters = [], orderBy = null, limit = null) {
        try {
            let queryRef = window.FB.collection(window.FB.db, collection);

            // Apply filters
            filters.forEach(filter => {
                const [field, op, value] = filter;
                queryRef = queryRef.where(field, op, value);
            });

            // Apply ordering
            if (orderBy) {
                const [field, direction] = orderBy;
                queryRef = queryRef.orderBy(field, direction);
            }

            // Apply limit
            if (limit) {
                queryRef = queryRef.limit(limit);
            }

            const snapshot = await queryRef.get();
            const results = [];

            snapshot.forEach(doc => {
                results.push({ id: doc.id, ...doc.data() });
            });

            Logger.debug('StorageAPI', `Query returned ${results.length} results`);
            return results;
        } catch (error) {
            Logger.error('StorageAPI', error, 'Query failed');
            return [];
        }
    },

    /**
     * Run transaction
     */
    async runTransaction(updateFunction) {
        try {
            await window.FB.runTransaction(window.FB.db, updateFunction);
            Logger.info('StorageAPI', 'Transaction completed');
            return true;
        } catch (error) {
            Logger.error('StorageAPI', error, 'Transaction failed');
            return false;
        }
    },

    /**
     * Sign out
     */
    async signOut() {
        try {
            await window.FB.auth.signOut();
            this.uid = null;
            this.isReady = false;
            Logger.info('StorageAPI', 'User signed out');
            return true;
        } catch (error) {
            Logger.error('StorageAPI', error, 'Sign out failed');
            return false;
        }
    }
};

// Export for ES6 modules compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageAPI;
}
