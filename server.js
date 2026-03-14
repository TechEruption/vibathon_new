const path = require("path");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");

const { generateHash } = require("./agent/hash");
const { storeHash, verifyHash } = require("./agent/blockchain");
const { createCertificate } = require("./agent/certificate");

const app = express();
const upload = multer({ dest: path.join(__dirname, "tmp") });

app.use(cors());
app.use(express.json());

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const buffer = fs.readFileSync(req.file.path);
    const hash = generateHash(buffer);

    const existing = await verifyHash(hash);
    if (existing.exists) {
      fs.unlinkSync(req.file.path);
      return res.json({
        alreadyRegistered: true,
        owner: existing.owner,
        timestamp: existing.timestamp,
        hash: `0x${hash}`
      });
    }

    const result = await storeHash(hash);

    const certificatePath = createCertificate({
      documentName: req.file.originalname,
      hash: `0x${hash}`,
      owner: result.sender,
      txHash: result.txHash,
      timestamp: result.timestamp,
      network: "Avalanche Fuji",
      format: "pdf"
    });

    fs.unlinkSync(req.file.path);

    return res.json({
      hash: `0x${hash}`,
      txHash: result.txHash,
      owner: result.sender,
      timestamp: result.timestamp,
      certificateUrl: `/api/certificate/${path.basename(certificatePath)}`
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Upload failed" });
  }
});

app.post("/verify", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const buffer = fs.readFileSync(req.file.path);
    const hash = generateHash(buffer);
    const proof = await verifyHash(hash);

    fs.unlinkSync(req.file.path);

    return res.json({
      hash: `0x${hash}`,
      ...proof
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Verify failed" });
  }
});

app.use("/certificate", express.static(path.join(__dirname)));
app.use("/api/certificate", express.static(path.join(__dirname)));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`DocProof API server running on http://localhost:${port}`);
});
