/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyCm_QBV-nPHs5zBw0UsuQ5ZgBy3HvDwm1s',
  authDomain: 'seol-study.firebaseapp.com',
  projectId: 'seol-study',
  storageBucket: 'seol-study.firebasestorage.app',
  messagingSenderId: '591614554046',
  appId: '1:591614554046:web:0dffc1ebeb1a90e465d3ef',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  console.log('[SW] 백그라운드 메시지 수신:', payload)

  const title = payload.notification?.title || '새 알림'
  const options = {
    body: payload.notification?.body || '',
    icon: '/favicon.ico',
    data: payload.data,
  }

  self.registration.showNotification(title, options)
})
