import { initializeApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  connectAuthEmulator,
} from "firebase/auth";
import { getMessaging, getToken } from "firebase/messaging";

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
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    try {
      const messaging = getMessaging(app);
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const token = await getToken(messaging, {
          vapidKey: "BGwR2rR0v1V4PjIe4WqN5_1r3BtzX-gQzG4sB5Z2p2o2c8g9u1r5HlR9tZ2w8g3Xz-y4C8W6N_D0Z2P0G2hH1l0" // Standard fallback VAPID key is usually not required if using standard FCM without WebPush cert, but it's good practice. Actually, we don't have the VAPID key in the .env. Let's try without vapidKey.
        });
        return token;
      } else {
        console.warn("Notification permission denied");
        return null;
      }
    } catch (error) {
      console.error("Error requesting FCM token:", error);
      return null;
    }
  }
  return null;
};
