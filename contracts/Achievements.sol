// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Achievements is ERC1155, Ownable {
    // Level Badges
    uint256 public constant TRADER_BADGE = 1;
    uint256 public constant SHARK_BADGE = 2;
    uint256 public constant WHALE_BADGE = 3;
    uint256 public constant LEGEND_BADGE = 4;

    // Special
    uint256 public constant BANKRUPT_BADGE = 5;

    // Streaks
    uint256 public constant STREAK_3 = 10;
    uint256 public constant STREAK_5 = 11;
    uint256 public constant STREAK_10 = 12;

    // Scenario Mastery
    uint256 public constant SCENARIO_MASTER_ENTRY = 20;
    uint256 public constant SCENARIO_MASTER_EXIT = 21;
    uint256 public constant SCENARIO_MASTER_SIZING = 22;
    uint256 public constant SCENARIO_MASTER_MOMENTUM = 23;
    uint256 public constant SCENARIO_MASTER_LAST60 = 24;

    // Trading
    uint256 public constant PERFECT_ROUND = 30;
    uint256 public constant CONTRARIAN_WIN = 31;

    mapping(uint256 => string) private _tokenURIs;

    // Track authorized minters (owner + GameManager)
    mapping(address => bool) public authorizedMinters;

    event AchievementMinted(address indexed to, uint256 indexed tokenId);

    constructor(string memory baseUri) ERC1155(baseUri) Ownable(msg.sender) {
        authorizedMinters[msg.sender] = true;
    }

    modifier onlyMinter() {
        require(authorizedMinters[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    function setMinter(address minter, bool authorized) external onlyOwner {
        authorizedMinters[minter] = authorized;
    }

    function mint(address to, uint256 id) external onlyMinter {
        // Each achievement can only be earned once per address
        require(balanceOf(to, id) == 0, "Already earned");
        _mint(to, id, 1, "");
        emit AchievementMinted(to, id);
    }

    function setTokenURI(uint256 id, string memory tokenURI) external onlyOwner {
        _tokenURIs[id] = tokenURI;
    }

    function uri(uint256 id) public view override returns (string memory) {
        string memory tokenURI = _tokenURIs[id];
        if (bytes(tokenURI).length > 0) {
            return tokenURI;
        }
        return super.uri(id);
    }
}
