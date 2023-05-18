const { ethers } = require('hardhat')
const { RLP } = require('@ethereumjs/rlp')
const { toBuffer } = require('@ethereumjs/util')

const GOVERNANCE_VERIFIER_ABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'expectedGovernance',
        type: 'address'
      },
      {
        internalType: 'address',
        name: 'governance',
        type: 'address'
      }
    ],
    name: 'InvalidGovernanceAddress',
    type: 'error'
  },
  {
    inputs: [],
    name: 'InvalidHeaderBlock',
    type: 'error'
  },
  {
    inputs: [],
    name: 'InvalidReceiptsRootMerkleProof',
    type: 'error'
  },
  {
    inputs: [],
    name: 'InvalidRootHashMerkleProof',
    type: 'error'
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'expectedTopic',
        type: 'bytes32'
      },
      {
        internalType: 'bytes32',
        name: 'topic',
        type: 'bytes32'
      }
    ],
    name: 'InvalidTopic',
    type: 'error'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'bytes',
        name: 'data',
        type: 'bytes'
      }
    ],
    name: 'GovernanceMessagePropagated',
    type: 'event'
  },
  {
    inputs: [],
    name: 'EVENT_SIGNATURE_TOPIC',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'GOVERNANCE_ADDRESS',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'ROOT_CHAIN_ADDRESS',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'TELEPATHY_ROUTER',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'bytes',
            name: 'rootHashProof',
            type: 'bytes'
          },
          {
            internalType: 'uint256',
            name: 'rootHashProofIndex',
            type: 'uint256'
          },
          {
            internalType: 'bytes32',
            name: 'receiptsRoot',
            type: 'bytes32'
          },
          {
            internalType: 'uint256',
            name: 'blockNumber',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'blockTimestamp',
            type: 'uint256'
          },
          {
            internalType: 'bytes32',
            name: 'transactionsRoot',
            type: 'bytes32'
          },
          {
            internalType: 'bytes',
            name: 'receiptsRootProofPath',
            type: 'bytes'
          },
          {
            internalType: 'bytes',
            name: 'receiptsRootProofParentNodes',
            type: 'bytes'
          },
          {
            internalType: 'bytes',
            name: 'receipt',
            type: 'bytes'
          },
          {
            internalType: 'uint256',
            name: 'logIndex',
            type: 'uint256'
          },
          {
            internalType: 'uint8',
            name: 'transactionType',
            type: 'uint8'
          },
          {
            internalType: 'uint256',
            name: 'headerBlock',
            type: 'uint256'
          }
        ],
        internalType: 'struct IGovernanceMessageVerifier.GovernanceMessageProof',
        name: 'proof',
        type: 'tuple'
      },
      {
        internalType: 'uint32[]',
        name: 'chainIds',
        type: 'uint32[]'
      },
      {
        internalType: 'address[]',
        name: 'destinationAddresses',
        type: 'address[]'
      }
    ],
    name: 'verifyAndPropagateMessage',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
]

const ROOT_CHAIN_CONTRACT_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'currentHeaderBlock',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    name: 'headerBlocks',
    outputs: [
      {
        internalType: 'bytes32',
        name: 'root',
        type: 'bytes32'
      },
      {
        internalType: 'uint256',
        name: 'start',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'end',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'createdAt',
        type: 'uint256'
      },
      {
        internalType: 'address',
        name: 'proposer',
        type: 'address'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
]

const getBytesBlockHash = ({ number, timestamp, transactionsRoot, receiptsRoot }) => {
  const coder = new ethers.utils.AbiCoder()
  const data = coder.encode(
    ['uint256', 'uint64', 'bytes32', 'bytes32'],
    [number, timestamp, transactionsRoot, receiptsRoot]
  )
  return Buffer.from(ethers.utils.keccak256(data).slice(2), 'hex')
}

const getBytesEncodedReceipt = (_receipt) => {
  const logs = _receipt.logs.map((_log) => {
    return [_log.address, _log.topics.map((_topic) => _topic), _log.data]
  })

  if (_receipt.type === 0) {
    return RLP.encode([_receipt.status, _receipt.cumulativeGasUsed, _receipt.logsBloom, logs])
  }

  return Buffer.concat([
    toBuffer(_receipt.type),
    RLP.encode([_receipt.status, _receipt.cumulativeGasUsed, _receipt.logsBloom, logs])
  ])
}

module.exports = {
  getBytesBlockHash,
  getBytesEncodedReceipt,
  GOVERNANCE_VERIFIER_ABI,
  ROOT_CHAIN_CONTRACT_ABI
}
