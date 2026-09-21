const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  const contract = await CertificateRegistry.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✅ CertificateRegistry deployed to:", address);

  // ABI + address ah backend use pannurathukku save pannuvom
  const artifact = await hre.artifacts.readArtifact("CertificateRegistry");
  const output = {
    address: address,
    abi: artifact.abi,
  };

  const outPath = path.join(__dirname, "..", "utils", "contractData.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log("📄 Contract ABI + address saved to utils/contractData.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
