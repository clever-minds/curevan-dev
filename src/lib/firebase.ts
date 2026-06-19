import { initializeApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  connectAuthEmulator,
} from "firebase/auth";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

export const listenForMessages = (callback: (payload: any) => void) => {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    try {
      const messaging = getMessaging(app);
      return onMessage(messaging, callback);
    } catch (err) {
      console.error("Error setting up onMessage listener:", err);
    }
  }
  return null;
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Optional: Emulator for dev
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true") {
  connectAuthEmulator(auth, "http://localhost:9099");
}

// Extend window for TypeScript
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

// Singleton reCAPTCHA instance
let recaptchaVerifierInstance: RecaptchaVerifier | null = null;

export const resetRecaptcha = () => {
  if (recaptchaVerifierInstance) {
    try {
      recaptchaVerifierInstance.clear();
    } catch (e) {
      console.warn("Error clearing reCAPTCHA instance:", e);
    }
    recaptchaVerifierInstance = null;
  }
};

export const setupRecaptcha = (containerId: string = "recaptcha-container"): RecaptchaVerifier => {
  if (typeof window === "undefined") throw new Error("window is undefined");

  // If container doesn't exist in DOM, reset the instance
  if (!document.getElementById(containerId)) {
    resetRecaptcha();
  }

  if (!recaptchaVerifierInstance) {
    recaptchaVerifierInstance = new RecaptchaVerifier(auth,
      containerId,
      { 
        size: "invisible",
        callback: () => {
             console.log("reCAPTCHA solved");
        }
      }
    );
    window.recaptchaVerifier = recaptchaVerifierInstance;
  }

  return recaptchaVerifierInstance;
};

export const sendOTP = async (
  phoneNumber: string
): Promise<ConfirmationResult | null> => {
  try {
    const verifier = setupRecaptcha();
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      verifier
    );
    return confirmationResult;
  } catch (error: any) {
        console.error("Error sending OTP:", error);

    if (error.code === "auth/too-many-requests") {
      alert("Too many OTP requests. Please try again after a few minutes.");
      return null;
    }
    throw error;
  }
};

export const requestFcmToken = async (): Promise<string | null> => {
  console.log("requestFcmToken called.");
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    try {
      console.log("Initializing messaging...");
      const messaging = getMessaging(app);
      console.log("Requesting Notification permission...");
      const permission = await Notification.requestPermission();
      console.log("Notification permission is:", permission);
      
      if (permission === "granted") {
        console.log("Registering service worker...");
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log("Service worker registered. Requesting token...");
        const token = await getToken(messaging, {
          serviceWorkerRegistration: registration,
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
        });
        console.log("FCM Token retrieved successfully.");
        return token;
      } else {
        console.warn("Notification permission denied or default.");
        return null;
      }
    } catch (error) {
      console.error("Error requesting FCM token:", error);
      return null;
    }
  }
  console.warn("Window or serviceWorker not available.");
  return null;
};
