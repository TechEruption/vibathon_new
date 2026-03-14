const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");


function loadConfig() {
  if (process.env.CONTRACT_ADDRESS) {
    return { address: process.env.CONTRACT_ADDRESS };
  }

  const configPath = path.join(__dirname, "contract-address.json");
  if (!fs.existsSync(configPath)) {
    throw new Error(
      "Contract address file not found. Run `npm run deploy` or `npx hardhat run scripts/deploy.js --network fuji` first."
    );
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (!config.address) {
    throw new Error("Invalid contract config: missing address");
  }

  return config;
}

function getProvider() {
  // Support hardhat in-process provider for fast local tests.
  if (process.env.USE_HARDHAT_PROVIDER === "true" || process.env.NODE_ENV === "test") {
    // eslint-disable-next-line import/no-extraneous-dependencies
    const { ethers: hreEthers } = require("hardhat");
    return hreEthers.provider;
  }

  const rpcUrl = process.env.AVALANCHE_FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";
  return new ethers.JsonRpcProvider(rpcUrl);
}

function getSigner(provider) {
  if (process.env.USE_HARDHAT_PROVIDER === "true" || process.env.NODE_ENV === "test") {
    // Use Hardhat's ethers signer to ensure the runner supports all operations.
    // eslint-disable-next-line import/no-extraneous-dependencies
    const { ethers: hreEthers } = require("hardhat");
    const signerIndex = Number(process.env.HARDHAT_SIGNER_INDEX || 0);
    return hreEthers.getSigner(signerIndex);
  }

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error(
      "PRIVATE_KEY is missing. Set it in your .env file as PRIVATE_KEY=0x..."
    );
  }
  return new ethers.Wallet(privateKey.trim(), provider);
}

async function getContract(runner) {
  const config = loadConfig();

  // When running under Hardhat tests, use Hardhat's ethers helper to ensure the
  // contract is connected to a runner that supports view calls.
  if (process.env.USE_HARDHAT_PROVIDER === "true" || process.env.NODE_ENV === "test") {
    // eslint-disable-next-line import/no-extraneous-dependencies
    const { ethers: hreEthers } = require("hardhat");
    const contract = await hreEthers.getContractAt("DocProof", config.address);
    // Attach runner (provider or signer) if it supports connect
    if (runner && typeof runner.getAddress === "function") {
      return contract.connect(runner);
    }
    return contract;
  }

  const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "DocProof.sol", "DocProof.json");
  if (!fs.existsSync(artifactPath)) {
    throw new Error(
      "Contract artifact not found. Run `npx hardhat compile` first."
    );
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  return new ethers.Contract(config.address, artifact.abi, runner);
}

async function storeHash(hash) {
  const provider = getProvider();
  const signer = getSigner(provider);
  const contract = await getContract(signer);

  const tx = await contract.storeHash("0x" + hash);
  const receipt = await tx.wait();

  const block = await provider.getBlock(receipt.blockNumber);
  const txHash = tx.hash || receipt.hash || receipt.transactionHash;

  return {
    txHash,
    sender: signer.address,
    timestamp: block.timestamp.toString(),
    receipt
  };
}

async function verifyHash(hash) {
  const provider = getProvider();
  const contract = await getContract(provider);

  const result = await contract.verifyHash("0x" + hash);
  return {
    exists: result[0],
    owner: result[1],
    timestamp: result[2].toString()
  };
}

module.exports = {
  storeHash,
  verifyHash
};
