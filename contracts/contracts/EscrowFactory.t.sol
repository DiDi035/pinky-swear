// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Escrow} from "./Escrow.sol";
import {EscrowFactory} from "./EscrowFactory.sol";
import {Test} from "forge-std/Test.sol";

contract EscrowFactoryTest is Test {
    EscrowFactory factory;

    address owner = address(0x1);
    address buyer = address(0x2);
    address seller = address(0x3);
    uint256 constant AMOUNT = 1 ether;
    uint256 constant DEADLINE_OFFSET = 3600;

    function setUp() public {
        vm.prank(owner);
        factory = new EscrowFactory();
    }

    function test_CreateEscrow_Success() public {
        vm.prank(owner);
        address escrowAddr = factory.createEscrow(buyer, seller, AMOUNT, DEADLINE_OFFSET);
        require(escrowAddr != address(0), "clone address");
        require(
            address(factory.addressToEscrow(escrowAddr)) == escrowAddr,
            "mapping should point to clone"
        );
        require(factory.escrows(0) == escrowAddr, "array should contain clone");
        Escrow escrow = Escrow(payable(escrowAddr));
        (
            address _buyer,
            address _seller,
            uint256 _amount,
            uint256 _deadline,
            Escrow.Status _status,
            ,
        ) = escrow.getDetails();
        require(_buyer == buyer, "buyer");
        require(_seller == seller, "seller");
        require(_amount == AMOUNT, "amount");
        require(_deadline == block.timestamp + DEADLINE_OFFSET, "deadline");
        require(_status == Escrow.Status.AWAITING_DEPOSIT, "status");
    }

    function test_CreateEscrow_RevertWhen_ZeroBuyer() public {
        vm.prank(owner);
        vm.expectRevert("Buyer and seller cannot be the zero address");
        factory.createEscrow(address(0), seller, AMOUNT, DEADLINE_OFFSET);
    }

    function test_CreateEscrow_RevertWhen_ZeroSeller() public {
        vm.prank(owner);
        vm.expectRevert("Buyer and seller cannot be the zero address");
        factory.createEscrow(buyer, address(0), AMOUNT, DEADLINE_OFFSET);
    }

    function test_CreateEscrow_RevertWhen_SameBuyerSeller() public {
        vm.prank(owner);
        vm.expectRevert("Buyer and seller must be different addresses");
        factory.createEscrow(buyer, buyer, AMOUNT, DEADLINE_OFFSET);
    }

    function test_CreateEscrow_RevertWhen_ZeroAmount() public {
        vm.prank(owner);
        vm.expectRevert("Amount must be greater than 0");
        factory.createEscrow(buyer, seller, 0, DEADLINE_OFFSET);
    }

    function test_CreateEscrow_RevertWhen_ZeroDeadline() public {
        vm.prank(owner);
        vm.expectRevert("Deadline must be greater than 0");
        factory.createEscrow(buyer, seller, AMOUNT, 0);
    }

    function test_CreateEscrow_RevertWhen_NotOwner() public {
        vm.prank(buyer);
        vm.expectRevert();
        factory.createEscrow(buyer, seller, AMOUNT, DEADLINE_OFFSET);
    }
}
