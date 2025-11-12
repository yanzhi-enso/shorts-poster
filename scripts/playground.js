import dotenv from 'dotenv';

// Load environment variables for Firestore credentials/configuration.
dotenv.config({ path: '.env.local' });

if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
}

import { getServerFirestore } from 'services/firebase/firestore/server.js';
import { COLLECTION_VIDEOS } from 'services/firebase/firestore/common.js';

async function listVideos() {
    try {
        const firestore = getServerFirestore();
        const snapshot = await firestore.collection(COLLECTION_VIDEOS).get();
        if (snapshot.empty) {
            console.log('No documents found in the videos collection.');
            return;
        }
        console.log(`Found ${snapshot.size} video document(s):`);
        snapshot.docs.forEach((doc) => {
            console.log(`- ${doc.id}:`, doc.data());
        });
    } catch (error) {
        console.error('Failed to list videos:', error);
        process.exitCode = 1;
    }
}

listVideos();