import { Firestore } from '@google-cloud/firestore';
import {
    DATABASE_ID,
} from './common';

const localGCPCredentials = './.gcp/google-service-account.json';
const PROJECT_ID = 'pure-lantern-394915';

let firestoreInstance = null;

export function getServerFirestore() {
    if (firestoreInstance) {
        return firestoreInstance;
    }

    firestoreInstance = new Firestore({
        projectId: PROJECT_ID,
        databaseId: DATABASE_ID,
        keyFilename: process.env.NODE_ENV === 'development' ? localGCPCredentials : undefined,
    });
    firestoreInstance.settings({ ignoreUndefinedProperties: true });
    return firestoreInstance;
}
