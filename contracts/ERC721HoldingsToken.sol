pragma solidity ^0.4.23;

import "./ERC721Holdings.sol";
import "./ERC721HoldingsBasicToken.sol";
import "./ERC721HoldingsExecuteCallsToken.sol";


/**
 * @title Full ERC721Holdings Token
 * This implementation includes all the required and some optional functionality of the ERC721Holdings standard
 * @dev see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md
 */
contract ERC721HoldingsToken is ERC721Holdings, ERC721HoldingsBasicToken, ERC721HoldingsExecuteCallsToken {
  // Token name
  string internal name_;

  // Token symbol
  string internal symbol_;

  // Mapping from holder to list of held token IDs
  mapping (address => mapping (uint256 => uint256[])) internal heldTokens;

  // Mapping from token ID to index of the holder tokens list
  mapping (uint256 => uint256) internal heldTokensIndex;

  // Array with all token ids, used for enumeration
  uint256[] internal allTokens;

  // Mapping from token id to position in the allTokens array
  mapping(uint256 => uint256) internal allTokensIndex;

  // Optional mapping for token URIs
  mapping(uint256 => string) internal tokenURIs;

  /**
   * @dev Constructor function
   * @param _nftAddress The ERC721 contract address of the tokens that will be held
   */
  constructor(string _name, string _symbol, address _nftAddress)
    ERC721HoldingsBasicToken(_nftAddress)
    public
  {
    name_ = _name;
    symbol_ = _symbol;
  }

  /**
   * @dev Gets the token name
   * @return string representing the token name
   */
  function name() public view returns (string) {
    return name_;
  }

  /**
   * @dev Gets the token symbol
   * @return string representing the token symbol
   */
  function symbol() public view returns (string) {
    return symbol_;
  }

  /**
   * @dev Returns an URI for a given token ID
   * @dev Throws if the token ID does not exist. May return an empty string.
   * @param _tokenId uint256 ID of the token to query
   */
  function tokenURI(uint256 _tokenId) public view returns (string) {
    require(exists(_tokenId));
    return tokenURIs[_tokenId];
  }

  /**
   * @dev Internal function to set the token URI for a given token
   * @dev Reverts if the token ID does not exist
   * @param _tokenId uint256 ID of the token to set its URI
   * @param _uri string URI to assign
   */
  function _setTokenURI(uint256 _tokenId, string _uri) internal {
    require(exists(_tokenId));
    tokenURIs[_tokenId] = _uri;
  }

  /**
   * @dev Gets the token ID at a given index of the tokens list of the requested holder
   * @param _holder ID to query the tokens of
   * @param _holderOrigin address of the holder's origin
   * @param _index uint256 representing the index to be accessed of the requested tokens list
   * @return uint256 token ID at the given index of the tokens list owned by the requested holder
   */
  function tokenOfHolderByIndex(uint256 _holder, address _holderOrigin, uint256 _index) public view returns (uint256) {
    require(_index < balanceOf(_holder, _holderOrigin));
    return heldTokens[_holderOrigin][_holder][_index];
  }

  /**
   * @dev Gets the total amount of tokens stored by the contract
   * @return uint256 representing the total amount of tokens
   */
  function totalSupply() public view returns (uint256) {
    return allTokens.length;
  }

  /**
   * @dev Gets the token ID at a given index of all the tokens in this contract
   * @dev Reverts if the index is greater or equal to the total number of tokens
   * @param _index uint256 representing the index to be accessed of the tokens list
   * @return uint256 token ID at the given index of the tokens list
   */
  function tokenByIndex(uint256 _index) public view returns (uint256) {
    require(_index < totalSupply());
    return allTokens[_index];
  }

  /**
   * @dev Internal function to add a token ID to the list of a given holder
   * @param _to uint256 ID representing the new holder of the given token ID
   * @param _toOrigin address of the new holder's origin
   * @param _tokenId uint256 ID of the token to be added to the tokens list of the given holder ID
   */
  function addTokenTo(uint256 _to, address _toOrigin, uint256 _tokenId) internal {
    super.addTokenTo(_to, _toOrigin, _tokenId);
    uint256 length = heldTokens[_toOrigin][_to].length;
    heldTokens[_toOrigin][_to].push(_tokenId);
    heldTokensIndex[_tokenId] = length;
  }

  /**
   * @dev Internal function to remove a token ID from the list of a given holder ID
   * @param _from uint256 ID representing the previous holder of the given token ID
   * @param _fromOrigin address of the previous holder's origin
   * @param _tokenId uint256 ID of the token to be removed from the tokens list of the given holder ID
   */
  function removeTokenFrom(uint256 _from, address _fromOrigin, uint256 _tokenId) internal {
    super.removeTokenFrom(_from, _fromOrigin, _tokenId);

    uint256 tokenIndex = heldTokensIndex[_tokenId];
    uint256 lastTokenIndex = heldTokens[_fromOrigin][_from].length.sub(1);
    uint256 lastToken = heldTokens[_fromOrigin][_from][lastTokenIndex];

    heldTokens[_fromOrigin][_from][tokenIndex] = lastToken;
    heldTokens[_fromOrigin][_from][lastTokenIndex] = 0;
    // Note that this will handle single-element arrays. In that case, both tokenIndex and lastTokenIndex are going to
    // be zero. Then we can make sure that we will remove _tokenId from the heldTokens list since we are first swapping
    // the lastToken to the first position, and then dropping the element placed in the last position of the list

    heldTokens[_fromOrigin][_from].length--;
    heldTokensIndex[_tokenId] = 0;
    heldTokensIndex[lastToken] = tokenIndex;
  }

  /**
   * @dev Internal function to mint a new token
   * @dev Reverts if the given token ID already exists
   * @param _to The holder ID that will hold the minted token
   * @param _toOrigin address of the holder's origin
   * @param _tokenId uint256 ID of the token to be minted by the msg.sender
   */
  function _mint(uint256 _to, address _toOrigin, uint256 _tokenId) internal {
    super._mint(_to, _toOrigin, _tokenId);
    // Update the tokens data structure used for enumeration
    allTokensIndex[_tokenId] = allTokens.length;
    allTokens.push(_tokenId);
  }

  /**
   * @dev Internal function to burn a specific token
   * @dev Reverts if the token does not exist
   * @param _owner owner of the token to burn
   * @param _tokenId uint256 ID of the token being burned by the msg.sender
   */
  function _burn(address _owner, uint256 _tokenId) internal {
    super._burn(_owner, _tokenId);

    // Clear metadata (if any)
    if (bytes(tokenURIs[_tokenId]).length != 0) {
      delete tokenURIs[_tokenId];
    }

    // Reorg all tokens array
    uint256 tokenIndex = allTokensIndex[_tokenId];
    uint256 lastTokenIndex = allTokens.length.sub(1);
    uint256 lastToken = allTokens[lastTokenIndex];

    allTokens[tokenIndex] = lastToken;
    allTokens[lastTokenIndex] = 0;

    allTokens.length--;
    allTokensIndex[_tokenId] = 0;
    allTokensIndex[lastToken] = tokenIndex;
  }

}
