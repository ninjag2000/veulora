const fs = require("fs");
const path = require("path");

const jsiDir = path.join(
  __dirname,
  "..",
  "node_modules",
  "react-native",
  "ReactCommon",
  "jsi",
  "jsi"
);
const currentHeader = path.join(jsiDir, "hermes.h");
const legacyHeader = path.join(jsiDir, "hermes-interfaces.h");

if (!fs.existsSync(currentHeader) || fs.existsSync(legacyHeader)) {
  process.exit(0);
}

fs.copyFileSync(currentHeader, legacyHeader);
console.log("Created React Native Hermes compatibility header.");
