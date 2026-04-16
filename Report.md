# System Impact Analysis Report: TrustChain DApp

## 1. Introduction
This report analyzes the impact of transitioning from traditional, centralized degree and work experience verification systems to a decentralized, blockchain-based model utilizing Soulbound Tokens (SBTs) on Ethereum and IPFS.

## 2. Reducing Manual Verification Time
### Traditional Process
Historically, background checks require HR departments to manually contact universities or previous employers. This can take anywhere from **3 to 14 days**, as it involves finding the right contact person, gaining consent from the applicant, and waiting for the institution’s administrative office to review their database and reply via email or phone.

### Blockchain-Based Process (TrustChain)
With the TrustChain DApp, verification becomes **instantaneous**.
- An employer inputs the applicant's Credential ID or wallet address into the **Verifier Tool**.
- The DApp queries the Ethereum smart contract natively.
- Within milliseconds, the system confirms if the Soulbound Token is valid, who issued it, and directly fetches the cryptographic proof (diploma hash and IPFS document URL).
- **Impact:** Reduces verification latency from up to 2 weeks to a few seconds.

## 3. Financial Impact: Administrative and Background Check Costs
### Traditional Cost
Companies in the US typically spend **$30 to $100 per candidate** on third-party background screening companies to verify education and employment history. Universities also spend significant resources employing registrars to handle thousands of verification requests every graduation season.

### Blockchain-Based Cost
- **Issuance Cost:** Educational institutions pay a small amount of gas fees to mint an SBT credential (~$0.50 - $5 on L2 networks or sidechains). Storage on IPFS costs pennies per document or is subsidized via Pinata.
- **Verification Cost:** Entirely **$0** (Free). Reading data from a smart contract requires no gas fees. Companies no longer need background check agencies for education and employment history.
- **Resource Savings:** Universities can reallocate administrative staffing resources because the verification is fully automated and self-serve.

## 4. Direct Comparison: Decentralized vs Traditional

| Feature | Traditional Process | TrustChain (Decentralized System) |
| --- | --- | --- |
| **Speed** | 3 - 14 Days | Milliseconds (Instantaneous) |
| **Cost to Verify** | $30 - $100 per check | $0 |
| **Data Ownership** | Siloed in University Databases | Held natively in the User's Wallet (Decentralized) |
| **Fraud Resistance** | Medium (PDFs can be forged) | Extremely High (Immutable cryptographic proof) |
| **Availability** | Dependent on school office hours | 24/7/365 (Ethereum network uptime) |
| **Revocability** | Difficult to communicate publicly | Instant, permanent on-chain update |

## 5. Summary
The implementation of the TrustChain DApp provides an irrefutable, cryptographically secure method of proving educational and professional history. By using Soulbound Tokens, the system maintains the integrity of issuance (students cannot trade or transfer degrees), and offloads the data storage entirely to IPFS, ensuring user privacy by storing only non-sensitive metadata and secure hashes on the public ledger.
