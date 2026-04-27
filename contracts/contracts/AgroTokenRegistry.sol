// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * AgroTokenRegistry — ERC-1155 Security Token para ativos agrícolas
 *
 * Cada AgroToken no banco de dados corresponde a um tokenId on-chain.
 * O tokenId é derivado do UUID do DB (128-bit UUID → uint256).
 *
 * Fluxo:
 *   1. Admin aprova token no painel → API chama mint() → emite totalTokens para wallet da plataforma
 *   2. Investidor compra → API emite evento Purchase on-chain
 *   3. Produtor resgata → API chama burn() → tokens destruídos
 *
 * Whitelist: só endereços KYC-verificados podem receber tokens (exceto minting/burning).
 */
contract AgroTokenRegistry is ERC1155, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    mapping(uint256 => string) public tokenMetadata;
    mapping(uint256 => uint256) public tokenSupply;
    mapping(address => bool) public whitelisted;

    event TokenMinted(uint256 indexed tokenId, address indexed to, uint256 amount, string metadataHash);
    event TokenBurned(uint256 indexed tokenId, address indexed from, uint256 amount);
    event Purchase(uint256 indexed tokenId, address indexed buyer, uint256 quantity, uint256 totalAmountCents);

    constructor(address admin) ERC1155("https://agros-os.vercel.app/api/tokens/metadata/{id}") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        whitelisted[admin] = true;
    }

    function mint(
        address to,
        uint256 tokenId,
        uint256 amount,
        string calldata metadataHash
    ) external onlyRole(MINTER_ROLE) whenNotPaused {
        if (bytes(tokenMetadata[tokenId]).length == 0) {
            tokenMetadata[tokenId] = metadataHash;
        }
        tokenSupply[tokenId] += amount;
        _mint(to, tokenId, amount, "");
        emit TokenMinted(tokenId, to, amount, metadataHash);
    }

    function burn(
        address from,
        uint256 tokenId,
        uint256 amount
    ) external onlyRole(MINTER_ROLE) {
        require(tokenSupply[tokenId] >= amount, "Saldo insuficiente");
        tokenSupply[tokenId] -= amount;
        _burn(from, tokenId, amount);
        emit TokenBurned(tokenId, from, amount);
    }

    // Registra compra on-chain sem mover tokens (investidor não tem wallet própria no MVP)
    function recordPurchase(
        uint256 tokenId,
        address buyer,
        uint256 quantity,
        uint256 totalAmountCents
    ) external onlyRole(MINTER_ROLE) {
        emit Purchase(tokenId, buyer, quantity, totalAmountCents);
    }

    function addToWhitelist(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        whitelisted[account] = true;
    }

    function removeFromWhitelist(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        whitelisted[account] = false;
    }

    // Só permite transferências entre carteiras whitelisted (KYC)
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override whenNotPaused {
        if (from != address(0) && to != address(0)) {
            require(whitelisted[to], "Destinatario nao verificado via KYC");
        }
        super._update(from, to, ids, values);
    }

    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC1155, AccessControl)
        returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
