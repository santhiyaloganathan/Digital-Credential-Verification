const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");

const Certificate = require("../models/Certificate");
const {
  issueCertificateOnChain,
  verifyCertificateOnChain,
  getCertificateFromChain,
  getContractAddress,
} = require("../utils/blockchain");

const router = express.Router();

// ---------- Multer setup (certificate file - PDF/image upload) -----
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const qrDir = path.join(uploadDir, "qrcodes");
if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

/**
 * POST /api/certificates/upload
 * Admin/institution certificate upload pannum route.
 * Steps:
 * 1. File upload aagum
 * 2. File oda SHA256 hash generate pannuvom
 * 3. Unique certId (UUID) generate pannuvom
 * 4. Hash ah blockchain la store pannuvom
 * 5. Dynamic QR code generate pannuvom (verify URL point pannum)
 * 6. Ellame MongoDB la save pannuvom
 */
router.post("/upload", upload.single("certificateFile"), async (req, res) => {
  try {
    const { studentName, courseName, issueDate } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Certificate file required" });
    }

    // 1. File hash generate (SHA256)
    const fileBuffer = fs.readFileSync(req.file.path);
    const certHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
    const certHashHex = "0x" + certHash; // solidity bytes32 format

    // 2. Unique cert ID
    const certId = uuidv4();

    // 3. Blockchain la store pannuvom
    let txHash = null;
    try {
      txHash = await issueCertificateOnChain(certId, certHashHex);
    } catch (chainErr) {
      console.error("Blockchain write failed:", chainErr.message);
      return res.status(500).json({
        success: false,
        message: "Blockchain la certificate store panna mudiyala. Hardhat node run aaguthaa nu check pannunga.",
        error: chainErr.message,
      });
    }

    // 4. Dynamic QR code generate - verify page ku point pannum
    const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify/${certId}`;
    const qrFileName = `${certId}.png`;
    const qrFilePath = path.join(qrDir, qrFileName);
    await QRCode.toFile(qrFilePath, verifyUrl, { width: 300 });

    // 5. MongoDB la save pannuvom
    const newCert = await Certificate.create({
      certId,
      studentName,
      courseName,
      issueDate,
      fileName: req.file.originalname,
      filePath: req.file.path,
      certHash: certHashHex,
      qrCodePath: qrFilePath,
      txHash,
      contractAddress: getContractAddress(),
    });

    res.status(201).json({
      success: true,
      message: "Certificate issued & stored on blockchain successfully",
      data: {
        certId: newCert.certId,
        verifyUrl,
        qrCodeUrl: `/api/certificates/qrcode/${certId}`,
        txHash,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

/**
 * GET /api/certificates/qrcode/:certId
 * QR code image serve pannum
 */
router.get("/qrcode/:certId", (req, res) => {
  const filePath = path.join(qrDir, `${req.params.certId}.png`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: "QR code not found" });
  }
  res.sendFile(filePath);
});

/**
 * GET /api/certificates/verify/:certId
 * QR scan pannina apparam idhu call aagum.
 * DB la irundhu hash edukurom, blockchain la irundhu hash edukurom,
 * rendும் match aaguthaa nu check pannuvom => real verification!
 */
router.get("/verify/:certId", async (req, res) => {
  try {
    const { certId } = req.params;

    const cert = await Certificate.findOne({ certId });
    if (!cert) {
      return res.status(404).json({ success: false, verified: false, message: "Certificate not found in database" });
    }

    if (cert.revoked) {
      return res.json({ success: true, verified: false, message: "This certificate has been REVOKED" });
    }

    // Blockchain oda direct verify (tamper check)
    const isValidOnChain = await verifyCertificateOnChain(certId, cert.certHash);
    const chainData = await getCertificateFromChain(certId);

    res.json({
      success: true,
      verified: isValidOnChain,
      message: isValidOnChain
        ? "✅ Certificate is AUTHENTIC and verified on blockchain"
        : "❌ Certificate hash MISMATCH - possibly tampered/fake",
      data: {
        certId: cert.certId,
        studentName: cert.studentName,
        courseName: cert.courseName,
        issueDate: cert.issueDate,
        issuedAtOnChain: chainData.exists
          ? new Date(Number(chainData.issuedAt) * 1000)
          : null,
        txHash: cert.txHash,
        contractAddress: cert.contractAddress,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Verification failed", error: err.message });
  }
});

/**
 * GET /api/certificates
 * Ella certificates list pannum (admin dashboard ku)
 */
router.get("/", async (req, res) => {
  const certs = await Certificate.find().sort({ createdAt: -1 });
  res.json({ success: true, data: certs });
});

/**
 * PUT /api/certificates/revoke/:certId
 * Fake nu therinja certificate revoke pannalam
 */
router.put("/revoke/:certId", async (req, res) => {
  try {
    const cert = await Certificate.findOneAndUpdate(
      { certId: req.params.certId },
      { revoked: true },
      { new: true }
    );
    if (!cert) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Certificate revoked", data: cert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
