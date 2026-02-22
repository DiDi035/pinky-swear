import { network } from "hardhat";

const { ethers } = await network.connect();

const [owner, buyer, seller] = await ethers.getSigners();

const factory = await ethers.deployContract("EscrowFactory", [], owner);
await factory.waitForDeployment();

const factoryAddress = await factory.getAddress();

console.log(`
=== Deployed to local network ===

Factory:  ${factoryAddress}

Owner:    ${await owner.getAddress()}
Buyer:    ${await buyer.getAddress()}
Seller:   ${await seller.getAddress()}

=== Next steps ===

Open a console to interact:
  npx hardhat console --network hardhatMainnet

Then attach to the factory and create an escrow:
  const { ethers } = await network.connect();
  const factory = await ethers.getContractAt("EscrowFactory", "${factoryAddress}");
  const [owner, buyer, seller] = await ethers.getSigners();

  // Create an escrow (1 ETH, 1 hour deadline)
  const tx = await factory.createEscrow(
    await buyer.getAddress(),
    await seller.getAddress(),
    ethers.parseEther("1.0"),
    3600n,
  );
  const receipt = await tx.wait();
  const events = await factory.queryFilter(factory.filters.EscrowCreated(), receipt.blockNumber);
  const escrowAddress = events[0].args?.[0];
  console.log("Escrow created at:", escrowAddress);

  // Attach to the escrow
  const escrow = await ethers.getContractAt("Escrow", escrowAddress);

  // Deposit as buyer
  await escrow.connect(buyer).deposit({ value: ethers.parseEther("1.0") });

  // Confirm as both parties
  await escrow.connect(buyer).confirmDelivery();
  await escrow.connect(seller).confirmDelivery();

  // Refund as buyer - only after the deadline
  await escrow.connect(buyer).refund();

  // Check Buyer balance
  const buyerBalance = await ethers.provider.getBalance(await buyer.getAddress());
  console.log("Buyer balance:", ethers.formatEther(buyerBalance));

  // Check Seller balance
  const sellerBalance = await ethers.provider.getBalance(await seller.getAddress());
  console.log("Seller balance:", ethers.formatEther(sellerBalance));
`);
