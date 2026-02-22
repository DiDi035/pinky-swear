// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Escrow is Initializable, ReentrancyGuard {
    enum Status {
        AWAITING_DEPOSIT,
        DEPOSITED,
        CONFIRMED,
        REFUNDED
    }

    address internal buyer;
    address internal seller;
    uint internal amount;
    uint internal deadline;
    Status internal status;
    bool internal buyerConfirmed;
    bool internal sellerConfirmed;

    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _buyer,
        address _seller,
        uint _amount,
        uint _deadline
    ) external initializer {
        buyer = _buyer;
        seller = _seller;
        amount = _amount;
        deadline = block.timestamp + _deadline;
        status = Status.AWAITING_DEPOSIT;
        buyerConfirmed = false;
        sellerConfirmed = false;
    }

    event Deposited(address indexed _escrow, address indexed _buyer, uint _amount);
    event Confirmed(address indexed _escrow, address indexed _seller, uint _amount);
    event Refunded(address indexed _escrow, address indexed _buyer, uint _amount);

    modifier onlyBuyer() {
        require(
            msg.sender == buyer,
            "Only buyer can call this function"
        );
        _;
    }

    modifier onlySeller() {
        require(
            msg.sender == seller,
            "Only seller can call this function"
        );
        _;
    }

    modifier onlyBuyerOrSeller() {
        require(
            msg.sender == buyer || msg.sender == seller,
            "Only buyer or seller can call this function"
        );
        _;
    }

    function deposit() payable external onlyBuyer nonReentrant {
        require(status == Status.AWAITING_DEPOSIT, "Escrow is not awaiting deposit");
        require(msg.value == amount, "Amount sent does not match the escrow amount");
        status = Status.DEPOSITED;
        emit Deposited(address(this), msg.sender, msg.value);
    }

    function confirmDelivery() external onlyBuyerOrSeller nonReentrant {
        require(status == Status.DEPOSITED, "Escrow is not deposited");
        require(block.timestamp <= deadline, "Escrow is expired already");
        if (msg.sender == buyer) {
            require(!buyerConfirmed, "Buyer has already confirmed delivery");
            buyerConfirmed = true;
        } else {
            require(!sellerConfirmed, "Seller has already confirmed delivery");
            sellerConfirmed = true;
        }

        if (buyerConfirmed && sellerConfirmed) {
            (bool success,) = payable(seller).call{value: amount}("");
            require(success, "Transfer to seller failed");
            status = Status.CONFIRMED;
            emit Confirmed(address(this), seller, amount);
        }
    }

    function refund() external onlyBuyer nonReentrant {
        require(
            status == Status.DEPOSITED,
            "Escrow is not deposited"
        );
        require(block.timestamp > deadline, "Escrow is not expired yet");
        (bool success,) = payable(buyer).call{value: amount}("");
        require(success, "Transfer to buyer failed");
        status = Status.REFUNDED;
        emit Refunded(address(this), msg.sender, amount);
    }

    function getDetails() external view returns (
        address,
        address,
        uint,
        uint,
        Status,
        bool,
        bool
    ) {
        return (
            buyer,
            seller,
            amount,
            deadline,
            status,
            buyerConfirmed,
            sellerConfirmed
        );
    }
}
