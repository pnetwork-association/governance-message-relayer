require('dotenv').config()
const { ethers } = require('hardhat')
const MerkleTree = require('./utils/MerkleTree')
const { Trie } = require('@ethereumjs/trie')
const { RLP } = require('@ethereumjs/rlp')
const { bufferToHex } = require('@ethereumjs/util')
const { Mutex } = require('async-mutex')
const fs = require('fs')

const {
  getBytesBlockHash,
  getBytesEncodedReceipt,
  GOVERNANCE_VERIFIER_ABI,
  ROOT_CHAIN_CONTRACT_ABI
} = require('./utils')

const ROOT_CHAIN_CONTRACT_ADDRESS = '0x2890bA17EfE978480615e330ecB65333b880928e'
const GOVERNANCE_ADDRESS = '0x316ddf244aaf6695cc47f63ef68703564837d4d0'
const TOPIC = '0x85aab78efe4e39fd3b313a465f645990e6a1b923f5f5b979957c176e632c5a07' // keccak256(GovernanceMessage(bytes))
const GOVERNANCE_MESSAGE_VERIFIER_ADDRESS = '0x590AD5360A05298D40005517F31a985908E0Fe2b'
const GOVERNANCE_MESSAGE_HANDLER_ADDRESS = '0x76454A32C8F79F6dbb312b4233313Ab262384900'
const DESTINATION_CHAIN_ID = 56

const mutex = new Mutex()

const txHash = process.argv[2]

const start = async () => {
  const release = await mutex.acquire()
  //const polygonProvider = new ethers.providers.AlchemyProvider('matic', process.env.ALCHEMY_API_KEY_POLYGON)
  //const ethereumProvider = new ethers.providers.AlchemyProvider('mainnet', process.env.ALCHEMY_API_KEY_MAINNET)
  const polygonProvider = new ethers.providers.AlchemyProvider('maticmum', process.env.MUMBAI_ALCHEMY_APY_KEY)
  const ethereumProvider = new ethers.providers.JsonRpcProvider('https://ethereum-goerli.publicnode.com')

  const signer = new ethers.Wallet(process.env.PK, ethereumProvider)

  const rootChainContract = new ethers.Contract(ROOT_CHAIN_CONTRACT_ADDRESS, ROOT_CHAIN_CONTRACT_ABI, ethereumProvider)
  const governanceMessageVerifier = new ethers.Contract(
    GOVERNANCE_MESSAGE_VERIFIER_ADDRESS,
    GOVERNANCE_VERIFIER_ABI,
    signer
  )

  try {
    // check if in the corresponding tx there is an event that we want to verify on Ethereum
    console.log(`Checking if ${txHash} exists ...`)
    const transaction = await polygonProvider.getTransactionReceipt(txHash)
    if (!transaction) {
      console.log('Transaction not found. Closing ...')
      return
    }

    const { transactionIndex: expectedTransactionIndex, logs, blockNumber: blockNumberWhereEventHappened } = transaction
    if (
      !Boolean(
        logs.find(
          ({ address, topics }) => address.toLowerCase() === GOVERNANCE_ADDRESS.toLowerCase() && topics[0] === TOPIC
        )
      )
    ) {
      console.log('Event not present within the transaction. Closing ...')
      release()
      return
    }

    const currentHeaderBlock = 870680000 //(await rootChainContract.currentHeaderBlock()).toNumber()
    const { start, end } = await rootChainContract.headerBlocks(currentHeaderBlock)
    if (blockNumberWhereEventHappened > end.toNumber()) {
      console.log('Checkpoint not submitted yet. Closing ...')
      release()
      return
    }

    // build the merkle tree to generate the root hash proof to verify the event inclusion
    console.log('Fetching blocks ...')
    //const blocks = require('./blocks.json')
    let blocks = []
    // NOTE: Promise.all causes in many cases a timeout error
    for (let blockNumber = start.toNumber(); blockNumber <= end.toNumber(); blockNumber++) {
      blocks.push(
        await polygonProvider.send('eth_getBlockByNumber', [ethers.BigNumber.from(blockNumber).toHexString(), false])
      )
    }
    fs.writeFileSync('blocks.json', JSON.stringify(blocks))

    const block = blocks.find(
      ({ number }) => ethers.BigNumber.from(number).toNumber() === blockNumberWhereEventHappened
    )
    const leaves = blocks.map((_block) => getBytesBlockHash(_block))

    const blockHashTree = new MerkleTree(leaves)
    const { leaf, index } = leaves
      .map((_leaf, _index) => ({
        leaf: _leaf,
        index: _index
      }))
      .find(({ index }) => ethers.BigNumber.from(blocks[index].number).toNumber() === blockNumberWhereEventHappened)

    // build the receipts patricia tree in order to generate the proof to verify the log inclusion
    const { transactions, receiptsRoot } = blocks.find(
      ({ number }) => ethers.BigNumber.from(number).toNumber() === blockNumberWhereEventHappened
    )

    console.log('Fetching transaction receipts ...')
    //const receipts = require('./receipts.json')
    const receipts = []
    // NOTE: Promise.all causes in many cases a timeout error
    for (const transaction of transactions) {
      const receipt = await polygonProvider.getTransactionReceipt(transaction)
      receipts.push({
        ...receipt,
        cumulativeGasUsed: receipt.cumulativeGasUsed.toHexString(),
        effectiveGasPrice: receipt.effectiveGasPrice.toHexString(),
        gasUsed: receipt.gasUsed.toHexString()
      })
    }
    fs.writeFileSync('receipts.json', JSON.stringify(receipts))

    const receipt = receipts.find(({ transactionIndex }) => transactionIndex === expectedTransactionIndex)
    const logIndex = receipt.logs.findIndex(
      ({ address, topics }) => address.toLowerCase() === GOVERNANCE_ADDRESS.toLowerCase() && topics[0] === TOPIC
    )

    const encodedReceipts = receipts.map((_receipt) => getBytesEncodedReceipt(_receipt))
    const rlpEncodedKeys = receipts.map(({ transactionIndex }) => RLP.encode(transactionIndex))
    const receiptsRootTree = new Trie()
    await Promise.all(encodedReceipts.map((_receipt, _index) => receiptsRootTree.put(rlpEncodedKeys[_index], _receipt)))

    const key = rlpEncodedKeys[expectedTransactionIndex]
    const receiptsRootPath = await receiptsRootTree.findPath(key, true)
    const receiptsRootProof = {
      parentNodes: receiptsRootPath.stack.map((_el) => _el.raw()),
      path: key
    }

    const proof = [
      '0x' + Buffer.concat(blockHashTree.getProof(leaf)).toString('hex'),
      index,
      receiptsRoot,
      block.number,
      block.timestamp,
      block.transactionsRoot,
      bufferToHex(Buffer.concat([Buffer.from('00', 'hex'), receiptsRootProof.path])),
      bufferToHex(RLP.encode(receiptsRootProof.parentNodes)),
      '0x' + encodedReceipts[expectedTransactionIndex].toString('hex'),
      logIndex,
      receipt.type,
      currentHeaderBlock
    ]

    console.log('Veriying and propagating message ...')
    console.log(proof)
    const tx = await governanceMessageVerifier.verifyAndPropagateMessage(
      proof,
      [DESTINATION_CHAIN_ID],
      [GOVERNANCE_MESSAGE_HANDLER_ADDRESS],
      {
        gasPrice: 80e9,
        gasLimit: 250000
      }
    )
    console.log('Transaction hash', tx.hash)
  } catch (_err) {
    console.error(_err)
  } finally {
    release()
  }
}

start()
