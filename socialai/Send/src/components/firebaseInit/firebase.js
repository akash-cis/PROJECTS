// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDjbYsINuNm_Ug-KPsKWcrXyEmmLtHwUOs",
  authDomain: "smai-web-push-notif-dev.firebaseapp.com",
  projectId: "smai-web-push-notif-dev",
  storageBucket: "smai-web-push-notif-dev.appspot.com",
  messagingSenderId: "266960323273",
  appId: "1:266960323273:web:034ce7ec3cba5dc9788318",
  measurementId: "G-V5RQN7SXZX",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

export default app
