import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

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

  describe("Deployment", function () {
    it("Should set the right admin", async function () {
      const defaultAdminRole = await credentialSBT.DEFAULT_ADMIN_ROLE();
      expect(await credentialSBT.hasRole(defaultAdminRole, owner.address)).to.be.true;
    });
  });

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

  describe("Minting and Soulbound properties", function () {
    beforeEach(async function () {
      const issuerRole = await credentialSBT.ISSUER_ROLE();
      await credentialSBT.grantRole(issuerRole, issuer.address);
    });

    it("Should issue a credential successfully", async function () {
      await expect(credentialSBT.connect(issuer).issueCredential(user.address, "ipfs://test-uri"))
        .to.emit(credentialSBT, "CredentialIssued")
        .withArgs(user.address, 0, "ipfs://test-uri");

      expect(await credentialSBT.ownerOf(0)).to.equal(user.address);
      expect(await credentialSBT.tokenURI(0)).to.equal("ipfs://test-uri");
    });

    it("Should prevent transfer of the SBT", async function () {
      await credentialSBT.connect(issuer).issueCredential(user.address, "ipfs://test-uri");
      
      await expect(
        credentialSBT.connect(user).transferFrom(user.address, otherAccount.address, 0)
      ).to.be.revertedWith("SBT: transfers are not allowed");
    });
  });

  describe("Revocation and Verification", function () {
    beforeEach(async function () {
      const issuerRole = await credentialSBT.ISSUER_ROLE();
      await credentialSBT.grantRole(issuerRole, issuer.address);
      await credentialSBT.connect(issuer).issueCredential(user.address, "ipfs://test-uri");
    });

    it("Should verify a valid credential", async function () {
      const [isValid, credentialOwner, uri] = await credentialSBT.verifyCredential(0);
      expect(isValid).to.be.true;
      expect(credentialOwner).to.equal(user.address);
      expect(uri).to.equal("ipfs://test-uri");
    });

    it("Should allow issuer to revoke credential", async function () {
      await expect(credentialSBT.connect(issuer).revokeCredential(0))
        .to.emit(credentialSBT, "CredentialRevoked")
        .withArgs(0);

      const [isValid, ,] = await credentialSBT.verifyCredential(0);
      expect(isValid).to.be.false;
    });

    it("Should prevent non-issuer from revoking", async function () {
      await expect(
        credentialSBT.connect(user).revokeCredential(0)
      ).to.be.reverted;
    });
  });
});
