// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// Configuración de tu proyecto principal
const firebaseConfig = {
  apiKey: "AIzaSyAzIPd4n7VILDv92bQizHPqh-_CAg7g93w",
  authDomain: "uideverse.firebaseapp.com",
  projectId: "uideverse",
  storageBucket: "uideverse.firebasestorage.app",
  messagingSenderId: "662598833560",
  appId: "1:662598833560:web:517fcde527d8d9bb3d07ed"
};



// Initialize Firebase apps with different names
const app = initializeApp(firebaseConfig); // Default app

// Services for your main project
const auth = getAuth(app);
const db = getFirestore(app);



export {
  app,
  auth,
  db
};