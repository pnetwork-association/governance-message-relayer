// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {RLPReader} from "solidity-rlp/contracts/RLPReader.sol";
import {IGovernanceMessageVerifier} from "../interfaces/IGovernanceMessageVerifier.sol";
import {IRootChain} from "../interfaces/external/IRootChain.sol";
import {Errors} from "../libraries/Errors.sol";
import {Merkle} from "../libraries/Merkle.sol";
import {MerklePatriciaProof} from "../libraries/MerklePatriciaProof.sol";

contract GovernanceMessageVerifier is IGovernanceMessageVerifier {
    address public constant ROOT_CHAIN_ADDRESS = 0x86E4Dc95c7FBdBf52e33D563BbDB00823894C287;
    address public constant GOVERNANCE_ADDRESS = 0x445fB5227A63448672F19A172EFCB106C7c99EF9;
    bytes32 public constant EVENT_SIGNATURE_TOPIC = 0x85aab78efe4e39fd3b313a465f645990e6a1b923f5f5b979957c176e632c5a07; //keccak256(GovernanceMessage(bytes));

    function verifyMessage(GovernanceMessageProof calldata proof) external {
        // NOTE: handle legacy and eip2718
        RLPReader.RLPItem[] memory receiptData = RLPReader.toList(
            RLPReader.toRlpItem(proof.transactionType == 2 ? proof.receipt[1:] : proof.receipt)
        );
        RLPReader.RLPItem[] memory logs = RLPReader.toList(receiptData[3]);
        RLPReader.RLPItem[] memory log = RLPReader.toList(logs[proof.logIndex]);

        address proofGovernanceAddress = RLPReader.toAddress(log[0]);
        if (GOVERNANCE_ADDRESS != proofGovernanceAddress) {
            revert Errors.InvalidGovernanceAddress(GOVERNANCE_ADDRESS, proofGovernanceAddress);
        }

        RLPReader.RLPItem[] memory topics = RLPReader.toList(log[1]);
        bytes32 proofTopic = bytes32(RLPReader.toBytes(topics[0]));
        if (EVENT_SIGNATURE_TOPIC != proofTopic) {
            revert Errors.InvalidTopic(EVENT_SIGNATURE_TOPIC, proofTopic);
        }

        if (
            !MerklePatriciaProof.verify(
                proof.receipt,
                proof.receiptsRootProofPath,
                proof.receiptsRootProofParentNodes,
                proof.receiptsRoot
            )
        ) {
            revert Errors.InvalidReceiptsRootMerkleProof();
        }

        bytes32 blockHash = keccak256(
            abi.encodePacked(proof.blockNumber, proof.blockTimestamp, proof.transactionsRoot, proof.receiptsRoot)
        );

        (bytes32 rootHash, , , , ) = IRootChain(ROOT_CHAIN_ADDRESS).headerBlocks(proof.headerBlock);
        if (rootHash == bytes32(0)) {
            revert Errors.InvalidHeaderBlock();
        }

        if (!Merkle.checkMembership(blockHash, proof.rootHashProofIndex, rootHash, proof.rootHashProof)) {
            revert Errors.InvalidRootHashMerkleProof();
        }
        
        bytes memory data = RLPReader.toBytes(log[2]);
        emit GovernanceMessage(data);
    }
}
