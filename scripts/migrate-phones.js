/**
 * Migrate old phone number formats to canonical E.164 (+880XXXXXXXXXX).
 *
 * Matches the Dart PhoneUtils.toCanonical() logic:
 *   01XXXXXXXXX  → +8801XXXXXXXXX
 *  +8801XXXXXXXXX → +8801XXXXXXXXX (unchanged)
 *   8801XXXXXXXXX → +8801XXXXXXXXX
 *  008801XXXXXXXXX → +8801XXXXXXXXX
 *
 * Run: node scripts/migrate-phones.js
 */

// Load .env.local
try {
  process.loadEnvFile(".env.local");
} catch {
  console.warn("Could not load .env.local, relying on existing env vars");
}

const { cert, initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const appName = "phone-migration";
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

/** Mirrors Dart's PhoneUtils.toCanonical() */
function toCanonical(phone) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("0")) {
    return "+880" + digits.substring(1);
  }
  if (digits.length === 14 && digits.startsWith("00880")) {
    return "+" + digits.substring(2);
  }
  if (digits.length === 13 && digits.startsWith("880")) {
    return "+" + digits;
  }
  return digits;
}

async function migrate() {
  console.log(`Migrating phone numbers in collection: "${COLLECTION}"`);

  const snapshot = await db.collection(COLLECTION).get();
  const total = snapshot.docs.length;
  console.log(`Found ${total} users`);

  let migrated = 0;
  let skipped = 0;

  let batch = db.batch();
  let opCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const original = data.mobileNumber || "";
    const canonical = toCanonical(original);

    if (original === canonical) {
      skipped++;
      continue;
    }

    const ref = db.collection(COLLECTION).doc(doc.id);
    batch.update(ref, { mobileNumber: canonical });
    opCount++;
    migrated++;

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

  console.log(`\nDone. ${migrated} migrated, ${skipped} already canonical`);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
