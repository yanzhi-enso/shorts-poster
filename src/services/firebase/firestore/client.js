import { getFirestore } from 'firebase/firestore';
import { app } from '../base/client';
import { DATABASE_ID } from './common';

export const db = getFirestore(app, DATABASE_ID);
