importScripts("https://www.gstatic.com/firebasejs/8.2.0/firebase-app.js")
importScripts("https://www.gstatic.com/firebasejs/8.2.0/firebase-messaging.js")

const firebaseConfig = {
  apiKey: "AIzaSyDjbYsINuNm_Ug-KPsKWcrXyEmmLtHwUOs",
  authDomain: "smai-web-push-notif-dev.firebaseapp.com",
  projectId: "smai-web-push-notif-dev",
  storageBucket: "smai-web-push-notif-dev.appspot.com",
  messagingSenderId: "266960323273",
  appId: "1:266960323273:web:034ce7ec3cba5dc9788318",
  measurementId: "G-V5RQN7SXZX",
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("../firebase-messaging-sw.js")
    .then(function(registration) {
      console.log("Service Worker Registered")
      messaging.useServiceWorker(registration)
    })
}

// Initialize Firebase
firebase.initializeApp(firebaseConfig)

// Retrieve firebase messaging
const messaging = firebase.messaging()

messaging.onBackgroundMessage(function(payload) {
  const notificationTitle = payload.notification.title
  const notificationOptions = {
    body: payload.notification.body,
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})
