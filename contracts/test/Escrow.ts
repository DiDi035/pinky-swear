import { expect } from "chai";
import { network } from "hardhat";
import type { Escrow } from "../types/ethers-contracts/Escrow.js";
import type { EscrowFactory } from "../types/ethers-contracts/EscrowFactory.js";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/types";

const { ethers } = await network.connect();

const AMOUNT = 1n * 10n ** 18n;
const DEADLINE_OFFSET = 3600n;

describe("Escrow (integration)", function () {
  let factory: EscrowFactory;
  let escrow: Escrow;
  let owner: HardhatEthersSigner;
  let buyer: HardhatEthersSigner;
  let seller: HardhatEthersSigner;

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    owner = signers[0];
    buyer = signers[1];
    seller = signers[2];
    factory = await ethers.deployContract("EscrowFactory", [], owner) as unknown as EscrowFactory;
    const tx = await factory.createEscrow(
      await buyer.getAddress(),
      await seller.getAddress(),
      AMOUNT,
      DEADLINE_OFFSET,
    );
    const receipt = await tx.wait();
    const filter = factory.filters.EscrowCreated();
    const events = await factory.queryFilter(filter, receipt?.blockNumber ?? 0);
    expect(events.length).to.equal(1);
    const escrowAddr = events[0].args?.[0];
    expect(escrowAddr).to.be.properAddress;
    escrow = await ethers.getContractAt("Escrow", escrowAddr) as unknown as Escrow;
  });

  describe("createEscrow", function () {
    it("Should emit EscrowCreated with correct args", async function () {
      const factory2 = await ethers.deployContract("EscrowFactory", [], owner);
      const tx = await factory2.createEscrow(
        await buyer.getAddress(),
        await seller.getAddress(),
        AMOUNT,
        DEADLINE_OFFSET,
      );
      const receipt = await tx.wait();
      const events = await factory2.queryFilter(
        factory2.filters.EscrowCreated(),
        receipt?.blockNumber ?? 0,
      );
      expect(events.length).to.equal(1);
      const [escrowAddr, _buyer, _seller, amount, deadline] = events[0].args ?? [];
      expect(escrowAddr).to.be.properAddress;
      expect(_buyer).to.equal(await buyer.getAddress());
      expect(_seller).to.equal(await seller.getAddress());
      expect(amount).to.equal(AMOUNT);
      expect(deadline).to.equal(DEADLINE_OFFSET);
    });

    it("Should revert when buyer is zero address", async function () {
      const zero = "0x0000000000000000000000000000000000000000";
      await expect(
        factory.createEscrow(zero, await seller.getAddress(), AMOUNT, DEADLINE_OFFSET),
      ).to.be.revertedWith("Buyer and seller cannot be the zero address");
    });

    it("Should revert when seller is zero address", async function () {
      const zero = "0x0000000000000000000000000000000000000000";
      await expect(
        factory.createEscrow(await buyer.getAddress(), zero, AMOUNT, DEADLINE_OFFSET),
      ).to.be.revertedWith("Buyer and seller cannot be the zero address");
    });

    it("Should revert when buyer equals seller", async function () {
      const addr = await buyer.getAddress();
      await expect(
        factory.createEscrow(addr, addr, AMOUNT, DEADLINE_OFFSET),
      ).to.be.revertedWith("Buyer and seller must be different addresses");
    });

    it("Should revert when amount is zero", async function () {
      await expect(
        factory.createEscrow(
          await buyer.getAddress(),
          await seller.getAddress(),
          0n,
          DEADLINE_OFFSET,
        ),
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should revert when not owner", async function () {
      const notOwner = (await ethers.getSigners())[3];
      const factoryAsOther = factory.connect(notOwner) as typeof factory;
      await expect(
        factoryAsOther.createEscrow(
          await buyer.getAddress(),
          await seller.getAddress(),
          AMOUNT,
          DEADLINE_OFFSET,
        ),
      ).to.revert(ethers);
    });
  });

  describe("deposit and confirmDelivery", function () {
    it("Should emit Deposited when buyer deposits", async function () {
      await expect(escrow.connect(buyer).deposit({ value: AMOUNT }))
        .to.emit(escrow, "Deposited")
        .withArgs(await escrow.getAddress(), await buyer.getAddress(), AMOUNT);
    });

    it("Should release funds to seller after both confirm", async function () {
      const sellerBefore = await ethers.provider.getBalance(await seller.getAddress());
      await escrow.connect(buyer).deposit({ value: AMOUNT });
      await escrow.connect(buyer).confirmDelivery();
      const tx = await escrow.connect(seller).confirmDelivery();
      const receipt = await tx.wait();
      const gasSpent = receipt!.gasUsed * receipt!.gasPrice;
      const sellerAfter = await ethers.provider.getBalance(await seller.getAddress());
      expect(sellerAfter - sellerBefore).to.equal(AMOUNT - gasSpent);
      const details = await escrow.getDetails();
      expect(details[4]).to.equal(2); // Status.CONFIRMED enum value
    });

    it("Should emit Confirmed when both confirmed", async function () {
      await escrow.connect(buyer).deposit({ value: AMOUNT });
      await escrow.connect(buyer).confirmDelivery();
      await expect(escrow.connect(seller).confirmDelivery())
        .to.emit(escrow, "Confirmed")
        .withArgs(await escrow.getAddress(), await seller.getAddress(), AMOUNT);
    });
  });

  describe("refund", function () {
    it("Should refund buyer after deadline", async function () {
      await escrow.connect(buyer).deposit({ value: AMOUNT });
      const buyerBefore = await ethers.provider.getBalance(await buyer.getAddress());
      await ethers.provider.send("evm_increaseTime", [Number(DEADLINE_OFFSET) + 1]);
      await ethers.provider.send("evm_mine", []);
      const tx = await escrow.connect(buyer).refund();
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      const buyerAfter = await ethers.provider.getBalance(await buyer.getAddress());
      expect(buyerAfter - buyerBefore).to.equal(AMOUNT - gasUsed);
      const details = await escrow.getDetails();
      expect(details[4]).to.equal(3); // Status.REFUNDED
    });

    it("Should emit Refunded when refunded", async function () {
      await escrow.connect(buyer).deposit({ value: AMOUNT });
      await ethers.provider.send("evm_increaseTime", [Number(DEADLINE_OFFSET) + 1]);
      await ethers.provider.send("evm_mine", []);
      await expect(escrow.connect(buyer).refund())
        .to.emit(escrow, "Refunded")
        .withArgs(await escrow.getAddress(), await buyer.getAddress(), AMOUNT);
    });
  });

  describe("access control", function () {
    it("Should revert deposit when not buyer", async function () {
      await expect(
        escrow.connect(seller).deposit({ value: AMOUNT }),
      ).to.be.revertedWith("Only buyer can call this function");
    });

    it("Should revert refund when not buyer", async function () {
      await escrow.connect(buyer).deposit({ value: AMOUNT });
      await ethers.provider.send("evm_increaseTime", [Number(DEADLINE_OFFSET) + 1]);
      await ethers.provider.send("evm_mine", []);
      await expect(escrow.connect(seller).refund()).to.be.revertedWith(
        "Only buyer can call this function",
      );
    });
  });
});
