// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./DojoToken.sol";
import "./Achievements.sol";

/// @title GameManager (off-chain trading, on-chain settlement)
/// @notice Users trade freely off-chain during a round. At round end the
///         owner calls settleRound with computed net deltas; winners are
///         minted DOJO, losers' DOJO is burned (capped at current balance).
contract GameManager is Ownable {
    DojoToken public dojo;
    Achievements public achievements;

    uint256 public constant INITIAL_MINT = 1000 ether;
    uint256 public constant REFILL_AMOUNT = 500 ether;
    uint256 public constant BANKRUPT_BADGE_ID = 5;

    struct Round {
        uint256 threshold;
        uint256 resolutionPrice;
        uint256 startTime;
        bool resolved;
    }

    mapping(uint256 => Round) public rounds;
    mapping(address => bool) public hasMinted;
    mapping(address => bool) public hasClaimedRefill;

    event RoundCreated(uint256 indexed roundId, uint256 threshold, uint256 startTime);
    event RoundSettled(uint256 indexed roundId, uint256 resolutionPrice, bool yesWins, uint256 userCount);
    event SettlementApplied(uint256 indexed roundId, address indexed user, int256 delta);
    event FirstMinted(address indexed user, uint256 amount);
    event RefillClaimed(address indexed user, uint256 amount);

    constructor(address _dojo, address _achievements) Ownable(msg.sender) {
        dojo = DojoToken(_dojo);
        achievements = Achievements(_achievements);
    }

    function firstMint(address user) external onlyOwner {
        require(!hasMinted[user], "Already minted");
        hasMinted[user] = true;
        dojo.mint(user, INITIAL_MINT);
        emit FirstMinted(user, INITIAL_MINT);
    }

    function createRound(uint256 roundId, uint256 threshold) external onlyOwner {
        require(rounds[roundId].startTime == 0, "Round exists");
        rounds[roundId] = Round({
            threshold: threshold,
            resolutionPrice: 0,
            startTime: block.timestamp,
            resolved: false
        });
        emit RoundCreated(roundId, threshold, block.timestamp);
    }

    /// @notice Applies off-chain computed deltas. Positive delta = mint (winner),
    ///         negative delta = burn (loser). Debits are capped at the user's
    ///         current balance so a bankrupt user just zeros out cleanly.
    function settleRound(
        uint256 roundId,
        uint256 chainlinkPrice,
        address[] calldata users,
        int256[] calldata deltas
    ) external onlyOwner {
        Round storage round = rounds[roundId];
        require(round.startTime > 0, "Round does not exist");
        require(!round.resolved, "Already resolved");
        require(users.length == deltas.length, "length mismatch");

        round.resolutionPrice = chainlinkPrice;
        round.resolved = true;
        bool yesWins = chainlinkPrice >= round.threshold;

        for (uint256 i = 0; i < users.length; i++) {
            address u = users[i];
            int256 d = deltas[i];
            if (d > 0) {
                dojo.mint(u, uint256(d));
            } else if (d < 0) {
                uint256 debit = uint256(-d);
                uint256 bal = dojo.balanceOf(u);
                if (debit > bal) debit = bal;
                if (debit > 0) dojo.burn(u, debit);
            }
            emit SettlementApplied(roundId, u, d);
        }

        emit RoundSettled(roundId, chainlinkPrice, yesWins, users.length);
    }

    function claimRefill() external {
        require(dojo.balanceOf(msg.sender) == 0, "Not bankrupt");
        require(!hasClaimedRefill[msg.sender], "Already refilled");
        hasClaimedRefill[msg.sender] = true;
        dojo.mint(msg.sender, REFILL_AMOUNT);
        achievements.mint(msg.sender, BANKRUPT_BADGE_ID);
        emit RefillClaimed(msg.sender, REFILL_AMOUNT);
    }
}
