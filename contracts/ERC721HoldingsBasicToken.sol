pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/AddressUtils.sol";
import "openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";
import "./ERC721HoldingsBasic.sol";


/**
 * @title Holdings of ERC-721 Non-Fungible Token Standard, basic implementation
 * @dev see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md
 */
contract ERC721HoldingsBasicToken is ERC721HoldingsBasic {
  using SafeMath for uint256;
  using AddressUtils for address;

  ERC721 public tokens;

  struct Holder {
    uint256 id;
    address origin;
  }

  // Mapping from token ID to Holder
  mapping (uint256 => Holder) internal tokenHolder;

  // Mapping from token ID to approved Holder
  mapping (uint256 => Holder) internal tokenHolderApprovals;

  // Mapping from token ID to approved address
  mapping (uint256 => address) internal tokenApprovals;

  // Mapping from holder to number of held token
  mapping (address => mapping (uint256 => uint256)) internal heldTokensCount;

  // Mapping from owner to operator approvals
  mapping (address => mapping (address => bool)) internal operatorApprovals;

  /**
   * @dev Guarantees msg.sender is owner of the given token
   * @param _tokenId uint256 ID of the token to validate its ownership belongs to msg.sender
   */
  modifier onlyTokenOwnerOf(uint256 _tokenId) {
    require(tokenOwnerOf(_tokenId) == msg.sender);
    _;
  }

  /**
   * @dev Guarantees msg.sender is holder owner of the given token
   * @param _tokenId uint256 ID of the token to validate its ownership belongs to msg.sender
   */
  modifier onlyOwnerOf(uint256 _tokenId) {
    require(ownerOf(_tokenId) == msg.sender);
    _;
  }

  /**
   * @dev Guarantees that the holder token exists
   * @param _holder ID to query the existance of
   * @param _holderOrigin address of the holder's origin
   */
  modifier onlyIfExists(uint256 _holder, address _holderOrigin) {
    require(_ownerOf(_holder, _holderOrigin) != address(0));
    _;
  }

  /**
   * @dev Checks msg.sender can transfer a token
   * @dev Token should exist and msg.sender is an owner, approved, or operator
   * @param _to uint256 ID of the holder to receive the token ID
   * @param _toOrigin address of the holder's origin
   * @param _tokenId uint256 ID of the token to validate
   */
  modifier canTransfer(uint256 _to, address _toOrigin, uint256 _tokenId) {
    require(exists(_tokenId));
    require(isApprovedOrOwner(msg.sender, _tokenId) || isHolderApprovedFor(msg.sender, _to, _toOrigin, _tokenId));
    _;
  }

  /**
   * @dev Constructor to create the ERC721HoldingsBasicToken contract
   * @param _nftAddress The ERC721 contract address of the tokens that will be held
   */
  constructor(address _nftAddress) public {
    require(_nftAddress != address(0));
    tokens = ERC721(_nftAddress);
  }

  /**
   * @dev Gets the origin contract of tokens stored by the contract
   * @return address representing the origin tokens contract
   */
  function tokenAddress() public view returns (address) {
    return address(tokens);
  }

  /**
   * @dev Gets the owner of the specified token ID
   * @param _tokenId uint256 ID of the token to query the owner of
   * @return owner address currently marked as the owner of the given token ID
   */
  function tokenOwnerOf(uint256 _tokenId) public view returns (address) {
    return tokens.ownerOf(_tokenId);
  }

  /**
   * @dev Gets the owner of holder for the specified token ID
   * @param _tokenId uint256 ID of the token to query the owner of
   * @return owner address currently marked as the owner of the holder at origin
   */
  function ownerOf(uint256 _tokenId) public view returns (address) {
    Holder memory holder = tokenHolder[_tokenId];
    return _ownerOf(holder.id, holder.origin);
  }

  /**
   * @dev Gets the balance of the specified holder
   * @param _holder ID to query the balance of
   * @param _holderOrigin address of the holder's origin
   * @return uint256 representing the amount held by the given holder
   */
  function balanceOf(uint256 _holder, address _holderOrigin) public view returns (uint256) {
    require(_holderOrigin != address(0));
    return heldTokensCount[_holderOrigin][_holder];
  }

  /**
   * @dev Gets the holder of the specified token ID
   * @param _tokenId uint256 ID of the token to query the holder of
   * @return holder ID currently marked as the holder of the given token ID
   * @return holder's origin contract address
   */
  function holderOf(uint256 _tokenId) public view returns (uint256, address) {
    Holder memory holder = tokenHolder[_tokenId];
    require(holder.origin != address(0));
    return (holder.id, holder.origin);
  }

  /**
   * @dev Returns whether the specified token exists
   * @param _tokenId uint256 ID of the token to query the existance of
   * @return whether the token exists
   */
  function exists(uint256 _tokenId) public view returns (bool) {
    return tokenHolder[_tokenId].origin != address(0);
  }

  /**
   * @dev Approves another address to transfer the given token ID
   * @dev The zero address indicates there is no approved address.
   * @dev There can only be one approved address per token at a given time.
   * @dev Can only be called by the token owner or an approved operator.
   * @param _to address to be approved for the given token ID
   * @param _tokenId uint256 ID of the token to be approved
   */
  function approve(address _to, uint256 _tokenId) public {
    address owner = ownerOf(_tokenId);
    require(_to != owner);
    require(msg.sender == owner || isApprovedForAll(owner, msg.sender));

    if (getApproved(_tokenId) != address(0) || _to != address(0)) {
      tokenApprovals[_tokenId] = _to;
      emit Approval(owner, _to, _tokenId);
    }
  }

  /**
   * @dev Gets the approved address for a token ID, or zero if no address set
   * @param _tokenId uint256 ID of the token to query the approval of
   * @return address currently approved for a the given token ID
   */
  function getApproved(uint256 _tokenId) public view returns (address) {
    return tokenApprovals[_tokenId];
  }

  /**
   * @dev Sets or unsets the approval of a given operator
   * @dev An operator is allowed to transfer all tokens of the sender on their behalf
   * @param _to operator address to set the approval
   * @param _approved representing the status of the approval to be set
   */
  function setApprovalForAll(address _to, bool _approved) public {
    require(_to != msg.sender);
    operatorApprovals[msg.sender][_to] = _approved;
    emit ApprovalForAll(msg.sender, _to, _approved);
  }

  /**
   * @dev Tells whether an operator is approved by a given owner
   * @param _owner owner address which you want to query the approval of
   * @param _operator operator address which you want to query the approval of
   * @return bool whether the given operator is approved by the given owner
   */
  function isApprovedForAll(address _owner, address _operator) public view returns (bool) {
    return operatorApprovals[_owner][_operator];
  }

  /**
   * @dev Approve specific holdings to be transfered once to a specific holder
   * @param _to uint256 ID of the holder to be approved for the given token ID
   * @param _toOrigin address of the holder's origin
   * @param _tokenId uint256 ID of the token to be approved
   */
  function approveHolder(uint256 _to, address _toOrigin, uint256 _tokenId) public {
    require(_toOrigin != address(0) || _to == 0);
    require(_to != tokenHolder[_tokenId].id || _toOrigin != tokenHolder[_tokenId].origin);

    address owner = ownerOf(_tokenId);
    require(msg.sender == owner || isApprovedForAll(owner, msg.sender));

    if (tokenHolderApprovals[_tokenId].origin != address(0) || _toOrigin != address(0)) {
      tokenHolderApprovals[_tokenId] = Holder(_to, _toOrigin);
      emit HolderApproval(owner, _to, _toOrigin, _tokenId);
    }
  }

  /**
   * @dev Gets the approved holder for a token ID, or zero if no approved holder is set
   * @param _tokenId uint256 ID of the token to query the approval of
   * @return uint256 token ID of the holder
   * @return address holder origin
   */
  function getApprovedHolder(uint256 _tokenId) public view returns (uint256, address) {
    Holder memory approved = tokenHolderApprovals[_tokenId];
    return (approved.id, approved.origin);
  }

  /**
   * @dev Transfers the ownership of a given token ID to another address
   * @dev Requires the msg sender to be the owner, approved, or operator
   * @param _owner current owner of the token
   * @param _to address to receive the ownership of the given token ID
   * @param _tokenId uint256 ID of the token to be transferred
   */
  function transferFrom(address _owner, uint256 _to, address _toOrigin, uint256 _tokenId)
    public
    onlyIfExists(_to, _toOrigin)
    canTransfer(_to, _toOrigin, _tokenId)
  {
    require(_owner != address(0));
    clearApproval(_owner, _tokenId);
    Holder memory from = tokenHolder[_tokenId];
    removeTokenFrom(from.id, from.origin, _tokenId);
    addTokenTo(_to, _toOrigin, _tokenId);
    emit Transfer(from.id, from.origin, _to, _toOrigin, _tokenId);
  }

  /**
   * @dev Returns whether the given spender can transfer a given token ID
   * @param _spender address of the spender to query
   * @param _tokenId uint256 ID of the token to be transferred
   * @return bool whether the msg.sender is approved for the given token ID,
   *  is an operator of the owner, or is the owner of the token
   */
  function isApprovedOrOwner(address _spender, uint256 _tokenId) internal view returns (bool) {
    return getApproved(_tokenId) == _spender || isOwnerOrApprovedForAll(_spender, _tokenId);
  }

  /**
   * @dev Returns whether the given spender can transfer a given token ID
   * @param _spender address of the spender to query
   * @param _tokenId uint256 ID of the token to be transferred
   * @return bool whether the msg.sender is an operator of the owner, or is the owner of the token
   */
  function isOwnerOrApprovedForAll(address _spender, uint256 _tokenId) internal view returns (bool) {
    address owner = ownerOf(_tokenId);
    return _spender == owner || isApprovedForAll(owner, _spender);
  }

  /**
   * @dev Returns whether the given spender can transfer a given token ID to holder
   * @param _spender address of the spender to query
   * @param _to uint256 ID of the holder to receive the token ID
   * @param _toOrigin address of the holder's origin
   * @param _tokenId uint256 ID of the token to be transferred
   * @return bool whether the msg.sender is approved for the given token ID,
   *  is an operator of the owner, or is the owner of the token
   */
  function isHolderApprovedFor(address _spender,  uint256 _to, address _toOrigin, uint256 _tokenId)
    internal
    view
    returns (bool)
  {
    // Is transfer to holder approved and holder owner is _spender
    Holder memory approved = tokenHolderApprovals[_tokenId];
    return approved.id == _to && approved.origin == _toOrigin && _ownerOf(_to, _toOrigin) == _spender;
  }

  /**
   * @dev Internal function to mint a new token
   * @dev Reverts if the given token ID already exists
   * @param _to The holder ID that will hold the minted token
   * @param _toOrigin address of the holder's origin
   * @param _tokenId uint256 ID of the token to be minted by the msg.sender
   */
  function _mint(uint256 _to, address _toOrigin, uint256 _tokenId) internal onlyIfExists(_to, _toOrigin) {
    addTokenTo(_to, _toOrigin, _tokenId);
    emit Transfer(0, address(0), _to, _toOrigin, _tokenId);
  }

  /**
   * @dev Internal function to burn a specific token
   * @dev Reverts if the token does not exist
   * @param _owner owner of the token
   * @param _tokenId uint256 ID of the token being burned by the msg.sender
   */
  function _burn(address _owner, uint256 _tokenId) internal {
    clearApproval(_owner, _tokenId);
    Holder memory holder = tokenHolder[_tokenId];
    removeTokenFrom(holder.id, holder.origin, _tokenId);
    emit Transfer(holder.id, holder.origin, 0, address(0), _tokenId);
  }

  /**
   * @dev Internal function to clear current approval of a given token ID
   * @dev Reverts if the given address is not indeed the owner of the token
   * @param _owner owner of the token
   * @param _tokenId uint256 ID of the token to be transferred
   */
  function clearApproval(address _owner, uint256 _tokenId) internal {
    require(ownerOf(_tokenId) == _owner);
    if (tokenApprovals[_tokenId] != address(0)) {
      tokenApprovals[_tokenId] = address(0);
      emit Approval(_owner, address(0), _tokenId);
    }

    if (tokenHolderApprovals[_tokenId].origin != address(0)) {
      tokenHolderApprovals[_tokenId] = Holder(0, address(0));
      emit HolderApproval(_owner, 0, address(0), _tokenId);
    }
  }

  /**
   * @dev Internal function to add a token ID to the list of a given holder
   * @param _to uint256 ID representing the new holder of the given token ID
   * @param _toOrigin address of the new holder's origin
   * @param _tokenId uint256 ID of the token to be added to the tokens list of the given holder ID
   */
  function addTokenTo(uint256 _to, address _toOrigin, uint256 _tokenId) internal {
    require(tokenHolder[_tokenId].origin == address(0));
    tokenHolder[_tokenId] = Holder(_to, _toOrigin);
    heldTokensCount[_toOrigin][_to] = heldTokensCount[_toOrigin][_to].add(1);
  }

  /**
   * @dev Internal function to remove a token ID from the list of a given holder ID
   * @param _from uint256 ID representing the previous holder of the given token ID
   * @param _fromOrigin address of the previous holder's origin
   * @param _tokenId uint256 ID of the token to be removed from the tokens list of the given holder ID
   */
  function removeTokenFrom(uint256 _from, address _fromOrigin, uint256 _tokenId) internal {
    require(tokenHolder[_tokenId].origin != address(0));
    require(tokenHolder[_tokenId].id == _from && tokenHolder[_tokenId].origin == _fromOrigin);
    heldTokensCount[_fromOrigin][_from] = heldTokensCount[_fromOrigin][_from].sub(1);
    tokenHolder[_tokenId] = Holder(0, address(0));
  }

  /**
   * @dev Gets the owner of token with ID at sepcific origin
   * @param _id ID to query the existance of
   * @param _origin address of the holder's origin
   * @return owner address currently marked as the owner
   */
  function _ownerOf(uint256 _id, address _origin) internal view returns (address) {
    require(_origin != address(0));
    return ERC721(_origin).ownerOf(_id);
  }

}
