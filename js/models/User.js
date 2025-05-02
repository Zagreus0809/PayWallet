class User {
    constructor(id, name, balance) {
        this.id = id;
        this.name = name;
        this.balance = balance;
    }

    debit(amount) {
        if (amount <= 0) {
            throw new Error('Amount must be positive');
        }
        
        if (amount > this.balance) {
            throw new Error('Insufficient balance');
        }
        
        this.balance -= amount;
        return true;
    }

    credit(amount) {
        if (amount <= 0) {
            throw new Error('Amount must be positive');
        }
        
        this.balance += amount;
        return true;
    }
}
