class FirebaseService {
    constructor() {
        // Firebase configuration
        this.firebaseConfig = {
            apiKey: "YOUR_API_KEY",
            authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
            projectId: "YOUR_PROJECT_ID",
            storageBucket: "YOUR_PROJECT_ID.appspot.com",
            messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
            appId: "YOUR_APP_ID",
            databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com"
        };
        
        // Initialize Firebase
        this.app = firebase.initializeApp(this.firebaseConfig);
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        this.rtdb = firebase.database();
        
        // Reference to current user
        this.currentUser = null;
        
        // Listen for auth state changes
        this.auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            
            if (user) {
                console.log("User is signed in:", user.uid);
            } else {
                console.log("User is signed out");
            }
        });
    }
    
    // Auth Methods
    async registerUser(email, password, name) {
        try {
            // Create user with email and password
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Set display name
            await user.updateProfile({
                displayName: name
            });
            
            // Create user in Firestore
            await this.db.collection('users').doc(user.uid).set({
                uid: user.uid,
                email: email,
                name: name,
                balance: 500.00, // Starting balance
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return user;
        } catch (error) {
            console.error("Error registering user:", error);
            throw error;
        }
    }
    
    async loginUser(email, password) {
        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            return userCredential.user;
        } catch (error) {
            console.error("Error logging in:", error);
            throw error;
        }
    }
    
    async logoutUser() {
        try {
            await this.auth.signOut();
        } catch (error) {
            console.error("Error logging out:", error);
            throw error;
        }
    }
    
    onAuthStateChanged(callback) {
        return this.auth.onAuthStateChanged(callback);
    }
    
    getCurrentUser() {
        return this.currentUser;
    }
    
    // User Data Methods
    async getUserData(userId) {
        try {
            const userDoc = await this.db.collection('users').doc(userId).get();
            if (userDoc.exists) {
                return userDoc.data();
            } else {
                throw new Error('User not found');
            }
        } catch (error) {
            console.error("Error getting user data:", error);
            throw error;
        }
    }
    
    async updateUserBalance(userId, newBalance) {
        try {
            await this.db.collection('users').doc(userId).update({
                balance: newBalance
            });
        } catch (error) {
            console.error("Error updating user balance:", error);
            throw error;
        }
    }
    
    // Transaction Methods
    async createTransaction(fromUserId, toUserId, amount) {
        try {
            // Start a Firestore transaction
            await this.db.runTransaction(async (transaction) => {
                // Get sender and recipient documents
                const senderRef = this.db.collection('users').doc(fromUserId);
                const recipientRef = this.db.collection('users').doc(toUserId);
                
                const senderDoc = await transaction.get(senderRef);
                const recipientDoc = await transaction.get(recipientRef);
                
                if (!senderDoc.exists || !recipientDoc.exists) {
                    throw new Error('One or both users not found');
                }
                
                const senderData = senderDoc.data();
                const recipientData = recipientDoc.data();
                
                // Verify sufficient balance
                if (senderData.balance < amount) {
                    throw new Error('Insufficient balance');
                }
                
                // Update balances
                transaction.update(senderRef, {
                    balance: senderData.balance - amount
                });
                
                transaction.update(recipientRef, {
                    balance: recipientData.balance + amount
                });
                
                // Create transaction record
                const transactionId = 'tx' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
                const transactionRef = this.db.collection('transactions').doc(transactionId);
                
                transaction.set(transactionRef, {
                    id: transactionId,
                    from: fromUserId,
                    to: toUserId,
                    fromName: senderData.name,
                    toName: recipientData.name,
                    amount: amount,
                    date: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                // Also add to real-time database for instant notifications
                this.rtdb.ref(`transactions/${transactionId}`).set({
                    id: transactionId,
                    from: fromUserId,
                    to: toUserId,
                    amount: amount,
                    date: firebase.database.ServerValue.TIMESTAMP
                });
                
                return transactionId;
            });
            
            return true;
        } catch (error) {
            console.error("Error creating transaction:", error);
            throw error;
        }
    }
    
    async getUserTransactions(userId) {
        try {
            // Get transactions where user is sender or recipient
            const sentQuery = await this.db.collection('transactions')
                .where('from', '==', userId)
                .orderBy('date', 'desc')
                .get();
                
            const receivedQuery = await this.db.collection('transactions')
                .where('to', '==', userId)
                .orderBy('date', 'desc')
                .get();
                
            const transactions = [];
            
            // Process sent transactions
            sentQuery.forEach(doc => {
                const data = doc.data();
                transactions.push({
                    ...data,
                    type: 'debit'
                });
            });
            
            // Process received transactions
            receivedQuery.forEach(doc => {
                const data = doc.data();
                transactions.push({
                    ...data,
                    type: 'credit'
                });
            });
            
            // Sort by date (newest first)
            transactions.sort((a, b) => {
                return b.date.toMillis() - a.date.toMillis();
            });
            
            return transactions;
        } catch (error) {
            console.error("Error getting user transactions:", error);
            throw error;
        }
    }
    
    // Listen for realtime transactions
    listenForTransactions(userId, callback) {
        // Listen for transactions in real-time database
        return this.rtdb.ref('transactions')
            .orderByChild('date')
            .on('child_added', snapshot => {
                const transaction = snapshot.val();
                
                // Only notify if user is involved in the transaction
                if (transaction.from === userId || transaction.to === userId) {
                    // Get user details from Firestore
                    this.enrichTransactionData(transaction).then(enrichedTransaction => {
                        callback(enrichedTransaction);
                    });
                }
            });
    }
    
    async enrichTransactionData(transaction) {
        try {
            // Get sender and recipient details
            const senderDoc = await this.db.collection('users').doc(transaction.from).get();
            const recipientDoc = await this.db.collection('users').doc(transaction.to).get();
            
            return {
                ...transaction,
                fromName: senderDoc.exists ? senderDoc.data().name : 'Unknown User',
                toName: recipientDoc.exists ? recipientDoc.data().name : 'Unknown User'
            };
        } catch (error) {
            console.error("Error enriching transaction data:", error);
            return transaction;
        }
    }
}

// Create instance and expose to window
window.firebaseService = new FirebaseService();
