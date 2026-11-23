import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBWk_tAEqqghs1eMzYGPMFCwQaR_kbmG0Q',
  authDomain: 'queldrin-608a0.firebaseapp.com',
  projectId: 'queldrin-608a0',
  storageBucket: 'queldrin-608a0.firebasestorage.app',
  messagingSenderId: '808708822406',
  appId: '1:808708822406:web:a50269ea18b7c114bdc807',
  measurementId: 'G-RYRJZWXBP5'
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
