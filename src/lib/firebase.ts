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

// Configuración del proyecto de calidad del aire
const airQualityFirebaseConfig = {
  apiKey: "AIzaSyDgJ0RGa8fQZzu-ZBNKGRg3gK7ywVItWQE",
  authDomain: "eco-sensorair.firebaseapp.com",
  databaseURL: "https://eco-sensorair-default-rtdb.firebaseio.com",
  projectId: "eco-sensorair",
  storageBucket: "eco-sensorair.appspot.com",
  messagingSenderId: "460100885847",
  appId: "1:460100885847:web:763ce49ea1f20386d6f212"
};

// Initialize Firebase apps with different names
const app = initializeApp(firebaseConfig); // Default app
const airQualityApp = initializeApp(airQualityFirebaseConfig, "eco-sensorair"); // Named app

// Services for your main project
const auth = getAuth(app);
const db = getFirestore(app);

// Services for air quality project
const airQualityDb = getDatabase(airQualityApp);
const airQualityAuth = getAuth(airQualityApp);

export { 
  app, 
  auth, 
  db,
  airQualityDb,
  airQualityAuth
};