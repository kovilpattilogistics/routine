/* eslint-disable no-undef */
// This service worker file is REQUIRED to receive push notifications when the PWA is running in the background.

importScripts("https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js");

// IMPORTANT: Replace these with your actual Firebase Project keys.
// Service workers cannot securely read Next.js process.env variables natively without Webpack injection plugins, 
// so you must paste your standard public config here.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Background message handler
  messaging.onBackgroundMessage((payload) => {
    console.log("[firebase-messaging-sw.js] Received background message ", payload);
    
    const notificationTitle = payload.notification?.title || "Routine Tracker";
    const notificationOptions = {
      body: payload.notification?.body,
      icon: "/icon.png", // Ensure you have this icon in your public folder
      badge: "/icon.png",
      tag: "routine-notification",
      data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (error) {
  console.log("Failed to initialize Firebase Messaging Service Worker", error);
}
