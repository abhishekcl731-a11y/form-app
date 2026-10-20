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

const BACKEND_URL = "https://script.google.com/macros/s/AKfycbxbmS8Aug0xRwvm-6EZ57pMm-yclzXAi9faKIg2NoOmnIe0XK0p7Q44PF-n_5ZD0IuZwg/exec";
const allowedUsers = ["abhishekcl731@gmail.com"];

const loginBtn = document.getElementById("login-btn");
const userInfo = document.getElementById("user-info");
const appSection = document.getElementById("app-section");
const authSection = document.getElementById("auth-section");
const verifyCheck = document.getElementById("verify-check");
const saveBtn = document.getElementById("save-btn");
const formImageInput = document.getElementById("form-image");
const ocrStatus = document.getElementById("ocr-status");

if (loginBtn) {
    loginBtn.addEventListener("click", () => {
        signInWithPopup(auth, provider).catch((error) => {
            console.error("Login Error:", error.message);
        });
    });
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        if (allowedUsers.includes(user.email)) {
            if(authSection) authSection.style.display = "none";
            if(userInfo) {
                userInfo.style.display = "block";
                userInfo.innerText = `Logged in as: ${user.email}`;
            }
            if(appSection) appSection.style.display = "block";
            checkEmptyFields();
        } else {
            alert("Access Denied: Aapka email authorized nahi hai!");
            signOut(auth);
        }
    } else {
        if(authSection) authSection.style.display = "block";
        if(userInfo) userInfo.style.display = "none";
        if(appSection) appSection.style.display = "none";
    }
});

function checkEmptyFields() {
    const inputs = document.querySelectorAll(".val-input");
    inputs.forEach(input => {
        if (input.value.trim() === "") {
            input.classList.add("error-field");
        } else {
            input.classList.remove("error-field");
        }
    });
}

document.querySelectorAll(".val-input").forEach(input => {
    input.addEventListener("input", checkEmptyFields);
});

formImageInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById("IMAGE_NAME").value = file.name;
    
    // Clean Status Message 1
    ocrStatus.innerText = "Analyzing...";
    ocrStatus.style.color = "#2563eb";
    ocrStatus.style.background = "#eff6ff";

    try {
        const base64Data = await toBase64(file);
        const cleanBase64 = base64Data.split(',')[1];

        ocrStatus.innerText = "Processing...";

        const response = await fetch(BACKEND_URL, {
            method: "POST",
            body: JSON.stringify({
                imageBytes: cleanBase64,
                mimeType: file.type || "image/jpeg"
            })
        });

        const rawText = await response.text();
        let result;
        try {
            result = JSON.parse(rawText);
        } catch (jsonErr) {
            throw new Error("Invalid server response format.");
        }
        
        if (result.success && result.data) {
            const extractedData = result.data;
            let filledCount = 0;
            let blankCount = 0;

            Object.keys(extractedData).forEach(key => {
                const inputElement = document.getElementById(key);
                if (inputElement && extractedData[key] !== undefined && extractedData[key] !== null) {
                    inputElement.value = extractedData[key];
                    if(extractedData[key].toString().trim() !== "") filledCount++;
                    else blankCount++;
                }
            });

            // Save detailed logs to localStorage for logs.html
            saveSystemLog({
                timestamp: new Date().toISOString(),
                status: "SUCCESS",
                fileName: file.name,
                filled: filledCount,
                blank: blankCount
            });

            // Clean Status Message 2
            ocrStatus.innerText = `Completed: ${filledCount} columns filled, ${blankCount} blank fields.`;
            ocrStatus.style.color = "#16a34a";
            ocrStatus.style.background = "#f0fdf4";
            checkEmptyFields();
        } else {
            throw new Error(result.error || "Extraction failed.");
        }

    } catch (err) {
        console.error("AI Error:", err);
        saveSystemLog({
            timestamp: new Date().toISOString(),
            status: "FAILED",
            fileName: file.name,
            error: err.message
        });
        ocrStatus.innerText = "Notice: AI extraction failed. You can manually fill fields.";
        ocrStatus.style.color = "#dc2626";
        ocrStatus.style.background = "#fef2f2";
        checkEmptyFields();
    }
});

function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

function saveSystemLog(logData) {
    let logs = JSON.parse(localStorage.getItem("gemini_form_logs") || "[]");
    logs.unshift(logData);
    if(logs.logs > 50) logs = logs.slice(0, 50); // keep last 50
    localStorage.setItem("gemini_form_logs", JSON.stringify(logs));
}

if(verifyCheck) {
    verifyCheck.addEventListener("change", (e) => {
        saveBtn.disabled = !e.target.checked;
    });
}

if(saveBtn) {
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
        let blankCount = 0;

        fields.forEach(field => {
            const el = document.getElementById(field);
            const val = el ? el.value.trim() : "";
            formData[field] = val;
            if (val === "") blankCount++;
        });

        if (blankCount > 0) {
            const proceed = confirm(`Warning: ${blankCount} fields are still blank. Proceed with saving?`);
            if (!proceed) return;
        }

        try {
            const docRef = await addDoc(collection(db, "medical_insurance_forms"), {
                user: auth.currentUser.email,
                timestamp: new Date(),
                data: formData
            });
            alert("Data successfully saved to Firebase Database! Record ID: " + docRef.id);
            
            document.querySelectorAll(".val-input").forEach(input => input.value = "");
            verifyCheck.checked = false;
            saveBtn.disabled = true;
            ocrStatus.innerText = "";
            ocrStatus.style.background = "transparent";
            checkEmptyFields();

        } catch (e) {
            console.error("Error saving data: ", e);
            alert("Error saving data to database.");
        }
    });
}
