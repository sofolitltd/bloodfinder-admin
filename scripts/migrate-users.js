/**
 * Migrate old user schema to new schema.
 *
 * Old fields removed: currentAddress, district, subdistrict
 * New fields added: locationAddress (copied from currentAddress), savedAddresses (empty array)
 *
 * Run: node scripts/migrate-users.js
 */

// Load .env.local
try {
  process.loadEnvFile(".env.local");
} catch {
  console.warn("Could not load .env.local, relying on existing env vars");
}

const { cert, initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

// Initialize Firebase Admin
const appName = "migration-script";
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

async function migrate() {
  console.log(`Migrating collection: "${COLLECTION}"`);

  const snapshot = await db.collection(COLLECTION).get();
  const total = snapshot.docs.length;
  console.log(`Found ${total} users`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  let batch = db.batch();
  let opCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const ref = db.collection(COLLECTION).doc(doc.id);

    const hasOldFields = "currentAddress" in data || "district" in data || "subdistrict" in data;
    const needsLocation = !("locationAddress" in data) || data.locationAddress === null || data.locationAddress === "";
    const needsSavedAddresses = !("savedAddresses" in data);

    if (!hasOldFields && !needsLocation && !needsSavedAddresses) {
      skipped++;
      continue;
    }

    // Build update payload
    const updates = {};

    // Copy currentAddress → locationAddress
    if (needsLocation && "currentAddress" in data && data.currentAddress) {
      updates.locationAddress = data.currentAddress;
    } else if (needsLocation) {
      updates.locationAddress = "";
    }

    // Remove old fields
    if ("currentAddress" in data) updates.currentAddress = FieldValue.delete();
    if ("district" in data) updates.district = FieldValue.delete();
    if ("subdistrict" in data) updates.subdistrict = FieldValue.delete();

    // Add empty savedAddresses
    if (needsSavedAddresses) {
      updates.savedAddresses = [];
    }

    batch.update(ref, updates);
    opCount++;
    migrated++;

    // Firestore batch limit is 500
    if (opCount >= 400) {
      await batch.commit();
      console.log(`  Batch committed (${migrated}/${total})`);
      batch = db.batch();
      opCount = 0;
    }
  }

  if (opCount > 0) {
    await batch.commit();
    console.log(`  Final batch committed (${migrated}/${total})`);
  }

  console.log(`\nDone. ${migrated} migrated, ${skipped} already up-to-date, ${errors} errors`);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
