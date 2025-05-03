// This file is needed for the login and registration pages
class FirebaseService {
    constructor() {
        // Firebase configuration
        this.firebaseConfig = {
            apiKey: "AIzaSyBjQaUXOTiNQq9eYNKEmhsPsjQdISZTuUI",
            authDomain: "log-in-system-cef9e.firebaseapp.com",
            projectId: "log-in-system-cef9e",
            storageBucket: "log-in-system-cef9e.firebasestorage.app",
            messagingSenderId: "464719173794",
            appId: "1:464719173794:web:e2aa53a227de5a798cdffb",
            measurementId: "G-PR3BRMJ849"
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