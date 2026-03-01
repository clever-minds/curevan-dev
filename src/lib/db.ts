

import { initializeApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

let db: Firestore;
let storage;

const serviceAccountString = process.env.GOOGLE_APPLICATION_CREDENTIALS;

// Check if the app is already initialized to prevent errors
if (!getApps().length) {
  if (serviceAccountString) {
    try {
      const serviceAccount: ServiceAccount = JSON.parse(serviceAccountString);
      initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      console.log("Firebase Admin SDK initialized with service account from ENV var.");
    } catch (error) {
      console.error("Failed to parse GOOGLE_APPLICATION_CREDENTIALS. Initializing with default credentials...", error);
      // Fallback for deployed environments
      initializeApp({
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    }
  } else {
    // This will work in deployed Google Cloud environments (like App Hosting)
    // where credentials are automatically provided.
    initializeApp({
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    console.log("Firebase Admin SDK initialized with default credentials.");
  }
}

db = getFirestore();
storage = getStorage();

export { db, storage };
