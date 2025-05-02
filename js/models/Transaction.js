class Transaction {
    constructor(id, fromUserId, toUserId, amount, date = new Date()) {
        this.id = id;
        this.from = fromUserId;
        this.to = toUserId;
        this.amount = amount;
        this.date = date instanceof Date ? date.toISOString() : date;
        this.type = null; // Will be set based on perspective
    }

    static generateId() {
        return 'tx' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    }
    
    // Get transaction type from the perspective of the specified user
    getTypeForUser(userId) {
        if (this.to === userId) {
            return 'credit';
        } else if (this.from === userId) {
            return 'debit';
        } else {
            return null;
        }
    }
}
