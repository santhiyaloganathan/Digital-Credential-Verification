const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 5000;

// ================================
// MIDDLEWARE
// ================================

app.use(cors());
app.use(express.json());

// ================================
// FRONTEND
// ================================

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ================================
// DATA STORAGE
// ================================

const dataFolder = path.join(__dirname, "data");
const dataFile = path.join(dataFolder, "credentials.json");

if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder);
}

if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, "[]");
}

function getCredentials() {
    try {
        return JSON.parse(fs.readFileSync(dataFile, "utf8"));
    } catch (error) {
        return [];
    }
}

function saveCredentials(credentials) {
    fs.writeFileSync(
        dataFile,
        JSON.stringify(credentials, null, 2)
    );
}

// ================================
// BACKEND TEST
// ================================

app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "ZENVYRA Backend is running!"
    });
});

// ================================
// GENERATE UNIQUE CREDENTIAL ID
// ================================

function generateCredentialId() {

    const credentials = getCredentials();

    let id;

    do {
        const randomNumber = Math.floor(
            100000 + Math.random() * 900000
        );

        id = `ZYV-2026-${randomNumber}`;

    } while (
        credentials.some(
            credential => credential.credentialId === id
        )
    );

    return id;
}

// ================================
// CREATE CREDENTIAL
// ================================

app.post("/api/credentials", (req, res) => {

    try {

        const {
            studentName,
            registerNumber,
            programme,
            institution,
            issueDate
        } = req.body;

        // Required fields
        if (
            !studentName ||
            !registerNumber ||
            !programme ||
            !institution
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required details."
            });
        }

        const credentials = getCredentials();

        // Check duplicate register number
        const existing = credentials.find(
            credential =>
                credential.registerNumber === registerNumber
        );

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "Register number already exists.",
                credentialId: existing.credentialId
            });
        }

        const credentialId = generateCredentialId();

        const newCredential = {

            credentialId,

            studentName,

            registerNumber,

            programme,

            institution,

            issueDate:
                issueDate ||
                new Date().toISOString().split("T")[0],

            status: "VALID",

            createdAt: new Date().toISOString()
        };

        credentials.push(newCredential);

        saveCredentials(credentials);

        res.status(201).json({

            success: true,

            message: "Credential created successfully.",

            credential: newCredential
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server error."
        });
    }
});

// ================================
// VERIFY CREDENTIAL
// ================================

app.get("/api/verify/:credentialId", (req, res) => {

    try {

        const credentialId =
            req.params.credentialId.trim();

        const credentials = getCredentials();

        const credential = credentials.find(
            item =>
                item.credentialId.toLowerCase() ===
                credentialId.toLowerCase()
        );

        if (!credential) {

            return res.status(404).json({

                success: false,

                verified: false,

                message: "Credential not found."
            });
        }

        res.json({

            success: true,

            verified: true,

            message: "Credential verified successfully.",

            credential
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            verified: false,

            message: "Verification failed."
        });
    }
});

// ================================
// GET ALL CREDENTIALS
// ================================

app.get("/api/credentials", (req, res) => {

    const credentials = getCredentials();

    res.json({

        success: true,

        count: credentials.length,

        credentials
    });
});

// ================================
// SERVER
// ================================

app.listen(PORT, () => {

    console.log(
        `ZENVYRA Backend running on port ${PORT}`
    );

});