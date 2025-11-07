import { getFirestore, collection, doc } from 'firebase/firestore';
import { app } from '../base/client';
import {
    COLLECTIONS,
    SUBCOLLECTIONS,
    SCENE_SUBCOLLECTIONS,
    OUTPUT_VIDEO_STATUS,
    DATABASE_ID,
} from './common';

export { COLLECTIONS, SUBCOLLECTIONS, SCENE_SUBCOLLECTIONS, OUTPUT_VIDEO_STATUS };

export const db = getFirestore(app, DATABASE_ID);
