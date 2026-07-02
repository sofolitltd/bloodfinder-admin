/**
 * Delete old subcollections under users/{uid}/ that now live as top-level
 * collections (e.g. users/{uid}/notifications → notifications/{docId}).
 *
 * Run: node scripts/delete-subcollections.js
 *
 * WARNING: This is destructive. It permanently deletes documents from
 * the users/{uid}/notifications subcollection (and any others listed).
 */

try {
  process.loadEnvFile(".env.local");
} catch {
  console.warn("Could not load .env.local, relying on existing env vars");
}

const { cert, initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

const appName = "subcollection-delete";
if (!getApps().find((a) => a.name === appName)) {
  initializeApp(
    {
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    },
    appName
  );
}
const db = getFirestore(getApps().find((a) => a.name === appName));
const COLLECTION = process.env.FIREBASE_USERS_COLLECTION || "users";

/** Subcollections to delete (confirmed to exist from scan). */
const SUBCOLLECTIONS = [
  "notifications",
  "donation",   // singular — old app stored as users/{uid}/donation/{docId}
];

const BATCH_LIMIT = 450; // stay under Firestore's 500-op batch limit

async function deleteSubcollection(uid, subName) {
  const ref = db.collection(COLLECTION).doc(uid).collection(subName);
  const docs = await ref.get();
  if (docs.empty) return 0;

  let deleted = 0;
  let batch = db.batch();
  let ops = 0;

  for (const doc of docs.docs) {
    batch.delete(doc.ref);
    ops++;
    deleted++;

    if (ops >= BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }

  if (ops > 0) await batch.commit();
  return deleted;
}

async function run() {
  const snapshot = await db.collection(COLLECTION).get();
  console.log(`Total users: ${snapshot.docs.length}\n`);

  const totals = {};

  for (const userDoc of snapshot.docs) {
    const uid = userDoc.id;
    for (const subName of SUBCOLLECTIONS) {
      const count = await deleteSubcollection(uid, subName);
      if (count > 0) {
        if (!totals[subName]) totals[subName] = { users: 0, docs: 0 };
        totals[subName].users++;
        totals[subName].docs += count;
        console.log(`  Deleted ${count} doc(s) from ${uid}/${subName}`);
      }
    }
  }

  console.log("\n=== Summary ===");
  if (Object.keys(totals).length === 0) {
    console.log("  Nothing to delete.");
  } else {
    for (const [name, t] of Object.entries(totals)) {
      console.log(`  "${name}": ${t.users} users, ${t.docs} documents deleted`);
    }
  }
  console.log("\nDone.");
}

run().catch((err) => {
  console.error("Delete failed:", err);
  process.exit(1);
});
