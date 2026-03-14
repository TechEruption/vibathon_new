const fs = require("fs");
const path = require("path");

function scanFolder(folderPath) {
  const entries = fs.readdirSync(folderPath);
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(folderPath, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

module.exports = {
  scanFolder
};
