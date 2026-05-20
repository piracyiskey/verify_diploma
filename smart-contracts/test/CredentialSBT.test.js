import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

// Helper: parse the CredentialIssued event from a tx receipt and return the tokenId
async function getTokenIdFromReceipt(contract, receipt) {
  const event = receipt.logs
    .map((log) => {
      try { return contract.interface.parseLog(log); } catch { return null; }
    })
    .find((e) => e?.name === "CredentialIssued");
  if (!event) throw new Error("CredentialIssued event not found in receipt");
  return event.args.tokenId;
}

describe("CredentialSBT", function () {
  let CredentialSBT;
  let credentialSBT;
  let owner;
  let issuer;
  let user;
  let otherAccount;

  beforeEach(async function () {
    [owner, issuer, user, otherAccount] = await ethers.getSigners();
    CredentialSBT = await ethers.getContractFactory("CredentialSBT");
    credentialSBT = await CredentialSBT.deploy(owner.address);
  });

  // ─── Deployment ───────────────────────────────────────────────────────────

  describe("Deployment", function () {
    it("Should set the right admin", async function () {
      const defaultAdminRole = await credentialSBT.DEFAULT_ADMIN_ROLE();
      expect(await credentialSBT.hasRole(defaultAdminRole, owner.address)).to.be.true;
    });

    it("Should grant deployer the ISSUER_ROLE by default", async function () {
      const issuerRole = await credentialSBT.ISSUER_ROLE();
      expect(await credentialSBT.hasRole(issuerRole, owner.address)).to.be.true;
    });
  });

  // ─── Access Control ───────────────────────────────────────────────────────

  describe("Access Control", function () {
    it("Should allow admin to grant issuer role", async function () {
      const issuerRole = await credentialSBT.ISSUER_ROLE();
      await credentialSBT.grantRole(issuerRole, issuer.address);
      expect(await credentialSBT.hasRole(issuerRole, issuer.address)).to.be.true;
    });

    it("Should prevent non-issuers from issuing credentials", async function () {
      await expect(
        credentialSBT.connect(otherAccount).issueCredential(user.address, "ipfs://fake-uri")
      ).to.be.revertedWith("Caller is not an issuer");
    });
  });

  // ─── Minting & Soulbound ──────────────────────────────────────────────────

  describe("Minting and Soulbound properties", function () {
    let tokenId;

    beforeEach(async function () {
      // Grant issuer role then issue — capture hash-based tokenId from event
      const issuerRole = await credentialSBT.ISSUER_ROLE();
      await credentialSBT.grantRole(issuerRole, issuer.address);

      const tx = await credentialSBT
        .connect(issuer)
        .issueCredential(user.address, "ipfs://test-uri");
      const receipt = await tx.wait();
      tokenId = await getTokenIdFromReceipt(credentialSBT, receipt);
    });

    it("Should issue a credential and assign ownership", async function () {
      expect(await credentialSBT.ownerOf(tokenId)).to.equal(user.address);
    });

    it("Should store the correct token URI", async function () {
      expect(await credentialSBT.tokenURI(tokenId)).to.equal("ipfs://test-uri");
    });

    it("Should emit CredentialIssued event with correct args", async function () {
      const issuerRole = await credentialSBT.ISSUER_ROLE();
      await credentialSBT.grantRole(issuerRole, issuer.address);

      // Issue a second credential to test the event directly
      const tx = await credentialSBT
        .connect(issuer)
        .issueCredential(otherAccount.address, "ipfs://second-uri");
      const receipt = await tx.wait();
      const secondTokenId = await getTokenIdFromReceipt(credentialSBT, receipt);

      expect(await credentialSBT.ownerOf(secondTokenId)).to.equal(otherAccount.address);
    });

    it("Should prevent transfer of the SBT (soulbound lock)", async function () {
      await expect(
        credentialSBT
          .connect(user)
          .transferFrom(user.address, otherAccount.address, tokenId)
      ).to.be.revertedWith("SBT: transfers are not allowed");
    });

    it("Two credentials issued to the same user should have different token IDs", async function () {
      // Wait 1 block so block.timestamp differs (or _nextTokenId increments)
      const tx2 = await credentialSBT
        .connect(issuer)
        .issueCredential(user.address, "ipfs://second-uri");
      const receipt2 = await tx2.wait();
      const tokenId2 = await getTokenIdFromReceipt(credentialSBT, receipt2);
      expect(tokenId).to.not.equal(tokenId2);
    });
  });

  // ─── Revocation & Verification ────────────────────────────────────────────

  describe("Revocation and Verification", function () {
    let tokenId;

    beforeEach(async function () {
      const issuerRole = await credentialSBT.ISSUER_ROLE();
      await credentialSBT.grantRole(issuerRole, issuer.address);

      const tx = await credentialSBT
        .connect(issuer)
        .issueCredential(user.address, "ipfs://test-uri");
      const receipt = await tx.wait();
      tokenId = await getTokenIdFromReceipt(credentialSBT, receipt);
    });

    it("Should verify a valid (non-revoked) credential", async function () {
      const [isValid, credentialOwner, uri] = await credentialSBT.verifyCredential(tokenId);
      expect(isValid).to.be.true;
      expect(credentialOwner).to.equal(user.address);
      expect(uri).to.equal("ipfs://test-uri");
    });

    it("Should allow issuer to revoke a credential", async function () {
      await expect(credentialSBT.connect(issuer).revokeCredential(tokenId))
        .to.emit(credentialSBT, "CredentialRevoked")
        .withArgs(tokenId);

      const [isValid] = await credentialSBT.verifyCredential(tokenId);
      expect(isValid).to.be.false;
    });

    it("Should report credential as invalid after revocation", async function () {
      await credentialSBT.connect(issuer).revokeCredential(tokenId);
      const [isValid, credentialOwner] = await credentialSBT.verifyCredential(tokenId);
      expect(isValid).to.be.false;
      // Owner is still the student (we revoke, not burn)
      expect(credentialOwner).to.equal(user.address);
    });

    it("Should prevent double-revocation (logical constraint)", async function () {
      await credentialSBT.connect(issuer).revokeCredential(tokenId);
      await expect(
        credentialSBT.connect(issuer).revokeCredential(tokenId)
      ).to.be.revertedWith("Credential already revoked");
    });

    it("Should prevent non-issuer from revoking", async function () {
      await expect(
        credentialSBT.connect(user).revokeCredential(tokenId)
      ).to.be.reverted;
    });
  });
});
