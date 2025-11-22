// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PewGift {
    address public admin;

    struct Gift {
        address sender;
        address recipient;
        uint256 amount;
        uint256 toCommenter;
        uint256 toPostOwner;
        bool isCommentGift;
        bool refunded;
    }

    mapping(uint256 => Gift) public gifts;
    uint256 public giftCounter;

    event GiftSent(uint256 giftId, address sender, address recipient, uint256 amount);
    event GiftRefunded(uint256 giftId);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function sendGift(address recipient, bool isCommentGift) external payable returns (uint256) {
        require(msg.value > 0, "Gift must be greater than 0");

        uint256 toCommenter = 0;
        uint256 toPostOwner = msg.value;

        if (isCommentGift) {
            toCommenter = (msg.value * 70) / 100;
            toPostOwner = msg.value - toCommenter;
        }

        uint256 giftId = giftCounter++;
        gifts[giftId] = Gift({
            sender: msg.sender,
            recipient: recipient,
            amount: msg.value,
            toCommenter: toCommenter,
            toPostOwner: toPostOwner,
            isCommentGift: isCommentGift,
            refunded: false
        });

        emit GiftSent(giftId, msg.sender, recipient, msg.value);
        return giftId;
    }

    function releaseGift(uint256 giftId, address postOwner, address commenter) external onlyAdmin {
        Gift storage gift = gifts[giftId];
        require(!gift.refunded, "Already refunded");

        if (gift.isCommentGift) {
            payable(commenter).transfer(gift.toCommenter);
            payable(postOwner).transfer(gift.toPostOwner);
        } else {
            payable(postOwner).transfer(gift.amount);
        }
    }

    function refundGift(uint256 giftId) external onlyAdmin {
        Gift storage gift = gifts[giftId];
        require(!gift.refunded, "Already refunded");

        payable(gift.sender).transfer(gift.amount);
        gift.refunded = true;

        emit GiftRefunded(giftId);
    }
}
