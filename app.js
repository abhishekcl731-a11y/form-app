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

const allowedUsers = [
    "abhishekcl731@gmail.com"
];

const loginBtn = document.getElementById("login-btn");
const userInfo = document.getElementById("user-info");
const appSection = document.getElementById("app-section");
const verifyCheck = document.getElementById("verify-check");
const saveBtn = document.getElementById("save-btn");
const formImageInput = document.getElementById("form-image");
const ocrStatus = document.getElementById("ocr-status");

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
            checkEmptyFields(); // Run initial check
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

// Function to highlight empty fields in Red
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

// Listen to input changes to update red highlights dynamically
document.querySelectorAll(".val-input").forEach(input => {
    input.addEventListener("input", checkEmptyFields);
});

// Image Upload & OCR Processing
formImageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById("IMAGE_NAME").value = file.name;
    ocrStatus.innerText = "Processing OCR... Please wait (Scanning text from image)";

    Tesseract.recognize(
        file,
        'eng',
        { logger: m => console.log(m) }
    ).then(({ data: { text } }) => {
        ocrStatus.innerText = "OCR Scan Completed! Review fields below (blank fields are highlighted in red).";
        parseAndFillOCRText(text);
        checkEmptyFields(); // Refresh highlights after OCR attempt
    }).catch(err => {
        console.error(err);
        ocrStatus.innerText = "OCR Error: Failed to read image text.";
        checkEmptyFields();
    });
});

function parseAndFillOCRText(text) {
    const lines = text.split('\n');
    lines.forEach(line => {
        let upperLine = line.toUpperCase();
        if (upperLine.includes("POLICY")) {
            let parts = line.split(/[:,-]/);
            if(parts[1]) document.getElementById("POLICY_NO").value = parts[1].trim();
        }
        if (upperLine.includes("NAME")) {
            let parts = line.split(/[:,-]/);
            if(parts[1] && !document.getElementById("CUSTOMER_NAME").value) {
                document.getElementById("CUSTOMER_NAME").value = parts[1].trim();
            }
        }
        if (upperLine.includes("RECORD")) {
            let parts = line.split(/[:,-]/);
            if(parts[1]) document.getElementById("RECORD_NO").value = parts[1].trim();
        }
    });
}

verifyCheck.addEventListener("change", (e) => {
    saveBtn.disabled = !e.target.checked;
});

// Save Data with Blank Fields Warning Prompt
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
        const val = document.getElementById(field).value.trim();
        formData[field] = val;
        if (val === "") {
            blankCount++;
        }
    });

    // If there are blank fields, ask user for confirmation before proceeding
    if (blankCount > 0) {
        const proceed = confirm(`Warning: ${blankCount} fields are still blank. Do you still want to proceed with saving?`);
        if (!proceed) {
            return; // Exit and let user fill out the form
        }
    }

    try {
        const docRef = await addDoc(collection(db, "medical_insurance_forms"), {
            user: auth.currentUser.email,
            timestamp: new Date(),
            data: formData
        });
        alert("Data successfully saved to Firebase Database! Record ID: " + docRef.id);
        
        // Reset form
        document.querySelectorAll(".val-input").forEach(input => input.value = "");
        verifyCheck.checked = false;
        saveBtn.disabled = true;
        ocrStatus.innerText = "";
        checkEmptyFields();

    } catch (e) {
        console.error("Error saving data: ", e);
        alert("Error saving data to database.");
    }
});
