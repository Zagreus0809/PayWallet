class DataService {
    constructor() {
        // Initialize with mock data or load from local storage
        this.initializeData();
    }

    initializeData() {
        // Create users
        this.users = {
            'user123': new User('user123', 'John Doe', 500.00),
            'user456': new User('user456', 'Jane Smith', 750.00),
            'user789': new User('user789', 'Alex Johnson', 300.00)
        };
        
        // Current user
        this.currentUser = this.users['user123'];
        
        // Create initial transactions
        this.transactions = [
            new Transaction('tx001', 'user456', 'user123', 120.00, new Date('2025-04-25T10:23:15')),
            new Transaction('tx002', 'user123', 'user789', 75.50, new Date('2025-04-23T16:42:30')),
            new Transaction('tx003', 'user456', 'user123', 210.00, new Date('2025-04-20T09:15:45'))
        ];
        
        // Set transaction types based on current user
        this.transactions.forEach(tx => {
            tx.type = tx.getTypeForUser(this.currentUser.id);
        });
        
        // Try to load from localStorage if available
        this.loadFromStorage();
    }

    loadFromStorage() {
        try {
            // Load users
            const savedUsers = localStorage.getItem('wallet_users');
            if (savedUsers) {
                const parsedUsers = JSON.parse(savedUsers);
                // Convert to User objects
                this.users = {};
                for (const userId in parsedUsers) {
                    const user = parsedUsers[userId];
                    this.users[userId] = new User(user.id, user.name, user.balance);
                }
            }
            
            // Load current user
            const savedCurrentUser = localStorage.getItem('wallet_currentUser');
            if (savedCurrentUser) {
                const currentUserId = JSON.parse(savedCurrentUser);
                this.currentUser = this.users[currentUserId];
            }
            
            // Load transactions
            const savedTransactions = localStorage.getItem('wallet_transactions');
            if (savedTransactions) {
                const parsedTransactions = JSON.parse(savedTransactions);
                // Convert to Transaction objects
                this.transactions = parsedTransactions.map(tx => {
                    const transaction = new Transaction(
                        tx.id, 
                        tx.from, 
                        tx.to, 
                        tx.amount, 
                        new Date(tx.date)
                    );
                    transaction.type = transaction.getTypeForUser(this.currentUser.id);
                    return transaction;
                });
            }
        } catch (error) {
            console.error('Error loading data from localStorage:', error);
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem('wallet_users', JSON.stringify(this.users));
            localStorage.setItem('wallet_currentUser', JSON.stringify(this.currentUser.id));
            localStorage.setItem('wallet_transactions', JSON.stringify(this.transactions));
        } catch (error) {
            console.error('Error saving data to localStorage:', error);
        }
    }

    getUser(userId) {
        return this.users[userId];
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

    createTransaction(fromUserId, toUserId, amount) {
        // Validate amount
        amount = parseFloat(amount);
        if (isNaN(amount) || amount <= 0) {
            throw new Error('Invalid amount');
        }
        
        // Get users
        const sender = this.getUser(fromUserId);
        const recipient = this.getUser(toUserId);
        
        if (!sender || !recipient) {
            throw new Error('User not found');
        }
        
        // Process transaction
        sender.debit(amount);
        recipient.credit(amount);
        
        // Create transaction record
        const transaction = new Transaction(
            Transaction.generateId(),
            fromUserId,
            toUserId,
            amount
        );
        
        // Set type for current user's perspective
        transaction.type = transaction.getTypeForUser(this.currentUser.id);
        
        // Add to transactions
        this.transactions.unshift(transaction);
        
        // Save to storage
        this.saveToStorage();
        
        return transaction;
    }
}
