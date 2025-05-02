class ModalController {
    constructor(dataService, uiController, transactionUI) {
        this.dataService = dataService;
        this.uiController = uiController;
        this.transactionUI = transactionUI;
        
        // Modal elements
        this.sendMoneyModal = document.getElementById('sendMoneyModal');
        this.receiveMoneyModal = document.getElementById('receiveMoneyModal');
        this.scanQRModal = document.getElementById('scanQRModal');
        
        // QR service
        this.qrService = new QRService(document.getElementById('qrcode'));
        
        // Initialize modals
        this.initializeModals();
        this.attachEventListeners();
    }

    initializeModals() {
        // Display current user ID in receive modal
        const currentUser = this.dataService.getCurrentUser();
        document.getElementById('walletIdDisplay').textContent = `Your Wallet ID: ${currentUser.id}`;
    }

    attachEventListeners() {
        // Open modals
        document.getElementById('sendMoneyBtn').addEventListener('click', () => {
            this.openModal(this.sendMoneyModal);
        });
        
        document.getElementById('receiveMoneyBtn').addEventListener('click', () => {
            this.openModal(this.receiveMoneyModal);
        });
        
        document.getElementById('scanQRBtn').addEventListener('click', () => {
            this.openModal(this.scanQRModal);
        });
        
        // Close modals
        document.getElementById('closeSendModal').addEventListener('click', () => {
            this.closeModal(this.sendMoneyModal);
        });
        
        document.getElementById('closeReceiveModal').addEventListener('click', () => {
            this.closeModal(this.receiveMoneyModal);
            document.getElementById('qrcode').innerHTML = '';
        });
        
        document.getElementById('closeScanModal').addEventListener('click', () => {
            this.closeModal(this.scanQRModal);
        });
        
        // Close modals when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === this.sendMoneyModal) {
                this.closeModal(this.sendMoneyModal);
            }
            
            if (event.target === this.receiveMoneyModal) {
                this.closeModal(this.receiveMoneyModal);
                document.getElementById('qrcode').innerHTML = '';
            }
            
            if (event.target === this.scanQRModal) {
                this.closeModal(this.scanQRModal);
            }
        });
        
        // Modal functionality
        document.getElementById('confirmSendBtn').addEventListener('click', () => {
            this.handleSendMoney();
        });
        
        document.getElementById('generateQRBtn').addEventListener('click', () => {
            this.handleGenerateQR();
        });
        
        document.getElementById('processScanBtn').addEventListener('click', () => {
            this.handleProcessQR();
        });
    }

    openModal(modal) {
        modal.style.display = 'block';
    }

    closeModal(modal) {
        modal.style.display = 'none';
    }

    handleSendMoney() {
        const recipientId = document.getElementById('recipientId').value;
        const amount = parseFloat(document.getElementById('sendAmount').value);
        
        if (!recipientId) {
            this.uiController.showNotification('Please enter a recipient ID', 'error');
            return;
        }
        
        if (isNaN(amount) || amount <= 0) {
            this.uiController.showNotification('Please enter a valid amount', 'error');
            return;
        }
        
        try {
            const currentUser = this.dataService.getCurrentUser();
            this.dataService.createTransaction(currentUser.id, recipientId, amount);
            
            // Update UI
            this.uiController.updateUserInfo();
            this.transactionUI.refresh();
            
            // Show notification and close modal
            this.uiController.showNotification('Payment sent successfully!');
            this.closeModal(this.sendMoneyModal);
            
            // Reset form
            document.getElementById('recipientId').value = '';
            document.getElementById('sendAmount').value = '';
            
        } catch (error) {
            this.uiController.showNotification(error.message, 'error');
        }
    }

    handleGenerateQR() {
        const amount = parseFloat(document.getElementById('receiveAmount').value);
        
        if (isNaN(amount) || amount <= 0) {
            this.uiController.showNotification('Please enter a valid amount', 'error');
            return;
        }
        
        const currentUser = this.dataService.getCurrentUser();
        const paymentData = {
            type: 'payment',
            from: null, // Will be filled by the sender
            to: currentUser.id,
            amount: amount
        };
        
        this.qrService.generateQRCode(paymentData);
        this.uiController.showNotification('QR code generated successfully!');
    }

    handleProcessQR() {
        const qrCodeData = document.getElementById('manualQRInput').value;
        
        if (!qrCodeData) {
            this.uiController.showNotification('Please enter payment code', 'error');
            return;
        }
        
        try {
            const paymentData = this.qrService.parseQRCode(qrCodeData);
            
            if (!paymentData || paymentData.type !== 'payment') {
                throw new Error('Invalid payment data');
            }
            
            const currentUser = this.dataService.getCurrentUser();
            
            // Complete payment data
            paymentData.from = currentUser.id;
            
            // Process transaction
            this.dataService.createTransaction(
                paymentData.from,
                paymentData.to,
                paymentData.amount
            );
            
            // Update UI
            this.uiController.updateUserInfo();
            this.transactionUI.refresh();
            
            // Show notification and close modal
            this.uiController.showNotification('Payment processed successfully!');
            this.closeModal(this.scanQRModal);
            
            // Reset form
            document.getElementById('manualQRInput').value = '';
            
        } catch (error) {
            this.uiController.showNotification(error.message, 'error');
        }
    }
}
