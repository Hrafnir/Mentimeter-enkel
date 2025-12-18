/* Version: #1 */
// LIM INN DIN FIREBASE CONFIG HER FRA GOOGLE CONSOLE
// Det skal se ca slik ut (men med dine tall og bokstaver):

const firebaseConfig = {
  apiKey: "AIzaSyD......",
  authDomain: "ditt-prosjekt.firebaseapp.com",
  databaseURL: "https://ditt-prosjekt-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "ditt-prosjekt",
  storageBucket: "ditt-prosjekt.appspot.com",
  messagingSenderId: "123456...",
  appId: "1:123456..."
};

// Initialiser Firebase (Ikke endre dette)
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
