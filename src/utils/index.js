const { ethers } = require('hardhat')
const { RLP } = require('@ethereumjs/rlp')
const { toBuffer } = require('@ethereumjs/util')

const GOVERNANCE_VERIFIER_ABI = require('./abi/GovernanceVerifier.json')
const ROOT_CHAIN_CONTRACT_ABI = require('./abi/RootChain.json')
const REGISTRATION_MANAGER_ABI = require('./abi/RegistrationManager.json')

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
    return Buffer.from(RLP.encode([_receipt.status, _receipt.cumulativeGasUsed, _receipt.logsBloom, logs]))
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
  REGISTRATION_MANAGER_ABI,
  ROOT_CHAIN_CONTRACT_ABI
}
