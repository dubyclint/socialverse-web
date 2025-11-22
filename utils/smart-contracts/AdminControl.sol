// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AdminControl {
    address public superAdmin;
    mapping(address => bool) public isAdmin;
    uint256 public swapFeeLow = 5;  // 0.5%
    uint256 public swapFeeHigh = 3; // 0.3%
    uint256 public giftFee = 0;     // default 0%

    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    event FeesUpdated(uint256 swapLow, uint256 swapHigh, uint256 giftFee);

    modifier onlySuperAdmin() {
        require(msg.sender == superAdmin, "Only super admin");
        _;
    }

    modifier onlyAdmin() {
        require(isAdmin[msg.sender], "Only admin");
        _;
    }

    constructor() {
        superAdmin = msg.sender;
        isAdmin[msg.sender] = true;
    }

    function addAdmin(address admin) external onlySuperAdmin {
        isAdmin[admin] = true;
        emit AdminAdded(admin);
    }

    function removeAdmin(address admin) external onlySuperAdmin {
        isAdmin[admin] = false;
        emit AdminRemoved(admin);
    }

    function updateFees(uint256 low, uint256 high, uint256 gift) external onlyAdmin {
        swapFeeLow = low;
        swapFeeHigh = high;
        giftFee = gift;
        emit FeesUpdated(low, high, gift);
    }

    function getFees() external view returns (uint256, uint256, uint256) {
        return (swapFeeLow, swapFeeHigh, giftFee);
    }
}
