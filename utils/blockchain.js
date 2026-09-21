const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// deploy.js run panna apparam idhu auto-generate aagum
const contractDataPath = path.join(__dirname, "contractData.json");

let provider, wallet, contract;

function initBlockchain() {
  provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "http://127.0.0.1:8545");

  if (!fs.existsSync(contractDataPath)) {
    console.warn(
      "⚠️  contractData.json illa. Muthalla `npm run deploy` run pannunga."
    );
    return;
  }

  const { address, abi } = JSON.parse(fs.readFileSync(contractDataPath, "utf-8"));

  // private key vachu wallet (issuer) create pannuvom
  if (process.env.PRIVATE_KEY) {
    wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    contract = new ethers.Contract(address, abi, wallet);
  } else {
    // private key illama, read-only contract instance
    contract = new ethers.Contract(address, abi, provider);
  }

  console.log("✅ Blockchain connected. Contract address:", address);
}

/**
 * Certificate hash ah blockchain la write pannum (issueCertificate)
 */
async function issueCertificateOnChain(certId, certHashHex) {
  if (!contract || !wallet) throw new Error("Blockchain not initialized properly");

  const tx = await contract.issueCertificate(certId, certHashHex);
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Blockchain la irundhu certificate verify pannum (read-only, gas illa)
 */
async function verifyCertificateOnChain(certId, certHashHex) {
  if (!contract) throw new Error("Blockchain not initialized properly");
  const isValid = await contract.verifyCertificate(certId, certHashHex);
  return isValid;
}

/**
 * Blockchain la irundhu raw certificate data eduka
 */
async function getCertificateFromChain(certId) {
  if (!contract) throw new Error("Blockchain not initialized properly");
  const result = await contract.getCertificate(certId);
  return {
    certHash: result[0],
    issuedAt: result[1],
    exists: result[2],
  };
}

function getContractAddress() {
  if (!fs.existsSync(contractDataPath)) return null;
  const { address } = JSON.parse(fs.readFileSync(contractDataPath, "utf-8"));
  return address;
}

module.exports = {
  initBlockchain,
  issueCertificateOnChain,
  verifyCertificateOnChain,
  getCertificateFromChain,
  getContractAddress,
};