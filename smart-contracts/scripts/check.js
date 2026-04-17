import hre from "hardhat";

async function main() {
  const CONTRACT_ADDRESS = "0x1Eb835EB7BEEEE9E6bbFe08F16a2d2eF668204bd";
  const CredentialSBT = await hre.ethers.getContractAt("CredentialSBT", CONTRACT_ADDRESS);
  const code = await hre.ethers.provider.getCode(CONTRACT_ADDRESS);
  console.log("Contract code:", code.length > 2 ? "Exists" : "Empty");
  
  if (code.length > 2) {
      const ISSUER_ROLE = await CredentialSBT.ISSUER_ROLE();
      const account0 = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
      const hasRole = await CredentialSBT.hasRole(ISSUER_ROLE, account0);
      console.log("Does Account0 have Issuer role?", hasRole);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
