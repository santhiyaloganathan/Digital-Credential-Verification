// ============================================================
// ZENVYRA - Digital Credential Verification Backend
// ============================================================

require("dotenv").config();

// ------------------------------------------------------------
// DNS FIX FOR MONGODB ATLAS
// ------------------------------------------------------------
const dns = require("dns");

dns.setServers([
    "8.8.8.8",
    "1.1.1.1"
]);

// ------------------------------------------------------------
// IMPORTS
// ------------------------------------------------------------
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

// ------------------------------------------------------------
// APP
// ------------------------------------------------------------
const app = express();

const PORT = process.env.PORT || 5000;

// ------------------------------------------------------------
// MIDDLEWARE
// ------------------------------------------------------------
app.use(cors());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

// ------------------------------------------------------------
// SERVE FRONTEND
// ------------------------------------------------------------
app.use(express.static(path.join(__dirname, "public")));

// ------------------------------------------------------------
// MONGODB CONNECTION
// ------------------------------------------------------------
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ MONGO_URI is missing in .env file");
    process.exit(1);
}

mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log("✅ MongoDB connected successfully");
    })
    .catch((error) => {
        console.error("❌ MongoDB connection failed:");
        console.error(error.message);
    });

// ------------------------------------------------------------
// CREDENTIAL SCHEMA
// ------------------------------------------------------------
const credentialSchema = new mongoose.Schema(
    {
        credentialId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        studentName: {
            type: String,
            required: true,
            trim: true
        },

        registerNumber: {
            type: String,
            required: true,
            trim: true
        },

        programme: {
            type: String,
            required: true,
            trim: true
        },

        institution: {
            type: String,
            required: true,
            trim: true
        },

        issueDate: {
            type: String,
            required: true,
            trim: true
        },

        certificateHash: {
            type: String,
            default: ""
        },

        verified: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

// ------------------------------------------------------------
// MODEL
// ------------------------------------------------------------
const Credential = mongoose.model(
    "Credential",
    credentialSchema
);

// ------------------------------------------------------------
// GENERATE CREDENTIAL ID
// ------------------------------------------------------------
async function generateCredentialId() {

    let credentialId;
    let exists = true;

    while (exists) {

        const randomNumber = Math.floor(
            100000 + Math.random() * 900000
        );

        credentialId = "ZYV-2026-" + randomNumber;

        exists = await Credential.exists({
            credentialId: credentialId
        });
    }

    return credentialId;
}

// ------------------------------------------------------------
// HOME ROUTE
// ------------------------------------------------------------
app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );

});

// ------------------------------------------------------------
// TEST API
// ------------------------------------------------------------
app.get("/api/test", (req, res) => {

    res.json({
        success: true,
        message: "ZENVYRA Backend is working!",
        server: "Node.js + Express",
        database:
            mongoose.connection.readyState === 1
                ? "MongoDB Connected"
                : "MongoDB Not Connected"
    });

});

// ------------------------------------------------------------
// CREATE CREDENTIAL
// POST /api/credentials
// ------------------------------------------------------------
app.post("/api/credentials", async (req, res) => {

    try {

        // ----------------------------------------------------
        // CHECK DATABASE
        // ----------------------------------------------------
        if (mongoose.connection.readyState !== 1) {

            return res.status(503).json({
                success: false,
                message: "MongoDB is not connected"
            });

        }

        // ----------------------------------------------------
        // GET DATA
        // ----------------------------------------------------
        const {
            studentName,
            registerNumber,
            programme,
            institution,
            issueDate,
            certificateHash
        } = req.body;

        // ----------------------------------------------------
        // REQUIRED FIELD VALIDATION
        // ----------------------------------------------------
        if (
            !studentName ||
            !registerNumber ||
            !programme ||
            !institution ||
            !issueDate
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "studentName, registerNumber, programme, institution and issueDate are required"
            });

        }

        // ----------------------------------------------------
        // CHECK DUPLICATE REGISTER NUMBER
        // ----------------------------------------------------
        const existingCredential =
            await Credential.findOne({
                registerNumber: registerNumber
            });

        if (existingCredential) {

            return res.status(409).json({
                success: false,
                message:
                    "A credential already exists for this register number",
                credentialId:
                    existingCredential.credentialId
            });

        }

        // ----------------------------------------------------
        // GENERATE CREDENTIAL ID
        // ----------------------------------------------------
        const credentialId =
            await generateCredentialId();

        // ----------------------------------------------------
        // CREATE CREDENTIAL
        // ----------------------------------------------------
        const credential =
            new Credential({

                credentialId: credentialId,

                studentName: studentName,

                registerNumber: registerNumber,

                programme: programme,

                institution: institution,

                issueDate: issueDate,

                certificateHash:
                    certificateHash || "",

                verified: true

            });

        // ----------------------------------------------------
        // SAVE
        // ----------------------------------------------------
        await credential.save();

        // ----------------------------------------------------
        // RESPONSE
        // ----------------------------------------------------
        res.status(201).json({

            success: true,

            message:
                "Credential created successfully",

            credential: credential

        });

    } catch (error) {

        console.error(
            "❌ CREATE CREDENTIAL ERROR:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to create credential",

            error:
                error.message

        });

    }

});

// ------------------------------------------------------------
// VERIFY CREDENTIAL
// GET /api/verify/:credentialId
// ------------------------------------------------------------
app.get(
    "/api/verify/:credentialId",
    async (req, res) => {

        try {

            // ------------------------------------------------
            // CHECK DATABASE
            // ------------------------------------------------
            if (
                mongoose.connection.readyState !== 1
            ) {

                return res.status(503).json({

                    success: false,

                    message:
                        "MongoDB is not connected"

                });

            }

            // ------------------------------------------------
            // GET CREDENTIAL ID
            // ------------------------------------------------
            const credentialId =
                req.params.credentialId;

            // ------------------------------------------------
            // SEARCH CASE-INSENSITIVE
            // ------------------------------------------------
            const credential =
                await Credential.findOne({

                    credentialId: {
                        $regex:
                            "^" +
                            credentialId +
                            "$",

                        $options: "i"
                    }

                });

            // ------------------------------------------------
            // NOT FOUND
            // ------------------------------------------------
            if (!credential) {

                return res.status(404).json({

                    success: false,

                    verified: false,

                    message:
                        "Credential not found"

                });

            }

            // ------------------------------------------------
            // VERIFIED
            // ------------------------------------------------
            res.json({

                success: true,

                verified: true,

                message:
                    "Credential verified successfully",

                credential: {

                    credentialId:
                        credential.credentialId,

                    studentName:
                        credential.studentName,

                    registerNumber:
                        credential.registerNumber,

                    programme:
                        credential.programme,

                    institution:
                        credential.institution,

                    issueDate:
                        credential.issueDate,

                    certificateHash:
                        credential.certificateHash,

                    verified:
                        credential.verified

                }

            });

        } catch (error) {

            console.error(
                "❌ VERIFY ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                verified: false,

                message:
                    "Verification failed",

                error:
                    error.message

            });

        }

    }
);

// ------------------------------------------------------------
// GET ALL CREDENTIALS
// GET /api/credentials
// ------------------------------------------------------------
app.get(
    "/api/credentials",
    async (req, res) => {

        try {

            // ------------------------------------------------
            // CHECK DATABASE
            // ------------------------------------------------
            if (
                mongoose.connection.readyState !== 1
            ) {

                return res.status(503).json({

                    success: false,

                    message:
                        "MongoDB is not connected"

                });

            }

            // ------------------------------------------------
            // GET CREDENTIALS
            // ------------------------------------------------
            const credentials =
                await Credential
                    .find()
                    .sort({
                        createdAt: -1
                    });

            // ------------------------------------------------
            // RESPONSE
            // ------------------------------------------------
            res.json({

                success: true,

                count:
                    credentials.length,

                credentials:
                    credentials

            });

        } catch (error) {

            console.error(
                "❌ GET CREDENTIALS ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to fetch credentials",

                error:
                    error.message

            });

        }

    }
);

// ------------------------------------------------------------
// DELETE CREDENTIAL
// DELETE /api/credentials/:credentialId
// ------------------------------------------------------------
app.delete(
    "/api/credentials/:credentialId",
    async (req, res) => {

        try {

            const credentialId =
                req.params.credentialId;

            const deleted =
                await Credential.findOneAndDelete({

                    credentialId:
                        credentialId

                });

            if (!deleted) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Credential not found"

                });

            }

            res.json({

                success: true,

                message:
                    "Credential deleted successfully"

            });

        } catch (error) {

            console.error(
                "❌ DELETE ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to delete credential",

                error:
                    error.message

            });

        }

    }
);

// ------------------------------------------------------------
// 404 HANDLER FOR API
// ------------------------------------------------------------
app.use("/api", (req, res) => {

    res.status(404).json({

        success: false,

        message:
            "API endpoint not found"

    });

});

// ------------------------------------------------------------
// GLOBAL ERROR HANDLER
// ------------------------------------------------------------
app.use(
    (error, req, res, next) => {

        console.error(
            "❌ SERVER ERROR:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Internal server error",

            error:
                error.message

        });

    }
);

// ------------------------------------------------------------
// START SERVER
// ------------------------------------------------------------
app.listen(
    PORT,
    () => {

        console.log("");

        console.log(
            "=========================================="
        );

        console.log(
            "        ZENVYRA BACKEND SERVER"
        );

        console.log(
            "=========================================="
        );

        console.log(
            "🚀 Server running on port " + PORT
        );

        console.log(
            "🌐 http://localhost:" + PORT
        );

        console.log(
            "🔗 API Test: http://localhost:" +
            PORT +
            "/api/test"
        );

        console.log(
            "=========================================="
        );

        console.log("");

    }
);