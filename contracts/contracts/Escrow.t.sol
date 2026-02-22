// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Escrow} from "./Escrow.sol";
import {EscrowFactory} from "./EscrowFactory.sol";
import {Test} from "forge-std/Test.sol";

/// Helper so the buyer is a contract that can send ETH (Hardhat prank may not forward value from test contract).
contract EscrowBuyerHelper {
    function deposit(Escrow escrow) external payable {
        escrow.deposit{value: msg.value}();
    }

    receive() external payable {} // allow receiving refund
}

contract EscrowTest is Test {
    EscrowFactory factory;
    Escrow escrow;
    EscrowBuyerHelper buyerHelper;

    address seller = address(0x2);
    uint256 constant AMOUNT = 1 ether;
    uint256 constant DEADLINE_OFFSET = 3600;

    address buyer; // set in setUp to address(buyerHelper)

    function setUp() public {
        buyerHelper = new EscrowBuyerHelper();
        buyer = address(buyerHelper);
        factory = new EscrowFactory();
        address escrowAddr = factory.createEscrow(buyer, seller, AMOUNT, DEADLINE_OFFSET);
        escrow = Escrow(payable(escrowAddr));
        vm.deal(buyer, AMOUNT);
        vm.deal(address(this), 1000 ether); // test contract sends value when calling helper
    }

    function test_GetDetails_AfterInit() public view {
        (
            address _buyer,
            address _seller,
            uint256 _amount,
            uint256 _deadline,
            Escrow.Status _status,
            bool _buyerConfirmed,
            bool _sellerConfirmed
        ) = escrow.getDetails();
        require(_buyer == buyer, "buyer");
        require(_seller == seller, "seller");
        require(_amount == AMOUNT, "amount");
        require(_deadline == block.timestamp + DEADLINE_OFFSET, "deadline");
        require(_status == Escrow.Status.AWAITING_DEPOSIT, "status");
        require(!_buyerConfirmed, "buyerConfirmed");
        require(!_sellerConfirmed, "sellerConfirmed");
    }

    function test_Deposit_Success() public {
        buyerHelper.deposit{value: AMOUNT}(escrow);
        (, , , , Escrow.Status status, , ) = escrow.getDetails();
        require(status == Escrow.Status.DEPOSITED, "status should be DEPOSITED");
        require(address(escrow).balance == AMOUNT, "escrow balance");
    }

    function test_Deposit_RevertWhen_NotBuyer() public {
        vm.prank(seller);
        (bool success,) = address(escrow).call{value: AMOUNT}(
            abi.encodeWithSelector(Escrow.deposit.selector)
        );
        require(!success, "deposit should revert when not buyer");
    }

    function test_Deposit_RevertWhen_WrongAmount() public {
        vm.prank(buyer);
        vm.expectRevert("Amount sent does not match the escrow amount");
        escrow.deposit{value: AMOUNT - 1}();
    }

    function test_Deposit_RevertWhen_NotAwaitingDeposit() public {
        vm.deal(address(this), AMOUNT * 2);
        buyerHelper.deposit{value: AMOUNT}(escrow);
        vm.expectRevert("Escrow is not awaiting deposit");
        buyerHelper.deposit{value: AMOUNT}(escrow);
    }

    function test_ConfirmDelivery_BothConfirm_ReleasesToSeller() public {
        buyerHelper.deposit{value: AMOUNT}(escrow);
        uint256 sellerBefore = seller.balance;
        vm.prank(buyer);
        escrow.confirmDelivery();
        vm.prank(seller);
        escrow.confirmDelivery();
        require(seller.balance == sellerBefore + AMOUNT, "seller should receive amount");
        (, , , , Escrow.Status status, , ) = escrow.getDetails();
        require(status == Escrow.Status.CONFIRMED, "status should be CONFIRMED");
    }

    function test_ConfirmDelivery_RevertWhen_NotDeposited() public {
        vm.prank(buyer);
        vm.expectRevert("Escrow is not deposited");
        escrow.confirmDelivery();
    }

    function test_ConfirmDelivery_RevertWhen_Expired() public {
        buyerHelper.deposit{value: AMOUNT}(escrow);
        vm.warp(block.timestamp + DEADLINE_OFFSET + 1);
        vm.prank(buyer);
        vm.expectRevert("Escrow is expired already");
        escrow.confirmDelivery();
    }

    function test_ConfirmDelivery_RevertWhen_BuyerAlreadyConfirmed() public {
        buyerHelper.deposit{value: AMOUNT}(escrow);
        vm.prank(buyer);
        escrow.confirmDelivery();
        vm.prank(buyer);
        vm.expectRevert("Buyer has already confirmed delivery");
        escrow.confirmDelivery();
    }

    function test_ConfirmDelivery_RevertWhen_SellerAlreadyConfirmed() public {
        buyerHelper.deposit{value: AMOUNT}(escrow);
        vm.prank(seller);
        escrow.confirmDelivery();
        vm.prank(seller);
        vm.expectRevert("Seller has already confirmed delivery");
        escrow.confirmDelivery();
    }

    function test_Refund_AfterDeadline_ReturnsToBuyer() public {
        buyerHelper.deposit{value: AMOUNT}(escrow);
        vm.warp(block.timestamp + DEADLINE_OFFSET + 1);
        uint256 buyerBefore = buyer.balance;
        vm.prank(buyer);
        escrow.refund();
        require(buyer.balance == buyerBefore + AMOUNT, "buyer should receive refund");
        (, , , , Escrow.Status status, , ) = escrow.getDetails();
        require(status == Escrow.Status.REFUNDED, "status should be REFUNDED");
    }

    function test_Refund_RevertWhen_NotDeposited() public {
        vm.prank(buyer);
        vm.expectRevert("Escrow is not deposited");
        escrow.refund();
    }

    function test_Refund_RevertWhen_NotExpired() public {
        buyerHelper.deposit{value: AMOUNT}(escrow);
        vm.prank(buyer);
        vm.expectRevert("Escrow is not expired yet");
        escrow.refund();
    }

    function test_Refund_RevertWhen_NotBuyer() public {
        buyerHelper.deposit{value: AMOUNT}(escrow);
        vm.warp(block.timestamp + DEADLINE_OFFSET + 1);
        vm.prank(seller);
        vm.expectRevert("Only buyer can call this function");
        escrow.refund();
    }

    function test_Initialize_RevertWhen_CalledTwice() public {
        vm.expectRevert();
        escrow.initialize(buyer, seller, AMOUNT, DEADLINE_OFFSET);
    }
}
