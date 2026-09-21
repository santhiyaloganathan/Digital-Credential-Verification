// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title Certificate Registry - Blockchain based certificate verification
/// @notice Idhu oru simple contract - certificate ID + hash store pannum,
///         yaaraachum verify panna mudiyum aana issuer mattum thaan new cert add pannanum.
contract CertificateRegistry {
    address public owner;

    struct Certificate {
        string certId;
        bytes32 certHash;   // certificate file oda SHA256 hash
        uint256 issuedAt;
        bool exists;
    }

    // certId => Certificate details
    mapping(string => Certificate) private certificates;

    event CertificateIssued(string certId, bytes32 certHash, uint256 issuedAt);
    event CertificateRevoked(string certId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only issuer can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender; // deploy panra address thaan issuer (college/institution)
    }

    /// @notice Puthu certificate blockchain la add pannuvom
    function issueCertificate(string memory certId, bytes32 certHash) public onlyOwner {
        require(!certificates[certId].exists, "Certificate already exists");
        certificates[certId] = Certificate(certId, certHash, block.timestamp, true);
        emit CertificateIssued(certId, certHash, block.timestamp);
    }

    /// @notice QR scan pannina apparam idhu call aagum - hash match aaguthaa nu check pannum
    function verifyCertificate(string memory certId, bytes32 certHash) public view returns (bool) {
        Certificate memory c = certificates[certId];
        if (!c.exists) return false;
        return c.certHash == certHash;
    }

    /// @notice certificate details fetch panna
    function getCertificate(string memory certId)
        public
        view
        returns (bytes32 certHash, uint256 issuedAt, bool exists)
    {
        Certificate memory c = certificates[certId];
        return (c.certHash, c.issuedAt, c.exists);
    }

    /// @notice edhaavadhu certificate fake nu therinja revoke pannalam
    function revokeCertificate(string memory certId) public onlyOwner {
        require(certificates[certId].exists, "Certificate does not exist");
        delete certificates[certId];
        emit CertificateRevoked(certId);
    }
}
