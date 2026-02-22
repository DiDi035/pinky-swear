import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

 const EscrowFactoryModule = buildModule("EscrowFactoryModule", (m) => {
   const escrowFactory = m.contract("EscrowFactory", []);
   return { escrowFactory };
 });

 export default EscrowFactoryModule;
