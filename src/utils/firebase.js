import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { registerFcmToken } from '@/api/notification/notificationApi'

const firebaseConfig = {
  apiKey: 'AIzaSyCm_QBV-nPHs5zBw0UsuQ5ZgBy3HvDwm1s',
  authDomain: 'seol-study.firebaseapp.com',
  projectId: 'seol-study',
  storageBucket: 'seol-study.firebasestorage.app',
  messagingSenderId: '591614554046',
  appId: '1:591614554046:web:0dffc1ebeb1a90e465d3ef',
}

const VAPID_KEY = 'BGqb_AcCuWNYZOJZ1Jl1WCPbWWf9WMPEimJjCHJvc3ZPrdHmfJpKUEYu6G2glcS7oZom_I-ZnXBD0UwOYiYMFgA'

const app = initializeApp(firebaseConfig)
let messaging = null

try {
  messaging = getMessaging(app)
} catch (err) {
  console.warn('[Firebase] 메시징 초기화 실패 (지원하지 않는 브라우저):', err)
}

/**
 * 알림 권한 요청 + FCM 토큰 발급 + 백엔드 등록
 */
export async function requestNotificationPermission(memberId) {
  if (!messaging) {
    console.warn('[Firebase] 메시징이 지원되지 않는 환경입니다.')
    return
  }

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.log('[Firebase] 알림 권한 거부됨')
      return
    }

    // Service Worker 등록
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')

    // FCM 토큰 발급
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    })

    if (token) {
      console.log('[Firebase] FCM 토큰 발급 완료')
      // 백엔드에 토큰 등록
      await registerFcmToken(memberId, token)
      console.log('[Firebase] FCM 토큰 백엔드 등록 완료')
    }
  } catch (err) {
    console.error('[Firebase] 알림 설정 실패:', err)
  }
}

/**
 * 포그라운드 메시지 수신 리스너
 */
export function onForegroundMessage(callback) {
  if (!messaging) return
  onMessage(messaging, (payload) => {
    console.log('[Firebase] 포그라운드 메시지 수신:', payload)
    callback(payload)
  })
}
