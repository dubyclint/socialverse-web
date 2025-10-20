// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract WalletFactory {
    address public admin;

    struct Wallet {
        address owner;
        mapping(string => uint256) balances;
        bool exists;
    }

    mapping(address => Wallet) private wallets;
    string[] public supportedTokens = ["USDT", "USDC", "BTC", "ETH", "SOL", "MATIC", "XAUT"];

    event WalletCreated(address indexed user);
    event Deposit(address indexed user, string token, uint256 amount);
    event Transfer(address indexed from, address indexed to, string token, uint256 amount);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function createWallet(address user) external onlyAdmin {
        require(!wallets[user].exists, "Wallet already exists");
        wallets[user].owner = user;
        wallets[user].exists = true;
        emit WalletCreated(user);
    }

    function deposit(address user, string memory token, uint256 amount) external onlyAdmin {
        require(wallets[user].exists, "Wallet not found");
        wallets[user].balances[token] += amount;
        emit Deposit(user, token, amount);
    }

    function transfer(address from, address to, string memory token, uint256 amount) external onlyAdmin {
        require(wallets[from].balances[token] >= amount, "Insufficient balance");
        wallets[from].balances[token] -= amount;
        wallets[to].balances[token] += amount;
        emit Transfer(from, to, token, amount);
    }

    function getBalance(address user, string memory token) external view returns (uint256) {
        return wallets[user].balances[token];
    }

    function addSupportedToken(string memory token) external onlyAdmin {
        supportedTokens.push(token);
    }
}
