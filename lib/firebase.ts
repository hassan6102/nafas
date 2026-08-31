import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA1jQa2Bo9U7UBDRWjSLHbY8Q42xbOlA8k",
  authDomain: "bag-store-app-55b26.firebaseapp.com",
  projectId: "bag-store-app-55b26",
  storageBucket: "bag-store-app-55b26.firebasestorage.app",
  messagingSenderId: "876785296161",
  appId: "1:876785296161:web:320fea9a586bf48f84d460",
  measurementId: "G-M6YS1LFRCD"
};

// التأكد من عدم تشغيل فايربيز أكثر من مرة مع Next.js
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// تفعيل قاعدة البيانات وتخزين الصور
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };