// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Leaderboard is Ownable {
    mapping(address => uint256) public scores;
    address[] public players;
    mapping(address => bool) private isPlayer;

    event ScoreUpdated(address indexed player, uint256 newScore);

    constructor() Ownable(msg.sender) {}

    function updateScore(address player, uint256 score) external onlyOwner {
        if (!isPlayer[player]) {
            isPlayer[player] = true;
            players.push(player);
        }
        scores[player] = score;
        emit ScoreUpdated(player, score);
    }

    function getTopPlayers()
        external
        view
        returns (address[] memory topAddresses, uint256[] memory topScores)
    {
        uint256 count = players.length;
        uint256 returnCount = count > 100 ? 100 : count;

        // Copy arrays for sorting
        address[] memory addrs = new address[](count);
        uint256[] memory scrs = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            addrs[i] = players[i];
            scrs[i] = scores[players[i]];
        }

        // Simple selection sort for top N
        for (uint256 i = 0; i < returnCount; i++) {
            uint256 maxIdx = i;
            for (uint256 j = i + 1; j < count; j++) {
                if (scrs[j] > scrs[maxIdx]) {
                    maxIdx = j;
                }
            }
            if (maxIdx != i) {
                (addrs[i], addrs[maxIdx]) = (addrs[maxIdx], addrs[i]);
                (scrs[i], scrs[maxIdx]) = (scrs[maxIdx], scrs[i]);
            }
        }

        // Return top N
        topAddresses = new address[](returnCount);
        topScores = new uint256[](returnCount);
        for (uint256 i = 0; i < returnCount; i++) {
            topAddresses[i] = addrs[i];
            topScores[i] = scrs[i];
        }
    }

    function getPlayerCount() external view returns (uint256) {
        return players.length;
    }
}
