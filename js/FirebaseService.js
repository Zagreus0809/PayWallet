// This file is needed for the login and registration pages
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
        });
    }
    
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
    
    onAuthStateChanged(callback) {
        return this.auth.onAuthStateChanged(callback);
    }
}

// Create instance and expose to window
window.firebaseService = new FirebaseService();