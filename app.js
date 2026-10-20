import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBBy0CwwzqNIV-PNUclNtWqZc3L8PndCZo",
  authDomain: "form-app-e0c85.firebaseapp.com",
  projectId: "form-app-e0c85",
  storageBucket: "form-app-e0c85.firebasestorage.app",
  messagingSenderId: "372950928092",
  appId: "1:372950928092:web:5045a0a0e0199d90308219",
  measurementId: "G-WKN6DFHRXG"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Yahan apne authorized emails ki list daal do bhai
const allowedUsers = [
    "abhishekcl731@gmail.com"
    // Agar future mein koi aur email add karni ho toh yahan niche likh sakte ho:
    // "dusraemail@gmail.com"
];

const loginBtn = document.getElementById("login-btn");
const userInfo = document.getElementById("user-info");
const appSection = document.getElementById("app-section");
const addFieldBtn = document.getElementById("add-field-btn");
const dynamicFieldsContainer = document.getElementById("dynamic-fields-container");
const saveBtn = document.getElementById("save-btn");

loginBtn.addEventListener("click", () => {
    signInWithPopup(auth, provider).catch((error) => {
        console.error("Login Error:", error.message);
    });
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        // Check karo ki user allowed list mein hai ya nahi
        if (allowedUsers.includes(user.email)) {
            loginBtn.style.display = "none";
            userInfo.style.display = "inline";
            userInfo.innerText = `Logged in as: ${user.email}`;
            appSection.style.display = "block";
        } else {
            alert("Access Denied: Aapka email authorized nahi hai!");
            signOut(auth); // Unauthorized hone par turant logout kar do
        }
    } else {
        loginBtn.style.display = "block";
        userInfo.style.display = "none";
        appSection.style.display = "none";
    }
});

addFieldBtn.addEventListener("click", () => {
    const row = document.createElement("div");
    row.className = "field-row";
    row.innerHTML = `
        <input type="text" placeholder="Field Name" class="field-key">
        <input type="text" placeholder="Field Value" class="field-val">
    `;
    dynamicFieldsContainer.appendChild(row);
});

saveBtn.addEventListener("click", async () => {
    const rows = document.querySelectorAll(".field-row");
    let formData = {};

    rows.forEach(row => {
        const key = row.querySelector(".field-key").value.trim();
        const val = row.querySelector(".field-val").value.trim();
        if (key) {
            formData[key] = val;
        }
    });

    try {
        const docRef = await addDoc(collection(db, "insurance_forms"), {
            user: auth.currentUser.email,
            timestamp: new Date(),
            data: formData
        });
        alert("Data successfully saved to Firebase! ID: " + docRef.id);
    } catch (e) {
        console.error("Error saving data: ", e);
        alert("Error saving data.");
    }
});
