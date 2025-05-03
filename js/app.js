document.addEventListener('DOMContentLoaded', function() {
    // Initialize services
    const dataService = new DataService();
    
    // We'll initialize UI controllers after data is ready
    document.addEventListener('dataReady', function() {
        // Initialize UI controllers
        const uiController = new UIController(dataService);
        const transactionUI = new TransactionUI(dataService);
        
        // Initialize modal controller
        const modalController = new ModalController(dataService, uiController, transactionUI);
        
        // Initialize app state
        function initializeApp() {
            // Load user data
            uiController.updateUserInfo();
            
            // Load transactions
            transactionUI.refresh();
            
            // Handle transitions and animations
            document.body.classList.add('loaded');
            
            // Add logout functionality
            setupLogout(dataService);
        }
        
        // Start app
        initializeApp();
        
        // Listen for transaction updates
        dataService.addListener('transaction', (transaction) => {
            // Update UI
            uiController.updateUserInfo();
            transactionUI.refresh();
            
            // Show notification
            if (transaction.type === 'credit') {
                const sender = dataService.getUser(transaction.from);
                const senderName = sender ? sender.name : 'Someone';
                uiController.showNotification(`You received $${transaction.amount.toFixed(2)} from ${senderName}!`);
            }
        });
    });
});

function setupLogout(dataService) {
    // Add logout event listener if there's a logout button
    const logoutBtn = document.querySelector('.logout-btn') || document.querySelector('[data-action="logout"]');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await dataService.logout();
                // Redirect happens automatically via auth state change
            } catch (error) {
                console.error('Error logging out:', error);
            }
        });
    }
}
