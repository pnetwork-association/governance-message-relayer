// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {IGovernanceMessagePropagator} from "../interfaces/IGovernanceMessagePropagator.sol";
import {Errors} from "../libraries/Errors.sol";
import {IRegistrationManager} from "../interfaces/external/IRegistrationManager.sol";
import {ILendingManager} from "../interfaces/external/ILendingManager.sol";

contract GovernanceMessagePropagator is IGovernanceMessagePropagator {
    address public constant LENDING_MANAGER = 0xa65e64ae3A3Ae4A7Ea11D7C2596De779C34dD6af;
    address public constant REGISTRATION_MANAGER = 0xCcdbBC9Dea73673dF74E1EE4D5faC8c6Ce1930ef;

    function propagateSentinels(address[] calldata sentinels, uint16 epoch) external {
        uint32 totalBorrowedAmount = ILendingManager(LENDING_MANAGER).totalBorrowedAmountByEpoch(epoch);
        uint256 totalSentinelStakedAmount = IRegistrationManager(REGISTRATION_MANAGER).totalSentinelStakedAmountByEpoch(
            epoch
        );
        uint256 totalAmount = totalBorrowedAmount + totalSentinelStakedAmount;

        uint256 cumulativeAmount = 0;
        for (uint256 index; index < sentinels.length; ) {
            IRegistrationManager.Registration memory registration = IRegistrationManager(REGISTRATION_MANAGER)
                .sentinelRegistration(sentinels[index]);

            bytes1 registrationKind = registration.kind;
            if (registrationKind == 0x01) {
                cumulativeAmount += IRegistrationManager(REGISTRATION_MANAGER).sentinelStakedAmountByEpochOf(
                    sentinels[index],
                    epoch
                );
            } else if (registrationKind == 0x02) {
                cumulativeAmount += 200000; // NOTE: we use the truncated amount
            } else {
                revert Errors.InvalidSentinelRegistration(registrationKind);
            }

            unchecked {
                ++index;
            }
        }

        if (totalAmount != cumulativeAmount) {
            revert Errors.InvalidAmount(totalAmount, cumulativeAmount);
        }

        // TODO: calculate merkle tree root and emit GovernanceMessage()
    }
}
