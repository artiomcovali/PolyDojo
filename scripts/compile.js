/* eslint-disable */
// Compiles the three remaining contracts with solc + local OpenZeppelin imports.
// Output artifacts go to scripts/artifacts/{Name}.json with { abi, bytecode }.

const fs = require("fs");
const path = require("path");
const solc = require("solc");

const ROOT = path.resolve(__dirname, "..");
const CONTRACTS_DIR = path.join(ROOT, "contracts");
const NODE_MODULES = path.join(ROOT, "node_modules");
const OUT = path.join(__dirname, "artifacts");

const SOURCES = ["DojoToken.sol", "Achievements.sol", "GameManager.sol", "Leaderboard.sol"];

function readSource(filename) {
  return fs.readFileSync(path.join(CONTRACTS_DIR, filename), "utf8");
}

function importCallback(importPath) {
  // Local: ./Foo.sol
  if (importPath.startsWith("./") || importPath.startsWith("../")) {
    const p = path.resolve(CONTRACTS_DIR, importPath);
    if (fs.existsSync(p)) return { contents: fs.readFileSync(p, "utf8") };
  }
  // Package: @openzeppelin/...
  const pkgPath = path.join(NODE_MODULES, importPath);
  if (fs.existsSync(pkgPath)) return { contents: fs.readFileSync(pkgPath, "utf8") };
  return { error: `Source not found: ${importPath}` };
}

const input = {
  language: "Solidity",
  sources: SOURCES.reduce((acc, file) => {
    acc[file] = { content: readSource(file) };
    return acc;
  }, {}),
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: {
      "*": { "*": ["abi", "evm.bytecode.object"] },
    },
  },
};

console.log("Compiling...");
const output = JSON.parse(
  solc.compile(JSON.stringify(input), { import: importCallback })
);

if (output.errors) {
  const fatal = output.errors.filter((e) => e.severity === "error");
  for (const e of output.errors) console.log(e.formattedMessage);
  if (fatal.length) {
    console.error("Compilation failed.");
    process.exit(1);
  }
}

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const wanted = ["DojoToken", "Achievements", "GameManager", "Leaderboard"];
for (const file of SOURCES) {
  for (const name of Object.keys(output.contracts[file] || {})) {
    if (!wanted.includes(name)) continue;
    const c = output.contracts[file][name];
    const artifact = {
      contractName: name,
      abi: c.abi,
      bytecode: "0x" + c.evm.bytecode.object,
    };
    fs.writeFileSync(
      path.join(OUT, `${name}.json`),
      JSON.stringify(artifact, null, 2)
    );
    console.log(`  ✓ ${name}  (abi items: ${c.abi.length}, bytecode bytes: ${c.evm.bytecode.object.length / 2})`);
  }
}
console.log("Done.");
