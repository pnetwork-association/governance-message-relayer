// SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

/**
 * @title IPFactory
 * @author pNetwork
 *
 * @notice
 */

interface IGovernanceMessageVerifier {
    struct GovernanceMessageProof {
        bytes rootHashProof;
        uint256 rootHashProofIndex;
        bytes32 receiptsRoot;
        uint256 blockNumber;
        uint256 blockTimestamp;
        bytes32 transactionsRoot;
        bytes receiptsRootProofPath;
        bytes receiptsRootProofParentNodes;
        bytes receipt;
        uint256 logIndex;
        uint8 transactionType;
        uint256 headerBlock;
    }

    event GovernanceMessage(bytes value);

    function verifyMessage(GovernanceMessageProof calldata proof) external;
}
