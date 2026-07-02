import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface SendRequest {
  title: string;
  body: string;
  link?: string;
  target: "all" | "country" | "selected";
  country?: string;
  userIds?: string[];
}

export async function POST(request: NextRequest) {
  if (!process.env.FIREBASE_PROJECT_ID) {
    return NextResponse.json(
      { success: false, error: "Firebase not configured" },
      { status: 500 }
    );
  }

  try {
    const { getDb, getMessagingInstance } = await import(
      "@/lib/firebase/admin"
    );
    const { COLLECTION_NAMES } = await import("@/lib/constants");
    const body: SendRequest = await request.json();

    if (!body.title || !body.body) {
      return NextResponse.json(
        { success: false, error: "title and body are required" },
        { status: 400 }
      );
    }

    const messageData: Record<string, string> = {
      type: "admin",
      title: body.title,
    };
    if (body.link) {
      messageData.link = body.link;
    }

    const db = getDb();
    const usersCollection =
      process.env.FIREBASE_USERS_COLLECTION || COLLECTION_NAMES.USERS;

    if (body.target === "selected") {
      // ─── Selected Users → save per-user doc to notifications ───
      if (!body.userIds || body.userIds.length === 0) {
        return NextResponse.json(
          { success: false, error: "userIds array is required for target=selected" },
          { status: 400 }
        );
      }

      // Save 1 notification doc per user so it appears in their personal Notifications tab
      const batch = db.batch();
      for (const uid of body.userIds) {
        const notifRef = db.collection("notifications").doc();
        batch.set(notifRef, {
          uid,
          title: body.title,
          body: body.body,
          type: "admin",
          data: {},
          link: body.link || null,
          read: false,
          createdAt: new Date(),
        });
      }
      await batch.commit();

      // Collect FCM tokens for push
      const tokens: string[] = [];
      for (let i = 0; i < body.userIds.length; i += 30) {
        const batchIds = body.userIds.slice(i, i + 30);
        const snap = await db
          .collection(usersCollection)
          .where("__name__", "in", batchIds)
          .get();

        snap.docs.forEach((doc) => {
          const token = doc.data().token as string | undefined;
          if (token && token.length > 0) {
            tokens.push(token);
          }
        });
      }

      if (tokens.length === 0) {
        return NextResponse.json({
          success: true,
          sentCount: 0,
          message: "No FCM tokens found for selected users (notifications saved)",
        });
      }

      const messaging = getMessagingInstance();
      const response = await messaging.sendEachForMulticast({
        tokens,
        notification: {
          title: body.title,
          body: body.body,
        },
        data: messageData,
      });

      return NextResponse.json({
        success: true,
        sentCount: response.successCount,
        failedCount: response.failureCount,
        method: "multicast",
        notificationDocs: body.userIds.length,
      });
    }

    // ─── All Users / By Country → save 1 doc to announcements ───
    const announcementData: Record<string, unknown> = {
      title: body.title,
      body: body.body,
      type: "admin",
      target: body.target,
      data: {},
      link: body.link || null,
      createdAt: new Date(),
    };

    if (body.target === "country") {
      if (!body.country) {
        return NextResponse.json(
          { success: false, error: "country is required for target=country" },
          { status: 400 }
        );
      }
      announcementData.country = body.country;

      // Save announcement doc
      await db.collection("announcements").add(announcementData);

      // Query users by country for FCM tokens
      const snap = await db
        .collection(usersCollection)
        .where("country", "==", body.country)
        .get();

      const tokens: string[] = [];
      snap.docs.forEach((doc) => {
        const token = doc.data().token as string | undefined;
        if (token && token.length > 0) {
          tokens.push(token);
        }
      });

      if (tokens.length === 0) {
        return NextResponse.json({
          success: true,
          sentCount: 0,
          message: "No users found with FCM tokens in this country",
        });
      }

      const messaging = getMessagingInstance();
      const response = await messaging.sendEachForMulticast({
        tokens,
        notification: {
          title: body.title,
          body: body.body,
        },
        data: messageData,
      });

      return NextResponse.json({
        success: true,
        sentCount: response.successCount,
        failedCount: response.failureCount,
        method: "multicast",
      });
    }

    // target === "all"
    await db.collection("announcements").add(announcementData);

    const messaging = getMessagingInstance();
    const response = await messaging.send({
      topic: "all_users",
      notification: {
        title: body.title,
        body: body.body,
      },
      data: messageData,
    });

    return NextResponse.json({ success: true, response, method: "topic" });
  } catch (error) {
    console.error("Notification send error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send",
      },
      { status: 500 }
    );
  }
}
