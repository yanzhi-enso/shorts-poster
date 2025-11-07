import { initializeApp } from 'firebase/app';

// Firebase configuration - these should be set as environment variables
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_KEY, // note for firestore, this is actually not necessary
    authDomain: 'pure-lantern-394915.firebaseapp.com',
    projectId: 'pure-lantern-394915',
    storageBucket: 'pure-lantern-394915.firebasestorage.app',
    messagingSenderId: '291823411154',
    appId: '1:291823411154:web:89fb1699174eabf2f1f20b',
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
