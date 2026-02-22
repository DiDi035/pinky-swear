// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

import {Escrow} from "./Escrow.sol";

contract EscrowFactory is Ownable {
    address public escrowImplementation;

    constructor() Ownable(msg.sender) {
        escrowImplementation = address(new Escrow());
    }

    mapping(address => Escrow) public addressToEscrow;
    address[] public escrows;

    event EscrowCreated(
        address indexed _escrow,
        address indexed _buyer,
        address indexed _seller,
        uint _amount,
        uint _deadline
    );

    function createEscrow(
        address _buyer,
        address _seller,
        uint _amount,
        uint _deadline
    ) external onlyOwner returns (address) {
        require(
            _buyer != address(0) && _seller != address(0),
            "Buyer and seller cannot be the zero address"
        );
        require(
            _buyer != _seller,
            "Buyer and seller must be different addresses"
        );
        require(
            _amount > 0,
            "Amount must be greater than 0"
        );
        require(
            _deadline > 0,
            "Deadline must be greater than 0"
        );
        address escrowClone = Clones.clone(escrowImplementation);
        Escrow(escrowClone).initialize(_buyer, _seller, _amount, _deadline);
        escrows.push(escrowClone);
        addressToEscrow[escrowClone] = Escrow(escrowClone);
        emit EscrowCreated(escrowClone, _buyer, _seller, _amount, _deadline);
        return escrowClone;
    }
}
