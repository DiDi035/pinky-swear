export const ESCROW_ABI = [
  {
    inputs: [],
    name: 'deposit',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'confirmDelivery',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'refund',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getDetails',
    outputs: [
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'uint256', name: '', type: 'uint256' },
      { internalType: 'uint256', name: '', type: 'uint256' },
      { internalType: 'enum Escrow.Status', name: '', type: 'uint8' },
      { internalType: 'bool', name: '', type: 'bool' },
      { internalType: 'bool', name: '', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export const ESCROW_FACTORY_ABI = [
  {
    inputs: [
      { internalType: 'address', name: '_buyer', type: 'address' },
      { internalType: 'address', name: '_seller', type: 'address' },
      { internalType: 'uint256', name: '_amount', type: 'uint256' },
      { internalType: 'uint256', name: '_deadline', type: 'uint256' },
    ],
    name: 'createEscrow',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// Active factory address from contracts/deployments/sepolia.json
export const FACTORY_ADDRESS = '0x242CEd94844e1C89F6022dE5a7b1a357859513A8' as const
