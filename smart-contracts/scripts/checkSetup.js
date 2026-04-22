import hre from "hardhat";

async function main() {
  const address = "0x20d22C31529935C5C34d82F7ACed91b3ca74f377";
  
  console.log(`Checking contract at: ${address} on Sepolia...`);
  
  const code = await hre.ethers.provider.getCode(address);
  if (code === "0x") {
    console.log("❌ No code at this address! The contract is missing.");
  } else {
    console.log(`✅ Code exists at address. Length: ${code.length}`);
    
    // Try to call ISSUER_ROLE
    const CredentialSBT = await hre.ethers.getContractFactory("CredentialSBT");
    const contract = CredentialSBT.attach(address);
    
    try {
      const issuerRole = await contract.ISSUER_ROLE();
      console.log("✅ ISSUER_ROLE returned:", issuerRole);
    } catch (e) {
       console.log("❌ Failed to call ISSUER_ROLE:");
       console.error(e);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
