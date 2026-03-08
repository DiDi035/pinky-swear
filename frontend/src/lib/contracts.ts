import EscrowAbi from "../../../contracts/deployments/abis/Escrow.json";
import EscrowFactoryAbi from "../../../contracts/deployments/abis/EscrowFactory.json";
import sepoliaDeployment from "../../../contracts/deployments/sepolia.json";

export const ESCROW_ABI = EscrowAbi;
export const ESCROW_FACTORY_ABI = EscrowFactoryAbi;

const activeFactory = sepoliaDeployment.factories.find((f) => f.active);
if (!activeFactory) throw new Error("No active factory in sepolia deployment");
export const FACTORY_ADDRESS = activeFactory.address as `0x${string}`;
