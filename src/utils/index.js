const { ethers } = require('hardhat')
const { RLP } = require('@ethereumjs/rlp')
const { toBuffer } = require('@ethereumjs/util')

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
  ROOT_CHAIN_CONTRACT_ABI
}
