// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./DojoToken.sol";
import "./Achievements.sol";

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

    struct Bet {
        bool isYes;
        uint256 amount;
        uint256 oddsAtEntry; // basis points (e.g. 6500 = 65%)
        bool exists;
    }

    mapping(uint256 => Round) public rounds;
    mapping(uint256 => mapping(address => Bet)) public bets;
    mapping(address => bool) public hasMinted;
    mapping(address => bool) public hasClaimedRefill;

    event RoundCreated(uint256 indexed roundId, uint256 threshold, uint256 startTime);
    event BetPlaced(uint256 indexed roundId, address indexed user, bool isYes, uint256 amount);
    event RoundResolved(uint256 indexed roundId, uint256 resolutionPrice, bool yesWins);
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

    function placeBet(uint256 roundId, bool isYes, uint256 amount, uint256 oddsAtEntry) external {
        require(rounds[roundId].startTime > 0, "Round does not exist");
        require(!rounds[roundId].resolved, "Round already resolved");
        require(!bets[roundId][msg.sender].exists, "Already bet this round");
        require(amount > 0, "Amount must be > 0");

        dojo.transferFrom(msg.sender, address(this), amount);
        bets[roundId][msg.sender] = Bet({
            isYes: isYes,
            amount: amount,
            oddsAtEntry: oddsAtEntry,
            exists: true
        });
        emit BetPlaced(roundId, msg.sender, isYes, amount);
    }

    function resolveRound(
        uint256 roundId,
        uint256 chainlinkPrice,
        address[] calldata participants
    ) external onlyOwner {
        Round storage round = rounds[roundId];
        require(round.startTime > 0, "Round does not exist");
        require(!round.resolved, "Already resolved");

        round.resolutionPrice = chainlinkPrice;
        round.resolved = true;

        bool yesWins = chainlinkPrice >= round.threshold;

        // Pay out winners: winners get their bet back + losers' bets proportionally
        uint256 totalWinnerBets = 0;
        uint256 totalLoserBets = 0;

        for (uint256 i = 0; i < participants.length; i++) {
            Bet storage bet = bets[roundId][participants[i]];
            if (!bet.exists) continue;
            if (bet.isYes == yesWins) {
                totalWinnerBets += bet.amount;
            } else {
                totalLoserBets += bet.amount;
            }
        }

        // Distribute winnings
        for (uint256 i = 0; i < participants.length; i++) {
            Bet storage bet = bets[roundId][participants[i]];
            if (!bet.exists) continue;
            if (bet.isYes == yesWins && totalWinnerBets > 0) {
                uint256 share = bet.amount + (bet.amount * totalLoserBets) / totalWinnerBets;
                dojo.mint(participants[i], share);
            }
            // Losers' tokens are already in the contract (burned effectively)
        }

        // Burn leftover tokens held by contract
        uint256 contractBalance = dojo.balanceOf(address(this));
        if (contractBalance > 0) {
            dojo.burn(address(this), contractBalance);
        }

        emit RoundResolved(roundId, chainlinkPrice, yesWins);
    }

    function claimRefill() external {
        require(dojo.balanceOf(msg.sender) == 0, "Not bankrupt");
        require(!hasClaimedRefill[msg.sender], "Already refilled");
        hasClaimedRefill[msg.sender] = true;
        dojo.mint(msg.sender, REFILL_AMOUNT);
        achievements.mint(msg.sender, BANKRUPT_BADGE_ID);
        emit RefillClaimed(msg.sender, REFILL_AMOUNT);
    }

    function getBet(uint256 roundId, address user)
        external
        view
        returns (bool isYes, uint256 amount, uint256 oddsAtEntry, bool exists)
    {
        Bet storage bet = bets[roundId][user];
        return (bet.isYes, bet.amount, bet.oddsAtEntry, bet.exists);
    }
}
