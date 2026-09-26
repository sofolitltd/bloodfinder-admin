import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";

const BATCH_CHUNK_SIZE = 400;

async function deleteInChunks(db: Firestore, docs: QueryDocumentSnapshot[]) {
  for (let i = 0; i < docs.length; i += BATCH_CHUNK_SIZE) {
    const batch = db.batch();
    for (const doc of docs.slice(i, i + BATCH_CHUNK_SIZE)) batch.delete(doc.ref);
    await batch.commit();
  }
}

/**
 * Deletes a community and everything that references it: its memberships,
 * any notifications tagged with its id, and its cover image in Storage.
 */
export async function deleteCommunityCascade(id: string): Promise<void> {
  const { getDb, getBucket } = await import("@/lib/firebase/admin");
  const { COLLECTION_NAMES } = await import("@/lib/constants");
  const db = getDb();

  const [membersSnap, notificationsSnap] = await Promise.all([
    db.collection(COLLECTION_NAMES.COMMUNITY_MEMBERS).where("communityId", "==", id).get(),
    db.collection(COLLECTION_NAMES.NOTIFICATIONS).where("data.communityId", "==", id).get(),
  ]);

  await deleteInChunks(db, [...membersSnap.docs, ...notificationsSnap.docs]);
  await db.collection(COLLECTION_NAMES.COMMUNITIES).doc(id).delete();

  try {
    const bucket = getBucket();
    if (bucket) await bucket.file(`communities/${id}.jpg`).delete();
  } catch (error) {
    // No cover image, or Storage isn't configured — safe to ignore.
    console.warn(`Community image cleanup skipped for ${id}:`, error);
  }
}
