// Workaround: @nomicfoundation/hardhat-toolbox-mocha-ethers (v3.0.2) has type
// declarations in dist/src/index.d.ts, but its package.json sets "types": ""
// (empty string) and lacks a "types" condition in the exports field. This
// prevents TypeScript's Node16 module resolution from finding the types.
// This ambient module declaration provides the missing type information.
//
// References:
// - package.json with "types": "": https://github.com/NomicFoundation/hardhat/blob/main/v-next/hardhat-toolbox-mocha-ethers/package.json
// - Actual type declarations: https://github.com/NomicFoundation/hardhat/blob/main/v-next/hardhat-toolbox-mocha-ethers/src/index.ts
// - Compare with hardhat core which sets types correctly: https://github.com/NomicFoundation/hardhat/blob/main/v-next/hardhat/package.json
declare module "@nomicfoundation/hardhat-toolbox-mocha-ethers" {
  import type { HardhatPlugin } from "hardhat/types/plugins";
  const plugin: HardhatPlugin;
  export default plugin;
}
