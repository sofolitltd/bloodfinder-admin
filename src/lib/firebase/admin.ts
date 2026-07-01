import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getMessaging, Messaging } from "firebase-admin/messaging";

let _db: Firestore | null = null;
let _messaging: Messaging | null = null;

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
      },
      appName
    );
  }

  _db = getFirestore(getApps().find((app) => app.name === appName)!);
  _messaging = getMessaging(getApps().find((app) => app.name === appName)!);
}

export function getDb(): Firestore {
  if (!_db) init();
  return _db!;
}

export function getMessagingInstance(): Messaging {
  if (!_messaging) init();
  return _messaging!;
}

// Re-export for convenience
export const db = {
  collection: (path: string) => getDb().collection(path),
};
