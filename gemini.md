# [cite_start]AI Developer Instructions: Blockchain-Based Degree & Work Experience Verification System [cite: 1, 2]

## 1. Project Overview
Act as an expert Web3 Full-Stack Developer. [cite_start]Your goal is to build a decentralized application (dApp) that allows educational institutions and companies to issue digital credentials, users to manage them, and employers to verify them instantly without third parties[cite: 4, 5, 6, 7]. 

[cite_start]The system relies on Ethereum smart contracts, IPFS for decentralized storage, and a web-based frontend[cite: 10, 19, 26].

## 2. Tech Stack Requirements
* **Smart Contracts:** Solidity, Hardhat or Foundry.
* [cite_start]**Frontend:** React or Next.js, Web3.js or Ethers.py/Web3.py[cite: 18].
* [cite_start]**Storage:** IPFS using the Pinata API[cite: 52].
* [cite_start]**Wallet Integration:** MetaMask[cite: 53].

## 3. Step-by-Step Implementation Guide

### Phase 1: Smart Contract Development (Soulbound Tokens)
[cite_start]We are implementing a Soulbound Token (SBT) model[cite: 40]. [cite_start]These are non-transferable NFTs representing a credential[cite: 40, 44].
1.  [cite_start]**Base Standard:** Use ERC-721 or ERC-1155[cite: 42]. [cite_start]You MUST override the transfer functions to ensure the token cannot be transferred once minted to a user[cite: 44, 45].
2.  **Access Control:** Implement Role-Based Access Control (RBAC). [cite_start]Only specific wallet addresses designated as "Educational Institutions / Businesses" can issue credentials[cite: 16].
3.  [cite_start]**Uniqueness:** Enforce a constraint so that each credential ID or serial number can only be registered once to prevent duplicates[cite: 17].
4.  **Core Functions to Implement:**
    * [cite_start]`issueCredential()` / `mintCredential()`: Mints the SBT to the student's wallet and records the IPFS CID[cite: 12, 47].
    * [cite_start]`revokeCredential()`: Allows the issuing organization to invalidate a credential (e.g., for policy violations)[cite: 13].
    * [cite_start]`verifyCredential()` / `checkOwnership()`: Checks if a given credential ID is valid, active, and belongs to the applicant's wallet[cite: 14, 48].

### Phase 2: IPFS Integration (Pinata)
[cite_start]All document files must be stored off-chain using IPFS[cite: 26, 27].
1.  [cite_start]**File Uploads:** Create a service to use the Pinata API to automate file uploads from the frontend[cite: 52].
2.  **Required Assets:**
    * [cite_start]Diploma image or PDF file[cite: 29].
    * [cite_start]Detailed transcript file[cite: 30].
3.  **Metadata Schema:** Create a JSON file for the token URI containing:
    * [cite_start]Institution name[cite: 32].
    * [cite_start]Major/Program[cite: 33].
    * [cite_start]Graduation year[cite: 34].
    * [cite_start]Hash of the diploma PDF file[cite: 35].
4.  [cite_start]**Retrieval Logic:** The smart contract should store the CID so employers can retrieve and download the original files[cite: 38].

### Phase 3: Frontend Development
[cite_start]Build a user interface with three distinct portals[cite: 19, 20]:
1.  [cite_start]**Issuer Portal:** A form for schools/companies to input student data, upload files to IPFS, and click "Sign/Issue" to trigger the smart contract[cite: 21].
2.  [cite_start]**User Portfolio:** A dashboard where a student connects their MetaMask wallet to view all credentials they own[cite: 22].
3.  [cite_start]**Verifier Tool:** A search interface (or QR scanner) where employers can input a credential code to receive a "Valid / Invalid" result[cite: 23].
4.  [cite_start]**Data Privacy:** Ensure personal information (like ID number or GPA) is hashed or encrypted *before* it is submitted on-chain[cite: 24, 25].

### Phase 4: Demo Scenario & Reporting Output
1.  [cite_start]**Testing Script:** Write a script to simulate the end-to-end flow: a student graduates, the school issues the credential, the student receives it in MetaMask, and a company verifies it during recruitment[cite: 53].
2.  **Analysis Generation:** Generate a draft report analyzing the system's impact. The report must explain:
    * [cite_start]How blockchain reduces manual verification time[cite: 55, 57].
    * [cite_start]How it lowers administrative and background check costs[cite: 58].
    * [cite_start]A direct comparison between this decentralized system and traditional verification processes[cite: 59].

Please acknowledge these instructions and ask if you should begin with Phase 1 (Smart Contracts).