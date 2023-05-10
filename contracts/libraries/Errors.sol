// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

library Errors {
    error InvalidGovernanceAddress(address expectedGovernance, address governance);
    error InvalidTopic(bytes32 expectedTopic, bytes32 topic);
    error InvalidReceiptsRootMerkleProof();
    error InvalidRootHashMerkleProof();
    error InvalidHeaderBlock();
}
