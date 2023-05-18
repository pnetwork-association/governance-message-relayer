pragma solidity 0.8.18;

interface ITelepathyHandler {
    function handleTelepathy(uint32 sourceChainId, address senderAddress, bytes memory data) external returns (bytes4);
}
