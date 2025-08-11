
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAzIPd4n7VILDv92bQizHPqh-_CAg7g93w",
  authDomain: "uideverse.firebaseapp.com",
  projectId: "uideverse",
  storageBucket: "uideverse.firebasestorage.app",
  messagingSenderId: "662598833560",
  appId: "1:662598833560:web:517fcde527d8d9bb3d07ed"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
