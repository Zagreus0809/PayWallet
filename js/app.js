document.addEventListener('DOMContentLoaded', function() {
    // Initialize services
    const dataService = new DataService();
    
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
    }
    
    // Start app
    initializeApp();
    
    // For demo purposes: Simulate receiving money after 5 seconds
    setTimeout(() => {
        try {
            // Simulate someone sending money to the current user
            const currentUser = dataService.getCurrentUser();
            dataService.createTransaction('user456', currentUser.id, 50.00);
            
            // Update UI
            uiController.updateUserInfo();
            transactionUI.refresh();
            
            // Show notification
            uiController.showNotification('You received $50.00 from Jane Smith!');
        } catch (error) {
            console.error('Error simulating payment:', error);
        }
    }, 5000);
});
