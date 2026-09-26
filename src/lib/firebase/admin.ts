import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getMessaging, Messaging } from "firebase-admin/messaging";
import { getStorage } from "firebase-admin/storage";
import type { Bucket } from "@google-cloud/storage";

let _db: Firestore | null = null;
let _messaging: Messaging | null = null;
let _bucket: Bucket | null = null;

function getFirebaseConfig() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin environment variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY"
    );
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  };
}

function init() {
  if (_db) return;

  const appName = "bloodfinder-admin";

  if (!getApps().find((app) => app.name === appName)) {
    const config = getFirebaseConfig();

    initializeApp(
      {
        credential: cert({
          projectId: config.projectId,
          clientEmail: config.clientEmail,
          privateKey: config.privateKey,
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || undefined,
      },
      appName
    );
  }

  const app = getApps().find((app) => app.name === appName)!;
  _db = getFirestore(app);
  _messaging = getMessaging(app);
  if (process.env.FIREBASE_STORAGE_BUCKET) {
    _bucket = getStorage(app).bucket();
  }
}

export function getDb(): Firestore {
  if (!_db) init();
  return _db!;
}

export function getMessagingInstance(): Messaging {
  if (!_messaging) init();
  return _messaging!;
}

/** Returns the Storage bucket, or null if FIREBASE_STORAGE_BUCKET is not configured. */
export function getBucket(): Bucket | null {
  if (!_db) init();
  return _bucket;
}

// Re-export for convenience
export const db = {
  collection: (path: string) => getDb().collection(path),
};
