class DataService {
    constructor() {
        this.firebaseService = window.firebaseService;
        this.currentUser = null;
        this.users = {};
        this.transactions = [];
        this.listeners = [];
        
        // Check if we're logged in and initialize data
        this.initializeData();
    }

    async initializeData() {
        try {
            // Wait for auth state to be determined
            this.firebaseService.onAuthStateChanged(async (user) => {
                if (user) {
                    // Get current user data from Firestore
                    const userData = await this.firebaseService.getUserData(user.uid);
                    this.currentUser = new User(user.uid, userData.name, userData.balance);
                    
                    // Store user in users map
                    this.users[user.uid] = this.currentUser;
                    
                    // Load transactions
                    await this.loadTransactions();
                    
                    // Listen for new transactions
                    this.listenForTransactions();
                    
                    // Dispatch event that data is ready
                    document.dispatchEvent(new CustomEvent('dataReady'));
                } else {
                    // Not logged in, redirect to login page
                    if (window.location.pathname !== '/login.html' && 
                        window.location.pathname !== '/register.html') {
                        window.location.href = 'login.html';
                    }
                }
            });
        } catch (error) {
            console.error('Error initializing data:', error);
        }
    }

    async loadTransactions() {
        try {
            if (!this.currentUser) return;
            
            // Get transactions from Firebase
            const transactions = await this.firebaseService.getUserTransactions(this.currentUser.id);
            
            // Convert to Transaction objects
            this.transactions = transactions.map(tx => {
                const transaction = new Transaction(
                    tx.id,
                    tx.from,
                    tx.to,
                    tx.amount,
                    tx.date.toDate()
                );
                transaction.type = tx.type;
                return transaction;
            });
            
            return this.transactions;
        } catch (error) {
            console.error('Error loading transactions:', error);
            return [];
        }
    }

    listenForTransactions() {
        if (!this.currentUser) return;
        
        this.firebaseService.listenForTransactions(this.currentUser.id, async (transaction) => {
            // Update local user balance
            if (transaction.from === this.currentUser.id) {
                // Get fresh balance from Firebase
                const userData = await this.firebaseService.getUserData(this.currentUser.id);
                this.currentUser.balance = userData.balance;
            } else if (transaction.to === this.currentUser.id) {
                // Get fresh balance from Firebase
                const userData = await this.firebaseService.getUserData(this.currentUser.id);
                this.currentUser.balance = userData.balance;
            }
            
            // Create Transaction object
            const newTx = new Transaction(
                transaction.id,
                transaction.from,
                transaction.to,
                transaction.amount,
                new Date(transaction.date)
            );
            
            // Set type for current user's perspective
            newTx.type = newTx.getTypeForUser(this.currentUser.id);
            
            // Add to transactions array (at the beginning)
            this.transactions.unshift(newTx);
            
            // Notify listeners
            this.notifyListeners('transaction', newTx);
        });
    }

    addListener(event, callback) {
        this.listeners.push({ event, callback });
    }

    notifyListeners(event, data) {
        this.listeners
            .filter(listener => listener.event === event)
            .forEach(listener => listener.callback(data));
    }

    async getUser(userId) {
        try {
            // If we already have user in cache, return it
            if (this.users[userId]) {
                return this.users[userId];
            }
            
            // Otherwise fetch from Firebase
            const userData = await this.firebaseService.getUserData(userId);
            const user = new User(userId, userData.name, userData.balance);
            
            // Cache for future use
            this.users[userId] = user;
            
            return user;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getAllTransactions() {
        return this.transactions;
    }

    getUserTransactions(userId) {
        return this.transactions.filter(tx => 
            tx.from === userId || tx.to === userId
        ).map(tx => {
            // Clone the transaction and set type based on perspective
            const clone = {...tx};
            clone.type = tx.getTypeForUser(userId);
            return clone;
        });
    }

    async createTransaction(fromUserId, toUserId, amount) {
        try {
            // Validate amount
            amount = parseFloat(amount);
            if (isNaN(amount) || amount <= 0) {
                throw new Error('Invalid amount');
            }
            
            // Create transaction in Firebase
            await this.firebaseService.createTransaction(fromUserId, toUserId, amount);
            
            // Update local user balance (Firebase listener will handle the transaction)
            const userData = await this.firebaseService.getUserData(fromUserId);
            if (this.users[fromUserId]) {
                this.users[fromUserId].balance = userData.balance;
            }
            
            return true;
        } catch (error) {
            console.error('Error creating transaction:', error);
            throw error;
        }
    }

    async logout() {
        try {
            await this.firebaseService.logoutUser();
            // Redirect to login happens automatically via auth state change
        } catch (error) {
            console.error('Error logging out:', error);
            throw error;
        }
    }
}
