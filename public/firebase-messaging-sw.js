importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDRiwDTjOch_F-3FYyVDzgnH1XoqLkfoEU",
  authDomain: "curevan-992eb.firebaseapp.com",
  projectId: "curevan-992eb",
  storageBucket: "curevan-992eb.firebasestorage.app",
  messagingSenderId: "648980445779",
  appId: "1:648980445779:web:32db8f825fc857dfbc24a6"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
