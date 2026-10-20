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

// Authorized Email Whitelist
const allowedUsers = [
    "abhishekcl731@gmail.com"
];

const loginBtn = document.getElementById("login-btn");
const userInfo = document.getElementById("user-info");
const appSection = document.getElementById("app-section");
const verifyCheck = document.getElementById("verify-check");
const saveBtn = document.getElementById("save-btn");

loginBtn.addEventListener("click", () => {
    signInWithPopup(auth, provider).catch((error) => {
        console.error("Login Error:", error.message);
    });
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        if (allowedUsers.includes(user.email)) {
            loginBtn.style.display = "none";
            userInfo.style.display = "inline";
            userInfo.innerText = `Logged in as: ${user.email}`;
            appSection.style.display = "block";
        } else {
            alert("Access Denied: Aapka email authorized nahi hai!");
            signOut(auth);
        }
    } else {
        loginBtn.style.display = "block";
        userInfo.style.display = "none";
        appSection.style.display = "none";
    }
});

// Enable/Disable Save Button based on Validation Checkbox
verifyCheck.addEventListener("change", (e) => {
    saveBtn.disabled = !e.target.checked;
});

// Save Data to Firebase Firestore matching VBA schema
saveBtn.addEventListener("click", async () => {
    const fields = [
        "IMAGE_NAME", "RECORD_NO", "EMAIL_ADDRESS", "RES_ADDRESS", "STATE_1", "ZIP_1", 
        "COUNTRY_1", "SEX_1", "HEIGHT", "WEIGHT", "BILLER_NAME", "SHIPPER_NAME", 
        "STATE_2", "ZIP_2", "PH_NO2", "ALCOHOLIC", "PAST_SURG", "DIABETIC", 
        "POLICY_NO", "D_B_LIFE_ASSURE", "NAME_P_HOLDER", "STM_NAME", "DOB", 
        "SEX_2", "MEDICINE", "DOSAGE", "PILL_RATE", "COST", "TOTAL_AMT", "REMARK", 
        "CUSTOMER_NAME", "CITY_1", "PH_NO1", "D_BIRTH", "BLOOD_GP", "CITY_2", 
        "COUNTRY_2", "SMOKER", "ALLERGIESED", "P_INST", "STM_CODE", "CARD_NAME", 
        "TABLETS", "SHIPPING_COST"
    ];

    let formData = {};
    fields.forEach(field => {
        formData[field] = document.getElementById(field).value.trim();
    });

    try {
        const docRef = await addDoc(collection(db, "medical_insurance_forms"), {
            user: auth.currentUser.email,
            timestamp: new Date(),
            data: formData
        });
        alert("Validated data successfully saved to Firebase Database! Record ID: " + docRef.id);
        
        // Reset form & checkbox after successful save
        document.querySelectorAll("input[type='text']").forEach(input => input.value = "");
        verifyCheck.checked = false;
        saveBtn.disabled = true;

    } catch (e) {
        console.error("Error saving data: ", e);
        alert("Error saving data to database.");
    }
});
