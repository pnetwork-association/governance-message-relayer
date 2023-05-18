// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {IGovernanceMessageHandler} from "../interfaces/IGovernanceMessageHandler.sol";
import {ITelepathyHandler} from "../interfaces/external/ITelepathyHandler.sol";
import {Errors} from "../libraries/Errors.sol";

contract GovernanceMessageHandler is IGovernanceMessageHandler {
    address public constant TELEPATHY_ROUTER = 0x41EA857C32c8Cb42EEFa00AF67862eCFf4eB795a;

    address public governanceMessageVerifier;
    uint32 public sourceChainId;

    constructor(address governanceMessageVerifier_, uint32 sourceChainId_) {
        governanceMessageVerifier = governanceMessageVerifier_;
        sourceChainId = sourceChainId_;
    }

    function handleTelepathy(
        uint32 sourceChainId_,
        address senderAddress,
        bytes memory data
    ) external returns (bytes4) {
        if (msg.sender != TELEPATHY_ROUTER) revert Errors.NotRouter(msg.sender, TELEPATHY_ROUTER);
        if (sourceChainId != sourceChainId_) revert Errors.InvalidSourceChainId(sourceChainId_, sourceChainId);
        if (senderAddress != governanceMessageVerifier)
        revert Errors.NotGovernanceMessageVerifier(senderAddress, governanceMessageVerifier);

        emit GovernanceMessageReceived(data);

        return ITelepathyHandler.handleTelepathy.selector;
    }
}
