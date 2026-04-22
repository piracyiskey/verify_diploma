import hre from "hardhat";

async function main() {
  const signers = await hre.ethers.getSigners();
  const networkName = hre.network.name;

  let deployer, issuerAddress;

  if (networkName === "sepolia") {
    // On Sepolia, there's only one signer (from the private key in .env)
    // That same account is both deployer AND issuer
    deployer = signers[0];
    issuerAddress = deployer.address;
    console.log(`Deploying to SEPOLIA with account: ${deployer.address}`);
  } else {
    // On local Hardhat, use Account #5 to deploy (avoids MetaMask nonce issues)
    // and grant issuer role to Account #0
    deployer = signers[5];
    issuerAddress = signers[0].address;
    console.log(`Deploying to LOCAL with account: ${deployer.address}`);
  }

  const CredentialSBT = await hre.ethers.getContractFactory("CredentialSBT", deployer);
  const credentialSBT = await CredentialSBT.deploy(deployer.address);
  await credentialSBT.waitForDeployment();
  const contractAddress = await credentialSBT.getAddress();

  console.log(`CredentialSBT deployed to: ${contractAddress}`);

  // Grant ISSUER_ROLE to the issuer address
  const ISSUER_ROLE = await credentialSBT.ISSUER_ROLE();
  const tx = await credentialSBT.connect(deployer).grantRole(ISSUER_ROLE, issuerAddress);
  await tx.wait();
  console.log(`Granted ISSUER_ROLE to: ${issuerAddress}`);

  console.log(`
===================================================
Setup Complete!

Network:          ${networkName}
Contract Address: ${contractAddress}
Issuer Address:   ${issuerAddress}

Update your frontend .env.local:
NEXT_PUBLIC_CONTRACT_ADDRESS="${contractAddress}"
===================================================`);

  if (networkName === "sepolia") {
    console.log(`\nView on Etherscan: https://sepolia.etherscan.io/address/${contractAddress}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
