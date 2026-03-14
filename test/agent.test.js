const fs = require("fs");
const path = require("path");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const { generateHash } = require("../agent/hash");
const { createCertificate, parseCertificate } = require("../agent/certificate");
const { storeHash, verifyHash } = require("../agent/blockchain");

describe("DocProof Agent End-to-End", function () {
  let contractAddress;
  let tempFilePath;
  let hash;

  before(async function () {
    // Deploy a fresh contract on the Hardhat in-memory network
    const DocProof = await ethers.getContractFactory("DocProof");
    const docProof = await DocProof.deploy();
    // In ethers v6, contract is ready after deploy() resolves
    contractAddress = docProof.target || docProof.address;

    // Ensure agent uses the Hardhat provider and contract address
    process.env.USE_HARDHAT_PROVIDER = "true";
    process.env.CONTRACT_ADDRESS = contractAddress;

    // Create a temporary file for testing
    tempFilePath = path.join(__dirname, "tmp-test-file.txt");
    fs.writeFileSync(tempFilePath, "hello docproof test\n", "utf8");
    hash = generateHash(fs.readFileSync(tempFilePath));
  });

  after(function () {
    try {
      fs.unlinkSync(tempFilePath);
    } catch (e) {
      // ignore
    }
  });

  it("should report no proof initially and then store and verify proof", async function () {
    const before = await verifyHash(hash);
    expect(before.exists).to.be.false;

    const { txHash } = await storeHash(hash);
    expect(txHash).to.be.a("string");

    // Validate via agent verifyHash
    const after = await verifyHash(hash);
    expect(after.exists).to.be.true;
    expect(after.owner).to.be.a("string");
    expect(after.timestamp).to.match(/^[0-9]+$/);

    // Also validate directly against the deployed contract
    const directContract = await ethers.getContractAt("DocProof", contractAddress);
    const directVerify = await directContract.verifyHash(`0x${hash}`);
    expect(directVerify[0]).to.be.true;
  });

  it("should write and parse a certificate file", function () {
    const certPath = createCertificate({
      documentName: "tmp-test-file.txt",
      hash: `0x${hash}`,
      owner: "0x0000000000000000000000000000000000000000",
      txHash: "0xdeadbeef",
      timestamp: "12345678",
      network: "Avalanche Fuji"
    });

    const parsed = parseCertificate(certPath);
    expect(parsed.hash).to.equal(`0x${hash}`);
    expect(parsed.document).to.equal("tmp-test-file.txt");

    fs.unlinkSync(certPath);
  });
});
