const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);

  const DocProof = await ethers.getContractFactory("DocProof");
  const docProof = await DocProof.deploy();
  await docProof.deployed();

  console.log("DocProof deployed to:", docProof.address);

  const outDir = path.join(__dirname, "..", "agent");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const configPath = path.join(outDir, "contract-address.json");
  fs.writeFileSync(
    configPath,
    JSON.stringify({ address: docProof.address }, null, 2)
  );

  console.log(`Saved contract address to ${configPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
