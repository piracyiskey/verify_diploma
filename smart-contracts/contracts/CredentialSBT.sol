// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract CredentialSBT is ERC721URIStorage, AccessControl {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    
    uint256 private _nextTokenId;

    // Mapping to store if a tokenId is revoked
    mapping(uint256 => bool) private _revokedCredentials;

    // Events
    event CredentialIssued(address indexed to, uint256 indexed tokenId, string uri);
    event CredentialRevoked(uint256 indexed tokenId);

    constructor(address defaultAdmin) ERC721("CredentialSBT", "CSBT") {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(ISSUER_ROLE, defaultAdmin);
    }

    modifier onlyIssuer() {
        require(hasRole(ISSUER_ROLE, msg.sender), "Caller is not an issuer");
        _;
    }

    /**
     * @dev Issues a new credential SBT to a given address.
     */
    function issueCredential(address to, string memory uri) external onlyIssuer returns (uint256) {
        // Generate a complex and unique token ID
        uint256 tokenId = uint256(keccak256(abi.encodePacked(to, uri, block.timestamp, _nextTokenId++)));
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        emit CredentialIssued(to, tokenId, uri);
        return tokenId;
    }

    /**
     * @dev Revokes a credential by marking it as revoked.
     */
    function revokeCredential(uint256 tokenId) external onlyIssuer {
        // Make sure it exists. If it exists, ownerOf won't revert (in OZ v5 it might return address(0) for burned, but we don't burn).
        // Since we overridden _update and restrict, we can just check ownerOf.
        require(ownerOf(tokenId) != address(0), "Credential does not exist");
        require(!_revokedCredentials[tokenId], "Credential already revoked");
        
        _revokedCredentials[tokenId] = true;
        emit CredentialRevoked(tokenId);
    }

    /**
     * @dev Verifies if a credential is valid (exists and is not revoked).
     */
    function verifyCredential(uint256 tokenId) external view returns (bool, address, string memory) {
        address owner = ownerOf(tokenId);
        bool isRevoked = _revokedCredentials[tokenId];
        string memory uri = tokenURI(tokenId);
        return (!isRevoked, owner, uri);
    }

    // --- SOULBOUND RESTRICTIONS ---

    /**
     * @dev Disable token transfers (Soulbound).
     * Only allow minting (from == address(0)) or burning (to == address(0)).
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721)
        returns (address)
    {
        address from = _ownerOf(tokenId);
        // Only allow if minting (from == 0) or burning (to == 0)
        require(from == address(0) || to == address(0), "SBT: transfers are not allowed");
        
        return super._update(to, tokenId, auth);
    }
    
    // The following functions are overrides required by Solidity.

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
