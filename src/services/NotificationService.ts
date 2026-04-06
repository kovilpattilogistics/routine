import { messaging } from "@/lib/firebase";
import { getToken } from "firebase/messaging";
import { DatabaseService } from "./DatabaseService";

export class NotificationService {
  /**
   * Prompts the user for notification permissions and retrieves the FCM token.
   * Resolves with the token if successful, or null if denied/failed.
   */
  public static async enablePushNotifications(userId: string): Promise<string | null> {
    if (!messaging) {
      console.warn("Messaging not supported by the browser.");
      return null;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.warn("Notification permission denied by user.");
        return null;
      }

      // We use a dummy VAPID key wrapper here. The real key MUST be configured in environment.
      // Usually provided via process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        console.warn("No VAPID key found. Push notifications will not work in production without it.");
        return null;
      }

      const token = await getToken(messaging, { vapidKey });
      
      if (token) {
        // Save the token to the user profile
        await DatabaseService.getInstance().updateUserProfile(userId, {
          fcmToken: token
        });
        return token;
      } else {
        console.warn("No registration token available. Request permission to generate one.");
        return null;
      }
    } catch (err) {
      console.error("An error occurred while retrieving token: ", err);
      return null;
    }
  }
}
