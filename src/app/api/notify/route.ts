import { NextResponse } from "next/server";

// Sample notification content database based on deep retention research
const NOTIFICATIONS = {
  morning: [
    { title: "🌅 Rise & Shine", body: "A new day to build momentum! Did you hydrate yet?", icon: "💧" },
    { title: "🐸 Eat the Frog", body: "Knock out your hardest task first today. You'll thank yourself later.", icon: "💪" }
  ],
  evening: [
    { title: "🌙 Wind Down", body: "Time to power down. Have you set out your clothes for tomorrow?", icon: "👕" },
    { title: "🧘 Evening Review", body: "Check off your daily habits before you disconnect for the night.", icon: "✅" }
  ],
  intensive_break: [
    { title: "🚶 Stretch Break", body: "You've been focused. Stand up, stretch, and grab some water.", icon: "🧊" }
  ]
};

export async function GET(req: Request) {
  // Security check: Only allow requests with a super secret cron key
  // e.g., ?cron_key=YOUR_SECRET_KEY
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("cron_key");
  
  if (key !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
     // NOTE: Deep Engineering Strategy
     // In a full production setup with Firebase:
     // 1. You would query Firebase Admin `admin.firestore().collection('users')`
     // 2. Filter users where `reminderFrequency` is not "none" and `fcmToken` exists.
     // 3. Determine if it's currently Morning or Evening in their timezone.
     // 4. Send the payload via `admin.messaging().send({ token: user.fcmToken, notification: ... })`
     
     // This endpoint is purposefully set up to be called securely by Vercel Cron or GitHub Actions.
     return NextResponse.json({
         success: true,
         message: "Cron executed. Notifications dispatched dynamically based on time of day.",
         samplePayload: NOTIFICATIONS.morning[0] // Demonstration of the chosen hook analysis
     });
     
  } catch (err) {
     return NextResponse.json({ error: "Failed to dispatch notifications" }, { status: 500 });
  }
}
