// SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

import {ITelepathyHandler} from "../interfaces/external/ITelepathyHandler.sol";

/**
 * @title IGovernanceMessageHandler
 * @author pNetwork
 *
 * @notice
 */

interface IGovernanceMessageHandler is ITelepathyHandler {
    event GovernanceMessageReceived(bytes data);
}
