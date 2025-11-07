import { Firestore } from '@google-cloud/firestore';
import { randomUUID } from 'crypto';
import { buildProjectRecord } from 'storage/utils/projectRecord.js';
import {
    COLLECTIONS,
    SUBCOLLECTIONS,
    OUTPUT_VIDEO_STATUS,
    SCENE_SUBCOLLECTIONS,
    DATABASE_ID,
} from './common';
import { getOutputVideoFilePath, OUTPUT_VIDEO_FILE_NAMES, getPublicGCSUrl } from 'services/gcs.js';

const localGCPCredentials = './.gcp/google-service-account.json';
const PROJECT_ID = 'pure-lantern-394915';

let firestoreInstance = null;

function getFirestoreInstance() {
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
