/**
 * Scan for old subcollections under users/{uid}/ that may exist from a
 * previous version of the app. Reports the count of documents found.
 *
 * Run: node scripts/scan-subcollections.js
 */

try {
  process.loadEnvFile(".env.local");
} catch {
  console.warn("Could not load .env.local, relying on existing env vars");
}

const { cert, initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const appName = "subcollection-scan";
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

/** Subcollection names the old app may have used (now stored at top-level). */
const SUSPECT_SUBCOLLECTIONS = [
  "notifications",
  "donations",
  "blood_requests",
  "contacts",
  "feedbacks",
  "chat",
  "chats",
  "requests",
];

async function scan() {
  const snapshot = await db.collection(COLLECTION).get();
  console.log(`Total users: ${snapshot.docs.length}\n`);

  // Phase 1: find which users have which subcollections (just check existence)
  const found = {};
  for (const userDoc of snapshot.docs) {
    for (const sub of SUSPECT_SUBCOLLECTIONS) {
      const ref = db.collection(COLLECTION).doc(userDoc.id).collection(sub);
      const subSnap = await ref.limit(1).get();
      if (subSnap.size > 0) {
        if (!found[sub]) found[sub] = [];
        found[sub].push(userDoc.id);
      }
    }
  }

  if (Object.keys(found).length === 0) {
    console.log("No old subcollections found under any user. Nothing to delete.");
    console.log("Done.");
    return;
  }

  console.log("=== Old subcollections detected ===\n");
  for (const [name, uids] of Object.entries(found)) {
    console.log(`  "${name}": ${uids.length} users`);
    for (const uid of uids.slice(0, 5)) {
      console.log(`    - ${uid}`);
    }
    if (uids.length > 5) console.log(`    ... and ${uids.length - 5} more`);
  }

  // Phase 2: get doc counts (sample first 5 users per subcollection)
  console.log("\n=== Document counts (sampling first 5 users per subcollection) ===");
  const totalBySub = {};
  for (const [name, uids] of Object.entries(found)) {
    totalBySub[name] = 0;
    const sample = uids.slice(0, 5);
    for (const uid of sample) {
      const ref = db.collection(COLLECTION).doc(uid).collection(name);
      const subSnap = await ref.get();
      console.log(`  ${uid}/${name}: ${subSnap.size} docs`);
      totalBySub[name] += subSnap.size;
    }
    console.log(`  Subtotal for "${name}" (${sample.length} users): ${totalBySub[name]} docs`);
  }

  const overallTotal = Object.values(totalBySub).reduce((a, b) => a + b, 0);
  console.log(`\nEstimated total documents across all sampled users: ${overallTotal}`);
  console.log("\nDone.");
}

scan().catch((err) => {
  console.error("Scan failed:", err);
  process.exit(1);
});
