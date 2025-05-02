class UIController {
    constructor(dataService) {
        this.dataService = dataService;
        this.notificationElement = document.getElementById('notification');
        
        // Initialize UI components
        this.updateUserInfo();
    }

    updateUserInfo() {
        const currentUser = this.dataService.getCurrentUser();
        document.getElementById('userBalance').textContent = `$${currentUser.balance.toFixed(2)}`;
        document.getElementById('userName').textContent = currentUser.name;
    }

    showNotification(message, type = 'success') {
        this.notificationElement.textContent = message;
        this.notificationElement.style.display = 'block';
        
        // Set notification color based on type
        if (type === 'success') {
            this.notificationElement.style.backgroundColor = 'rgba(40, 167, 69, 0.9)';
        } else if (type === 'error') {
            this.notificationElement.style.backgroundColor = 'rgba(220, 53, 69, 0.9)';
        }
        
        // Hide notification after 3 seconds
        setTimeout(() => {
            this.notificationElement.style.display = 'none';
        }, 3000);
    }

    attachEventListeners() {
        // Implement common UI event listeners here
        // Specific functionality will be in specialized UI controllers
    }
}
