import hre from "hardhat";

async function main() {
  const [deployer, school, student, company] = await hre.ethers.getSigners();

  console.log("=== TrustChain E2E Scenario Simulation ===\n");

  // 1. Deployment
  console.log("Deploying CredentialSBT contract with deployer:", deployer.address);
  const CredentialSBT = await hre.ethers.getContractFactory("CredentialSBT");
  const credentialSBT = await CredentialSBT.deploy(deployer.address);
  await credentialSBT.waitForDeployment();
  const contractAddress = await credentialSBT.getAddress();
  console.log("Contract deployed to:", contractAddress);

  // 2. Grant Issuer Role
  console.log("\n--- Phase 1: Registration ---");
  const ISSUER_ROLE = await credentialSBT.ISSUER_ROLE();
  await credentialSBT.grantRole(ISSUER_ROLE, school.address);
  console.log(`Granted ISSUER_ROLE to School Address: ${school.address}`);

  // 3. Issue Credential
  console.log("\n--- Phase 2: Issuance (Student Graduates) ---");
  const sampleURI = "ipfs://QmDummyHash12345/metadata.json";
  console.log(`School issues a diploma SBT to Student Wallet: ${student.address}`);
  const tx = await credentialSBT.connect(school).issueCredential(student.address, sampleURI);
  const receipt = await tx.wait();
  
  // Find Token ID
  // @ts-ignore
  const event = receipt.logs.find(log => {
      try { return credentialSBT.interface.parseLog(log)?.name === 'CredentialIssued'; } 
      catch (e) { return false; }
  });
  // @ts-ignore
  const tokenId = credentialSBT.interface.parseLog(event).args.tokenId;
  console.log(`Issued successfully! Credential ID is: ${tokenId}`);

  // 4. Student Verification (Portfolio)
  console.log("\n--- Phase 3: Student Portfolio View ---");
  const studentOwned = await credentialSBT.ownerOf(tokenId);
  console.log(`Student checks wallet. Token ID ${tokenId} owner is: ${studentOwned}`);
  if (studentOwned === student.address) {
      console.log("Student successfully possesses the Soulbound Token!");
  }

  // 5. Transfer Attempt
  console.log("\n--- Phase 4: Non-Transferability Check ---");
  try {
      console.log("Student attempts to transfer the SBT to Company... (should fail)");
      await credentialSBT.connect(student).transferFrom(student.address, company.address, tokenId);
  } catch (err) {
      console.log(`Transaction Reverted as expected: ${err.message.split('revert ')[1]?.split('"')[0] || err.message}`);
  }

  // 6. Verification (Employer checks)
  console.log("\n--- Phase 5: Verification during Recruitment ---");
  console.log("Company queries the smart contract for Credential ID:", tokenId.toString());
  const [isValid, owner, uri] = await credentialSBT.connect(company).verifyCredential(tokenId);
  
  if (isValid && owner === student.address) {
      console.log(`Result: VALID ✓`);
      console.log(`Owner matches applicant: ${owner === student.address}`);
      console.log(`Original Document IPFS URI: ${uri}`);
  } else {
      console.log("Result: INVALID ✗");
  }

  console.log("\n=== Simulation Completed Successfully ===");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
