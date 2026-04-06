/* eslint-disable no-undef */
// This service worker file is REQUIRED to receive push notifications when the PWA is running in the background.

importScripts("https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js");

// IMPORTANT: Replace these with your actual Firebase Project keys.
// Service workers cannot securely read Next.js process.env variables natively without Webpack injection plugins, 
// so you must paste your standard public config here.
const firebaseConfig = {
  apiKey: "AIzaSyBLmz9lYc4y2xuiSXEdSK_Ra57eRxT8dnY",
  authDomain: "routine-tracker-4205f.firebaseapp.com",
  projectId: "routine-tracker-4205f",
  storageBucket: "routine-tracker-4205f.firebasestorage.app",
  messagingSenderId: "930249534656",
  appId: "1:930249534656:web:70b51221c44db0edcb1125",
  measurementId: "G-XZ4LYDM5QW"
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
