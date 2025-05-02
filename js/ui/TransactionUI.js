class TransactionUI {
    constructor(dataService) {
        this.dataService = dataService;
        this.transactionsListElement = document.getElementById('transactionsList');
        
        // Load transactions
        this.loadTransactions();
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === today.toDateString()) {
            return `Today, ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        } else if (date.toDateString() === yesterday.toDateString()) {
            return `Yesterday, ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    }

    loadTransactions() {
        // Get current user transactions
        const currentUser = this.dataService.getCurrentUser();
        const transactions = this.dataService.getUserTransactions(currentUser.id);
        
        // Sort transactions by date (newest first)
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Clear container
        this.transactionsListElement.innerHTML = '';
        
        // Render transactions
        transactions.forEach(transaction => {
            this.renderTransaction(transaction);
        });
    }

    renderTransaction(transaction) {
        const currentUser = this.dataService.getCurrentUser();
        const otherPartyId = transaction.type === 'credit' ? transaction.from : transaction.to;
        const otherParty = this.dataService.getUser(otherPartyId);
        const otherPartyName = otherParty ? otherParty.name : 'Unknown User';
        
        const transactionElement = document.createElement('div');
        transactionElement.classList.add('transaction-item');
        
        transactionElement.innerHTML = `
            <div class="transaction-icon">${transaction.type === 'credit' ? '↓' : '↑'}</div>
            <div class="transaction-details">
                <div class="transaction-name">${otherPartyName}</div>
                <div class="transaction-date">${this.formatDate(transaction.date)}</div>
            </div>
            <div class="transaction-amount ${transaction.type}">${transaction.type === 'credit' ? '+' : '-'}$${transaction.amount.toFixed(2)}</div>
        `;
        
        this.transactionsListElement.appendChild(transactionElement);
    }

    refresh() {
        this.loadTransactions();
    }
}
