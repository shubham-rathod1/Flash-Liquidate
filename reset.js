async function main() {
  const helpers = require('@nomicfoundation/hardhat-toolbox/network-helpers');
  await helpers.reset();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
