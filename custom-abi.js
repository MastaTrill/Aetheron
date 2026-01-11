// Custom ABI for contract at address 0xab5ae0d8f569d7c2b27574319b864a5ba6f9671e
// Replace this with the actual ABI from PolygonScan or your contract

const customABI = [
  // Add your contract's ABI here
  // Example for ERC20:
  {
    'inputs': [],
    'name': 'name',
    'outputs': [{'internalType': 'string', 'name': '', 'type': 'string'}],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'symbol',
    'outputs': [{'internalType': 'string', 'name': '', 'type': 'string'}],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'totalSupply',
    'outputs': [{'internalType': 'uint256', 'name': '', 'type': 'uint256'}],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [{'internalType': 'address', 'name': 'account', 'type': 'address'}],
    'name': 'balanceOf',
    'outputs': [{'internalType': 'uint256', 'name': '', 'type': 'uint256'}],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {'internalType': 'address', 'name': 'recipient', 'type': 'address'},
      {'internalType': 'uint256', 'name': 'amount', 'type': 'uint256'}
    ],
    'name': 'transfer',
    'outputs': [{'internalType': 'bool', 'name': '', 'type': 'bool'}],
    'stateMutability': 'nonpayable',
    'type': 'function'
  }
];

module.exports = customABI;
