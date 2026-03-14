// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DocProof {
    struct Proof {
        address owner;
        uint256 timestamp;
    }

    mapping(bytes32 => Proof) public proofs;

    event ProofStored(bytes32 indexed hash, address indexed owner, uint256 timestamp);

    function storeHash(bytes32 hash) external {
        Proof storage existing = proofs[hash];
        require(existing.owner == address(0), "Document already registered");

        proofs[hash] = Proof({
            owner: msg.sender,
            timestamp: block.timestamp
        });

        emit ProofStored(hash, msg.sender, block.timestamp);
    }

    function verifyHash(bytes32 hash) external view returns (bool exists, address owner, uint256 timestamp) {
        Proof storage proof = proofs[hash];
        if (proof.owner == address(0)) {
            return (false, address(0), 0);
        }
        return (true, proof.owner, proof.timestamp);
    }
}
