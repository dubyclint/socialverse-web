// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

interface IAdminControl {
    function getGiftFee() external view returns (uint256);
}

contract EscrowDeal {
    address public owner;
    IAdminControl public adminControl;
    IERC20 public token;

    enum Status { Pending, Released, Refunded }

    struct Deal {
        address buyer;
        address seller;
        uint256 amount;
        Status status;
    }

    mapping(uint256 => Deal) public deals;
    uint256 public dealCounter;
    mapping(address => bool) public isAdmin;

    event DealCreated(uint256 indexed dealId, address indexed buyer, address indexed seller, uint256 amount, string tokenSymbol);
    event DealStatusChanged(uint256 indexed dealId, Status status, address triggeredBy);

    modifier onlyAdmin() {
        require(isAdmin[msg.sender], "Not authorized");
        _;
    }

    constructor(address _adminControl, address _tokenAddress) {
        owner = msg.sender;
        adminControl = IAdminControl(_adminControl);
        token = IERC20(_tokenAddress);
        isAdmin[msg.sender] = true;
    }

    function addAdmin(address newAdmin) external {
        require(msg.sender == owner, "Only owner");
        isAdmin[newAdmin] = true;
    }

    function createDeal(address seller, uint256 amount) external returns (uint256) {
        require(amount > 0, "Amount must be > 0");
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        uint256 dealId = dealCounter++;
        deals[dealId] = Deal({
            buyer: msg.sender,
            seller: seller,
            amount: amount,
            status: Status.Pending
        });

        emit DealCreated(dealId, msg.sender, seller, amount, "USDC");
        return dealId;
    }

    function releaseDeal(uint256 dealId) external onlyAdmin {
        Deal storage deal = deals[dealId];
        require(deal.status == Status.Pending, "Not pending");

        require(token.transfer(deal.seller, deal.amount), "Release failed");
        deal.status = Status.Released;

        emit DealStatusChanged(dealId, Status.Released, msg.sender);
    }

    function refundDeal(uint256 dealId) external onlyAdmin {
        Deal storage deal = deals[dealId];
        require(deal.status == Status.Pending, "Not pending");

        require(token.transfer(deal.buyer, deal.amount), "Refund failed");
        deal.status = Status.Refunded;

        emit DealStatusChanged(dealId, Status.Refunded, msg.sender);
    }

    function getDeal(uint256 dealId) external view returns (
        address buyer,
        address seller,
        uint256 amount,
        Status status
    ) {
        Deal memory deal = deals[dealId];
        return (deal.buyer, deal.seller, deal.amount, deal.status);
    }

    function getGiftFee() external view returns (uint256) {
        return adminControl.getGiftFee();
    }
}

