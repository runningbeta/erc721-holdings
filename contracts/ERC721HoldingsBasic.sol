pragma solidity ^0.4.23;

/**
 * @title Holdings of ERC-721 Non-Fungible Token Standard, basic interface
 * @dev see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md
 */
contract ERC721HoldingsBasic {
  event Transfer(uint256 indexed _from, address _fromOrigin, uint256 indexed _to, address _toOrigin, uint256 _tokenId);
  // Operator approval events
  event Approval(address indexed _owner, address indexed _approved, uint256 _tokenId);
  event ApprovalForAll(address indexed _owner, address indexed _operator, bool _approved);
  // Holder approval events
  event HolderApproval(address indexed _owner, uint256 indexed _approvedHolder, address indexed _approvedHolderOrigin, uint256 _tokenId);
  event HolderTransferApproval(address indexed _owner, uint256 _tokenId, bool _approved);

  function tokenAddress() public view returns (address _tokenAddr);
  function tokenOwnerOf(uint256 _tokenId) public view returns (address _owner);

  function balanceOf(uint256 _holder, address _holderOrigin) public view returns (uint256 _balance);
  function holderOf(uint256 _tokenId) public view returns (uint256 _holder, address _holderOrigin);
  function ownerOf(uint256 _tokenId) public view returns (address _holderOwner);
  function exists(uint256 _tokenId) public view returns (bool _exists);

  // Operator approvals
  // Approve specific holdings for one transfer by an approved operator
  function approve(address _to, uint256 _tokenId) public;
  function getApproved(uint256 _tokenId) public view returns (address _operator);
  // Approve all holdings for many transfers by an approved operator
  function setApprovalForAll(address _operator, bool _approved) public;
  function isApprovedForAll(address _owner, address _operator) public view returns (bool);

  // Holder approvals
  // Approve specific holdings to be transfered once to a specific holder
  function approveHolder(uint256 _to, address _toOrigin, uint256 _tokenId) public;
  function getApprovedHolder(uint256 _tokenId) public view returns (uint256 _operator, address _operatorOrigin);

  function transferFrom(address _owner, uint256 _to, address _toOrigin, uint256 _tokenId) public;

}
