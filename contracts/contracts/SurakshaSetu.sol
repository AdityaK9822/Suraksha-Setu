// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Suraksha Setu - document hash registry
/// @notice Stores SHA-3 hashes of non-government documents with admin verification.
contract SurakshaSetu {
    struct Record {
        bytes32 docHash;
        address uploader;
        address verifier;
        bool verified;
        uint256 timestamp;
    }

    mapping(bytes32 => Record) public records;
    address public admin;

    event DocumentRegistered(bytes32 indexed docHash, address indexed uploader);
    event DocumentVerified(bytes32 indexed docHash, address indexed verifier);

    constructor() {
        admin = msg.sender;
    }

    function register(bytes32 docHash) external {
        require(records[docHash].timestamp == 0, 'already registered');
        records[docHash] = Record({
            docHash: docHash,
            uploader: msg.sender,
            verifier: address(0),
            verified: false,
            timestamp: block.timestamp
        });
        emit DocumentRegistered(docHash, msg.sender);
    }

    function verify(bytes32 docHash) external {
        require(msg.sender == admin, 'not admin');
        Record storage r = records[docHash];
        require(r.timestamp != 0, 'not registered');
        require(!r.verified, 'already verified');
        r.verified = true;
        r.verifier = msg.sender;
        emit DocumentVerified(docHash, msg.sender);
    }
}