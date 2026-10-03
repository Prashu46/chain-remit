// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ChainRemit is Ownable, ReentrancyGuard {

    IERC20 public immutable token;

    struct Remittance {
        address sender;
        address recipient;
        uint256 amount;
        uint256 fee;
        uint256 claimableAmount;
        bool completed;
    }

    mapping(uint256 => Remittance) public remittances;

    mapping(address => bool) public registeredUsers;

    uint256 private nextRemittanceId;

    uint256 public feeBasisPoints = 50;

    uint256 public accumulatedFees;

    event UserRegistered(address indexed user);

    event RemittanceCreated(
        uint256 indexed remittanceId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        uint256 fee,
        uint256 claimableAmount
    );

    constructor(address tokenAddress) Ownable(msg.sender) {
        require(tokenAddress != address(0), "Invalid token address");
        token = IERC20(tokenAddress);
    }

    function registerUser() external {
        registeredUsers[msg.sender] = true;

        emit UserRegistered(msg.sender);
    }

    function isRegistered(address user) external view returns (bool) {
        return registeredUsers[user];
    }

    function setFee(uint256 newFeeBasisPoints) external onlyOwner {
        require(newFeeBasisPoints <= 1000, "Fee too high");

        feeBasisPoints = newFeeBasisPoints;
    }

    function sendRemittance(
        address recipient,
        uint256 amount
    ) external nonReentrant returns (uint256) {

        require(registeredUsers[msg.sender], "Sender not registered");
        require(registeredUsers[recipient], "Recipient not registered");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than zero");

        uint256 fee = (amount * feeBasisPoints) / 10000;

        uint256 claimableAmount = amount - fee;

        require(
            token.transferFrom(msg.sender, address(this), amount),
            "Token transfer failed"
        );

        uint256 remittanceId = nextRemittanceId;

        remittances[remittanceId] = Remittance({
            sender: msg.sender,
            recipient: recipient,
            amount: amount,
            fee: fee,
            claimableAmount: claimableAmount,
            completed: false
        });

        nextRemittanceId++;

        accumulatedFees += fee;

        emit RemittanceCreated(
            remittanceId,
            msg.sender,
            recipient,
            amount,
            fee,
            claimableAmount
        );

        return remittanceId;
    }
    function withdraw(uint256 remittanceId) external nonReentrant {

    Remittance storage remittance = remittances[remittanceId];

    require(
        remittance.recipient == msg.sender,
        "Not the recipient"
    );

    require(
        !remittance.completed,
        "Already withdrawn"
    );

    uint256 amount = remittance.claimableAmount;

    require(
        amount > 0,
        "Nothing to withdraw"
    );

    remittance.completed = true;
    remittance.claimableAmount = 0;

    require(
        token.transfer(msg.sender, amount),
        "Token transfer failed"
    );
}
}