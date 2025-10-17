import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyAKpQKqeVU0DJGORwRbqSa8JHam4XOhGoc",
    authDomain: "admin-login-244c5.firebaseapp.com",
    projectId: "admin-login-244c5",
    storageBucket: "admin-login-244c5.appspot.com",
    messagingSenderId: "941394599113",
    appId: "1:941394599113:web:414b4500f2569232660118",
    measurementId: "G-741749BB0N"
};




const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);