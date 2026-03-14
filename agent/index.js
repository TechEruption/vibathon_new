require("dotenv").config();

const fs = require("fs");
const path = require("path");

const { generateHash } = require("./hash");
const { storeHash, verifyHash } = require("./blockchain");
const { createCertificate } = require("./certificate");
const { scanFolder } = require("./fileScanner");

async function register(filePath, options = {}) {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`File not found: ${absolutePath}`);
    process.exit(1);
  }

  const buffer = fs.readFileSync(absolutePath);
  const hash = generateHash(buffer);

  const proof = await verifyHash(hash);
  if (proof.exists) {
    console.log("Document already registered");
    console.log(`Owner: ${proof.owner}`);
    console.log(`Timestamp: ${proof.timestamp}`);
    return;
  }

  let result;
  try {
    result = await storeHash(hash);
  } catch (err) {
    const message = err?.message || "";
    if (message.includes("Document already registered")) {
      console.log("Document already registered (race condition)");
      return;
    }
    throw err;
  }

  console.log("Document registered successfully");
  console.log(`Hash: 0x${hash}`);
  console.log(`Transaction: ${result.txHash}`);
  console.log("Network: Avalanche Fuji");

  const certPath = createCertificate({
    documentName: path.basename(absolutePath),
    hash: `0x${hash}`,
    owner: result.sender,
    txHash: result.txHash,
    timestamp: result.timestamp,
    network: "Avalanche Fuji",
    format: options.format || "txt"
  });

  console.log(`Certificate saved to: ${certPath}`);
}

async function verify(filePath) {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`File not found: ${absolutePath}`);
    process.exit(1);
  }

  const buffer = fs.readFileSync(absolutePath);
  const hash = generateHash(buffer);

  const proof = await verifyHash(hash);
  if (!proof.exists) {
    console.log("No proof found for this document");
    process.exit(0);
  }

  console.log("Document Verified");
  console.log(`Owner: ${proof.owner}`);
  console.log(`Timestamp: ${proof.timestamp}`);
}

async function registerFolder(folderPath) {
  const absolutePath = path.resolve(folderPath);
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isDirectory()) {
    console.error(`Folder not found: ${absolutePath}`);
    process.exit(1);
  }

  const files = scanFolder(absolutePath);
  console.log(`Processing ${files.length} files...`);

  for (const file of files) {
    const buffer = fs.readFileSync(file);
    const hash = generateHash(buffer);

    const proof = await verifyHash(hash);
    const name = path.basename(file);

    if (proof.exists) {
      console.log(`${name} → already exists (owner: ${proof.owner})`);
      continue;
    }

    let result;
    try {
      result = await storeHash(hash);
      console.log(`${name} → stored (tx: ${result.txHash})`);
      createCertificate({
        documentName: name,
        hash: `0x${hash}`,
        owner: result.sender,
        txHash: result.txHash,
        timestamp: result.timestamp,
        network: "Avalanche Fuji"
      });
    } catch (err) {
      const message = err?.message || "";
      if (message.includes("Document already registered")) {
        console.log(`${name} → already exists (race condition)`);
        continue;
      }
      console.error(`${name} → error: ${message}`);
    }
  }
}

async function verifyCertificate(filePath, certificatePath) {
  const absoluteFile = path.resolve(filePath);
  const absoluteCert = path.resolve(certificatePath);

  if (!fs.existsSync(absoluteFile)) {
    console.error(`File not found: ${absoluteFile}`);
    process.exit(1);
  }
  if (!fs.existsSync(absoluteCert)) {
    console.error(`Certificate not found: ${absoluteCert}`);
    process.exit(1);
  }

  const buffer = fs.readFileSync(absoluteFile);
  const fileHash = `0x${generateHash(buffer)}`;

  const cert = require("./certificate").parseCertificate(absoluteCert);
  if (!cert.hash) {
    console.error("Certificate appears invalid or missing hash.");
    process.exit(1);
  }

  if (fileHash === cert.hash) {
    console.log("Certificate matches the document.");
    console.log(`Document: ${cert.document}`);
    console.log(`Hash: ${fileHash}`);
    console.log(`Owner: ${cert.owner}`);
    console.log(`Transaction: ${cert.transaction}`);
    console.log(`Timestamp: ${cert.timestamp}`);
    console.log(`Network: ${cert.network}`);
    return;
  }

  console.error("Certificate does not match document hash.");
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const target = args[1];
  const extra = args[2];

  if (!command || !target) {
    console.log("Usage:");
    console.log("  node agent/index.js register <file_path> [--pdf]");
    console.log("  node agent/index.js verify <file_path>");
    console.log("  node agent/index.js register-folder <folder_path>");
    console.log("  node agent/index.js verify-certificate <file_path> <certificate_path>");
    process.exit(1);
  }

  if (command === "register") {
    const usePdf = args.includes("--pdf");
    await register(target, { format: usePdf ? "pdf" : "txt" });
    return;
  }

  if (command === "verify") {
    await verify(target);
    return;
  }

  if (command === "register-folder") {
    await registerFolder(target);
    return;
  }

  if (command === "verify-certificate") {
    if (!extra) {
      console.error("Usage: node agent/index.js verify-certificate <file_path> <certificate_path>");
      process.exit(1);
    }
    await verifyCertificate(target, extra);
    return;
  }

  console.error(`Unknown command: ${command}`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
