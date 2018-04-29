pragma solidity ^0.4.23;

import "./ERC721HoldingsMintable.sol";
import "./ERC721Holdings.sol";

/**
 * @title Holdings of ERC-721 Non-Fungible Token Standard, optional metadata mintable extension
 * @dev see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md
 */
contract ERC721HoldingsMetadataMintable is ERC721HoldingsMintable, ERC721Holdings {

  /**
   * @dev Function to mint a new token
   * @dev Reverts if the given token ID already exists
   * @param _to The holder ID that will hold the minted token
   * @param _toOrigin address of the holder's origin
   * @param _tokenId uint256 ID of the token to be minted by the msg.sender
   */
  function mint(uint256 _to, address _toOrigin, uint256 _tokenId, string _uri) public;

  /**
   * @dev Set the token URI for a given token
   * @dev Reverts if the token ID does not exist
   * @param _tokenId uint256 ID of the token to set its URI
   * @param _uri string URI to assign
   */
  function setTokenURI(uint256 _tokenId, string _uri) public;

}
