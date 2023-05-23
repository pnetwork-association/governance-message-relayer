// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

library Errors {
    error InvalidGovernanceMessagePropagator(
        address expectedGovernanceMessagePropagator,
        address governanceMessagePropagator
    );
    error InvalidTopic(bytes32 expectedTopic, bytes32 topic);
    error InvalidReceiptsRootMerkleProof();
    error InvalidRootHashMerkleProof();
    error InvalidHeaderBlock();
    error InvalidSourceChainId(uint32 chainId, uint32 expectedChainId);
    error NotRouter(address sender, address router);
    error NotGovernanceMessageVerifier(address sender, address governanceMessageVerifier);
    error InvalidAmount(uint256 amount, uint256 expectedAmount);
    error InvalidSentinelRegistration(bytes1 kind);
}
