import hre from "hardhat";

async function main() {
  // We use the 6th testing account (Account #5) to deploy so we get a completely fresh, 
  // unflagged address that MetaMask won't complain about.
  const signers = await hre.ethers.getSigners();
  const deployer = signers[5]; 
  const issuer = signers[0];   // We will still grant Issuer role to Account 0 so user doesn't have to change MetaMask accounts

  console.log("Deploying CredentialSBT with the 6th fresh account:", deployer.address);

  const CredentialSBT = await hre.ethers.getContractFactory("CredentialSBT", deployer);
  // Deploying and setting the fresh deployer as the default admin
  const credentialSBT = await CredentialSBT.deploy(deployer.address);
  await credentialSBT.waitForDeployment();
  const contractAddress = await credentialSBT.getAddress();

  console.log("CredentialSBT deployed successfully to a SAFE address:", contractAddress);

  // Grant the ISSUER_ROLE to the first Hardhat account (which the user already imported into MetaMask)
  const ISSUER_ROLE = await credentialSBT.ISSUER_ROLE();
  await credentialSBT.connect(deployer).grantRole(ISSUER_ROLE, issuer.address);
  
  console.log(`Granted ISSUER_ROLE to Account #0: ${issuer.address}`);

  console.log(`
===================================================
Setup Complete!

The contract is deployed. 
Make sure your frontend's CONTRACT_ADDRESS points to:
${contractAddress}
===================================================`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
