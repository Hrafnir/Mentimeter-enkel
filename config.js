/* Version: #2 */

// Din konfigurasjon (kopiert fra Google, men tilpasset vår app)
const firebaseConfig = {
  apiKey: "AIzaSyAgLx5nzkS_kzQIM5sNH17oOx4m5iICtRA",
  authDomain: "mentimeter-b5692.firebaseapp.com",
  databaseURL: "https://mentimeter-b5692-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "mentimeter-b5692",
  storageBucket: "mentimeter-b5692.firebasestorage.app",
  messagingSenderId: "717520203326",
  appId: "1:717520203326:web:74d0095edf3a472dd46b6f",
  measurementId: "G-MVFE5KGTF9"
};

// Initialiser Firebase (Sjekker om den allerede kjører for å unngå feil)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Gjør databasen klar til bruk for host.html og client.html
const db = firebase.database();
